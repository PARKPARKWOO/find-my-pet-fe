import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  decodeParam,
  extractShelters,
  fetchAbandonedByRegion,
  regionPath,
  resolveSido,
  resolveSigungu,
  SITE_DOMAIN,
} from "@/lib/region";
import { formatDate } from "@/lib/utils";

export const revalidate = 1_800;

interface Props {
  params: { sido: string; sigungu: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sidoName = decodeParam(params.sido);
  const sigunguName = decodeParam(params.sigungu);
  const url = `${SITE_DOMAIN}${regionPath(sidoName, sigunguName)}`;
  const title = `${sigunguName} 유기동물 보호 공고 — ${sidoName}`;
  const desc = `${sidoName} ${sigunguName} 유기동물 보호 공고와 보호소 연락처. 잃어버린 강아지·고양이가 보호소에 입소했는지 확인하세요.`;
  return {
    title: `${title} | 파인드마이펫`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "파인드마이펫",
      locale: "ko_KR",
      title,
      description: desc,
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function SigunguPage({ params }: Props) {
  const sidoName = decodeParam(params.sido);
  const sigunguName = decodeParam(params.sigungu);

  const sido = await resolveSido(sidoName);
  if (!sido) notFound();
  const sigungu = await resolveSigungu(sido.orgCd, sigunguName);
  if (!sigungu) notFound();

  const page = await fetchAbandonedByRegion({
    uprCd: sido.orgCd,
    orgCd: sigungu.orgCd,
    numOfRows: 24,
  });
  const shelters = extractShelters(page.contents);
  const url = `${SITE_DOMAIN}${regionPath(sidoName, sigunguName)}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: SITE_DOMAIN },
        {
          "@type": "ListItem",
          position: 2,
          name: "지역별 보호 공고",
          item: `${SITE_DOMAIN}/abandonment/region`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: sidoName,
          item: `${SITE_DOMAIN}${regionPath(sidoName)}`,
        },
        { "@type": "ListItem", position: 4, name: sigunguName, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${sigunguName} 유기동물 보호 공고`,
      description: `${sidoName} ${sigunguName} 보호중 유기동물 ${page.totalCount}건`,
      url,
      inLanguage: "ko-KR",
      isPartOf: { "@type": "WebSite", name: "파인드마이펫", url: SITE_DOMAIN },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: page.totalCount,
        itemListElement: page.contents.slice(0, 10).map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.kindCd ?? "구조동물",
          url: `${SITE_DOMAIN}/abandonment/${item.desertionNo}`,
        })),
      },
    },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="text-xs text-muted-foreground">
        <Link href="/abandonment/region" className="underline">
          지역별 보호 공고
        </Link>{" "}
        /{" "}
        <Link href={regionPath(sidoName)} className="underline">
          {sidoName}
        </Link>{" "}
        / {sigunguName}
      </nav>
      <h1 className="mt-2 text-2xl font-bold">
        {sigunguName} 유기동물 보호 공고
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {sidoName} {sigunguName}에서 보호중인 공고{" "}
        <strong>{page.totalCount.toLocaleString()}건</strong> (동물보호관리시스템
        공공데이터, 매시간 갱신). 잃어버린 반려동물이 있다면 아래 공고와 보호소에
        직접 확인하는 것이 가장 빠릅니다.
      </p>

      {page.contents.length === 0 ? (
        <p className="mt-8 rounded-lg border p-6 text-center text-sm text-muted-foreground">
          현재 {sigunguName}에 보호중 공고가 없습니다.{" "}
          <Link href={regionPath(sidoName)} className="underline">
            {sidoName} 전체 공고
          </Link>
          를 확인해보세요.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {page.contents.map((item) => (
            <li key={item.desertionNo}>
              <Link
                href={`/abandonment/${item.desertionNo}`}
                className="block overflow-hidden rounded-lg border hover:bg-accent"
              >
                {item.popfile && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.popfile}
                    alt={`${sigunguName} 보호중 ${item.kindCd ?? "동물"}`}
                    className="h-32 w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-2 text-xs">
                  <div className="font-medium">{item.kindCd ?? "구조동물"}</div>
                  <div className="mt-0.5 line-clamp-1 text-muted-foreground">
                    {item.happenPlace ?? ""}
                  </div>
                  {item.happenDt && (
                    <div className="mt-0.5 text-muted-foreground">
                      발견 {formatDate(item.happenDt)}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {shelters.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold">{sigunguName} 관할 보호소</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {shelters.map((s) => (
              <li key={s.name} className="rounded-md border p-3">
                <div className="font-medium">{s.name}</div>
                {s.addr && <div className="text-muted-foreground">{s.addr}</div>}
                {s.tel && (
                  <a href={`tel:${s.tel}`} className="text-muted-foreground underline">
                    {s.tel}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 rounded-lg border bg-muted/40 p-4 text-sm">
        <h2 className="font-semibold">
          {sigunguName}에서 반려동물을 잃어버리셨나요?
        </h2>
        <p className="mt-1 text-muted-foreground">
          실종 직후 순서대로:{" "}
          <Link href="/guide" className="underline">
            실종동물 찾는법 가이드
          </Link>{" "}
          확인 →{" "}
          <Link href="/register" className="underline">
            실종 신고 등록
          </Link>{" "}
          → 위 보호소 공고 매일 확인. 보호소·공고 제도가 궁금하다면{" "}
          <Link href="/faq" className="underline">
            자주 묻는 질문
          </Link>
          을 보세요.
        </p>
      </section>
    </main>
  );
}
