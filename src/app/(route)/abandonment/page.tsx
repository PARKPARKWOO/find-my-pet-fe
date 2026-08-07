import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AbandonmentList from "@/app/_components/main/AbandonmentList";
import { SITE_DOMAIN } from "@/lib/region";

const PAGE_URL = `${SITE_DOMAIN}/abandonment`;
const TITLE = "보호소에서 가족을 기다려요";
const DESCRIPTION =
  "동물보호관리시스템 공공데이터를 바탕으로 전국 보호소의 유기동물 보호 공고를 확인합니다. 지역별 공고와 보호소 정보도 함께 볼 수 있습니다.";

export const metadata: Metadata = {
  title: `${TITLE} | 파인드마이펫`,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: "파인드마이펫",
    locale: "ko_KR",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: TITLE }],
  },
};

export default function AbandonmentIndexPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_DOMAIN },
      { "@type": "ListItem", position: 2, name: TITLE, item: PAGE_URL },
    ],
  };
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    url: PAGE_URL,
    description: DESCRIPTION,
    inLanguage: "ko-KR",
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <nav aria-label="현재 위치" className="text-xs text-muted-foreground">
        <Link href="/" className="underline">
          홈
        </Link>{" "}
        / {TITLE}
      </nav>
      <h1 className="mt-2 text-2xl font-bold">{TITLE}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{DESCRIPTION}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        공고 상태와 보호소의 최신 안내는 해당 보호소에 직접 확인해 주세요.{" "}
        <Link href="/abandonment/region" className="text-forest underline">
          지역별 보호 공고 보기
        </Link>
      </p>
      <section className="mt-8" aria-label="유기동물 보호 공고 목록">
        <Suspense
          fallback={
            <p className="py-10 text-center text-sm text-muted-foreground">
              목록을 불러오는 중이에요.
            </p>
          }
        >
          <AbandonmentList />
        </Suspense>
      </section>
    </main>
  );
}
