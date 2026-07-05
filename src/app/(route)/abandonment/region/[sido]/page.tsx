import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  decodeParam,
  fetchAbandonedByRegion,
  fetchSigunguList,
  regionPath,
  resolveSido,
  SITE_DOMAIN,
} from "@/lib/region";

export const revalidate = 3_600;

interface Props {
  params: { sido: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sidoName = decodeParam(params.sido);
  const url = `${SITE_DOMAIN}${regionPath(sidoName)}`;
  const title = `${sidoName} 유기동물 보호 공고`;
  const desc = `${sidoName} 시군구별 유기동물 보호 공고 모음. 보호소에 입소한 아이들을 확인하고 잃어버린 반려동물을 찾아보세요.`;
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

export default async function SidoPage({ params }: Props) {
  const sidoName = decodeParam(params.sido);
  const sido = await resolveSido(sidoName);
  if (!sido) notFound();

  const [sigunguList, page] = await Promise.all([
    fetchSigunguList(sido.orgCd),
    fetchAbandonedByRegion({ uprCd: sido.orgCd, numOfRows: 6 }),
  ]);

  const url = `${SITE_DOMAIN}${regionPath(sidoName)}`;
  const breadcrumbJsonLd = {
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
      { "@type": "ListItem", position: 3, name: sidoName, item: url },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav className="text-xs text-muted-foreground">
        <Link href="/abandonment/region" className="underline">
          지역별 보호 공고
        </Link>{" "}
        / {sidoName}
      </nav>
      <h1 className="mt-2 text-2xl font-bold">{sidoName} 유기동물 보호 공고</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        현재 {sidoName}에서 보호중인 공고 {page.totalCount.toLocaleString()}건. 시군구를
        선택하면 해당 지역 공고와 보호소 정보를 볼 수 있습니다.
      </p>

      <h2 className="mt-6 font-semibold">시군구 선택</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {sigunguList.map((sgg) => (
          <li key={sgg.orgCd}>
            <Link
              href={regionPath(sidoName, sgg.orgdownNm)}
              className="block rounded-md border px-3 py-2 text-center text-sm hover:bg-accent"
            >
              {sgg.orgdownNm}
            </Link>
          </li>
        ))}
      </ul>

      {page.contents.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold">{sidoName} 최근 공고</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                      alt={item.kindCd ?? "보호중 동물"}
                      className="h-28 w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-2 text-xs">
                    <div className="font-medium">{item.kindCd ?? "구조동물"}</div>
                    <div className="mt-0.5 line-clamp-1 text-muted-foreground">
                      {item.happenPlace ?? item.careNm ?? ""}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
