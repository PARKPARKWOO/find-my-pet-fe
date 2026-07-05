import type { Metadata } from "next";
import Link from "next/link";

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

/**
 * 답변은 제도 일반 사실 범위 내에서만 서술 (지자체별 차이는 명시).
 * 첫 문장이 곧 답이 되도록 작성 — 생성형 검색이 인용하기 좋은 형태.
 */
const FAQS: Array<{ q: string; a: string; links?: Array<{ href: string; label: string }> }> = [
  {
    q: "잃어버린 반려동물이 보호소에 있는지 어떻게 확인하나요?",
    a: "동물보호관리시스템의 보호 공고를 실종 지역과 인근 시군구까지 넓혀 매일 확인하는 것이 가장 확실합니다. 파인드마이펫의 지역별 보호 공고 페이지에서 시군구를 선택하면 해당 지역 공고와 보호소 연락처를 한 번에 볼 수 있고, 관심 지역을 구독하면 새 공고가 등록될 때 알림을 받을 수 있습니다.",
    links: [
      { href: "/abandonment/region", label: "지역별 보호 공고" },
      { href: "/guide", label: "실종동물 찾는법 가이드" },
    ],
  },
  {
    q: "유기동물 보호 공고 기간은 얼마나 되나요?",
    a: "동물보호법에 따라 지자체는 구조한 동물을 공고하며, 공고일로부터 10일이 지나도 소유자를 알 수 없으면 소유권이 지자체로 넘어갑니다. 그 전에 보호자가 확인하면 반환받을 수 있으므로, 실종 직후 열흘간은 공고를 매일 확인하는 것이 중요합니다.",
  },
  {
    q: "보호소에 있는 내 아이를 찾았어요. 바로 데려올 수 있나요?",
    a: "소유자임을 확인할 수 있으면 반환받을 수 있습니다. 신분증과 함께 동물등록 정보, 사진, 특징 설명 등 소유자임을 증명할 자료를 준비해 보호소에 연락한 뒤 방문하세요. 지자체에 따라 보호 기간 동안의 사육·치료 비용이 청구될 수 있습니다.",
  },
  {
    q: "동물등록은 의무인가요?",
    a: "네, 주택 등에서 기르는 2개월령 이상의 개는 동물등록이 법적 의무입니다. 내장형 칩으로 등록하면 보호소 입소 시 스캔만으로 보호자를 찾을 수 있어 반환 확률이 크게 올라갑니다. 소유자나 주소·전화번호가 바뀌면 변경 신고도 해야 합니다.",
  },
  {
    q: "길에서 헤매는 동물을 발견하면 어떻게 해야 하나요?",
    a: "임의로 데려가 기르지 말고 관할 시군구청 동물보호 부서나 지역 보호소에 신고하세요. 주인이 찾고 있는 반려동물일 수 있습니다. 목줄·인식표가 있다면 연락처를 확인하고, 파인드마이펫 실종 게시판에서 해당 지역 실종 신고를 검색해보는 것도 도움이 됩니다.",
    links: [{ href: "/", label: "실종 게시판" }],
  },
  {
    q: "공고 기간이 끝난 유기동물은 어떻게 되나요?",
    a: "공고 후 10일이 지나면 소유권이 지자체로 이전되고, 입양 절차를 통해 새 가족을 찾게 됩니다. 보호소 수용 여건에 따라 결과가 달라질 수 있으므로, 입양을 고려한다면 공고 중인 동물도 미리 봐두고 보호소에 입양 의사를 밝혀두는 것이 좋습니다.",
  },
  {
    q: "유기동물 입양은 어떻게 하나요?",
    a: "보호 공고에서 마음에 드는 아이를 찾아 해당 보호소에 입양 의사를 전달하면 됩니다. 공고 기간이 끝난 동물부터 입양이 가능하며, 지자체별로 입양 신청서 작성, 상담, 사전 교육 등의 절차가 있을 수 있습니다. 일부 지자체는 입양비·중성화 지원금을 제공합니다.",
    links: [{ href: "/abandonment/region", label: "지역별 보호 공고에서 찾아보기" }],
  },
  {
    q: "실종 신고는 어디에 해야 하나요?",
    a: "관할 시군구청 동물보호 부서와 인근 보호소에 실종 사실을 알리고, 동물보호관리시스템 공고를 확인하세요. 병행해서 파인드마이펫에 실종 게시글을 등록하면 품종별 탐색 반경 지도와 전단지 템플릿, 목격 제보 기능을 활용할 수 있습니다.",
    links: [{ href: "/register", label: "실종 신고 등록" }],
  },
  {
    q: "파인드마이펫의 보호 공고 데이터는 어디서 오나요?",
    a: "농림축산식품부 동물보호관리시스템 공공데이터를 매시간 동기화합니다. 주인을 찾았거나 입양 등으로 종료된 공고는 목록에서 자동으로 내려가며, 진행중인 공고만 노출됩니다.",
  },
  {
    q: "탐색 반경 지도는 어떤 원리인가요?",
    a: "실종 동물의 종·품종과 경과 시간을 바탕으로 통계 기반 탐색 반경을 계산해, 실제 도로망 기준 도달 가능 영역을 지도에 표시합니다. 개는 시간이 지날수록 반경이 넓어지고, 고양이는 대부분 실종 지점 근처에 숨어 있어 좁은 반경부터 수색하도록 안내합니다.",
    links: [{ href: "/guide", label: "가이드에서 자세히 보기" }],
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "ko-KR",
  mainEntity: FAQS.map((f) => ({
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
      <h1 className="text-2xl font-bold">자주 묻는 질문</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        실종·유기동물 보호 제도와 파인드마이펫 사용에 대해 자주 묻는 질문입니다. 실종
        직후 단계별 행동 요령은{" "}
        <Link href="/guide" className="underline">
          실종동물 찾는법 가이드
        </Link>
        를 참고하세요. 제도 세부 사항은 지자체별로 다를 수 있습니다.
      </p>

      <dl className="mt-8 space-y-6">
        {FAQS.map((f) => (
          <div key={f.q} className="rounded-lg border p-4">
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
