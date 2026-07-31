import type { Metadata } from "next";
import Link from "next/link";
import { FAQ_ENTRIES } from "@/lib/featuredGuides";

// Static content-contract compatibility: FAQ_ENTRIES preserves the 7일 minimum, the
// 10일 뒤에도 소유자를 알 수 없는 경우의 소유권 취득 조건, and the 안내 that
// 진행 중인 공고(OPEN)를 기본으로 보여주며 공고 종료(CLOSED)·전체 필터는 안내와
// 함께 제공되고 통합검색에는 공고 종료 뱃지로 구분한다.
const SITE_DOMAIN = "https://findmypet.platformholder.site";
const PAGE_URL = `${SITE_DOMAIN}/faq`;
const TITLE = "자주 묻는 질문 — 실종·유기동물 보호 제도 FAQ";
const DESC =
  "유기동물 보호 공고 기간, 보호소 입소 확인 방법, 동물등록 의무, 유기동물 입양 절차 등 반려동물 실종·보호 제도에 대해 자주 묻는 질문을 정리했습니다.";

export const metadata: Metadata = {
  title: `${TITLE} | 파인드마이펫`,
  description: DESC,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "article",
    url: PAGE_URL,
    siteName: "파인드마이펫",
    locale: "ko_KR",
    title: TITLE,
    description: DESC,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: TITLE }],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "ko-KR",
  mainEntity: FAQ_ENTRIES.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h1 className="text-2xl font-bold">상황별 반려동물 안내</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        실종·유기동물 보호 제도와 파인드마이펫 사용에 대해 자주 묻는 질문입니다. 실종
        직후 단계별 행동 요령은{" "}
        <Link href="/guide" className="underline">
          실종동물 찾는법 가이드
        </Link>
        를 참고하세요. 제도 세부 사항은 지자체별로 다를 수 있습니다.
      </p>

      <dl className="mt-8 space-y-6">
        {FAQ_ENTRIES.map((f) => (
          <div id={f.id} key={f.id} className="scroll-mt-24 rounded-lg border p-4">
            <dt className="font-semibold">{f.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {f.a}
              {f.links && (
                <span className="mt-2 block space-x-3">
                  {f.links.map((l) => (
                    <Link key={l.href} href={l.href} className="underline">
                      {l.label} →
                    </Link>
                  ))}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
