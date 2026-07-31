import type { Metadata } from "next";
import Link from "next/link";
import LostList from "@/app/_components/main/LostList";
import { SITE_DOMAIN } from "@/lib/region";

const PAGE_URL = `${SITE_DOMAIN}/lost`;
const TITLE = "집을 잃었어요";
const DESCRIPTION =
  "실종된 반려동물 소식을 확인하고 목격 정보를 나눠 주세요. 실종 신고 등록, 전단지 제작, 단계별 대응 가이드도 이용할 수 있습니다.";

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

export default function LostIndexPage() {
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
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-blue-600 underline">
        <Link href="/register">실종 소식 등록</Link>
        <Link href="/flyer">전단지 먼저 만들기</Link>
        <Link href="/guide">실종 대응 가이드</Link>
      </div>
      <section className="mt-8" aria-label="실종 소식 목록">
        <LostList />
      </section>
    </main>
  );
}
