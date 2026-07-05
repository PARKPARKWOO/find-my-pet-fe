import type { Metadata } from "next";
import Link from "next/link";
import { fetchSidoList, regionPath, SITE_DOMAIN } from "@/lib/region";

export const revalidate = 86_400;

const PAGE_URL = `${SITE_DOMAIN}/abandonment/region`;
const TITLE = "지역별 유기동물 보호 공고 — 전국 시도별 안내";
const DESC =
  "서울·부산·인천 등 전국 시도별 유기동물 보호 공고를 한눈에. 우리 동네 보호소에 들어온 아이들을 지역별로 확인하고, 잃어버린 반려동물을 찾아보세요.";

export const metadata: Metadata = {
  title: `${TITLE} | 파인드마이펫`,
  description: DESC,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: "파인드마이펫",
    locale: "ko_KR",
    title: TITLE,
    description: DESC,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: TITLE }],
  },
};

export default async function RegionIndexPage() {
  const sidoList = await fetchSidoList();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_DOMAIN },
      { "@type": "ListItem", position: 2, name: "지역별 보호 공고", item: PAGE_URL },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <h1 className="text-2xl font-bold">지역별 유기동물 보호 공고</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        동물보호관리시스템 공공데이터 기준, 시도를 선택하면 시군구별 보호 공고를 볼 수
        있습니다. 반려동물을 잃어버렸다면 실종 지역 주변 보호소 공고를 가장 먼저
        확인하세요.
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sidoList.map((sido) => (
          <li key={sido.orgCd}>
            <Link
              href={regionPath(sido.orgdownNm)}
              className="block rounded-lg border p-4 text-center font-medium hover:bg-accent"
            >
              {sido.orgdownNm}
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-lg border bg-muted/40 p-4 text-sm">
        <h2 className="font-semibold">반려동물을 잃어버리셨나요?</h2>
        <p className="mt-1 text-muted-foreground">
          실종 직후 대처 순서는{" "}
          <Link href="/guide" className="underline">
            실종동물 찾는법 가이드
          </Link>
          에, 보호소·공고 제도 관련 궁금증은{" "}
          <Link href="/faq" className="underline">
            자주 묻는 질문
          </Link>
          에 정리돼 있습니다.
        </p>
      </section>
    </main>
  );
}
