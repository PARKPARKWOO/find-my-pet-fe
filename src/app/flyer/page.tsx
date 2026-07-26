import type { Metadata } from "next";
import Link from "next/link";
import FlyerStandaloneClient from "./FlyerStandaloneClient";

const SITE_DOMAIN = "https://findmypet.platformholder.site";
const PAGE_URL = `${SITE_DOMAIN}/flyer`;
const TITLE = "실종동물 전단지 만들기 — 가입 없이 바로 인쇄";
const DESC =
  "반려동물이 실종됐을 때 회원가입이나 게시글 등록 없이 바로 전단지를 만들어 인쇄·PDF 저장할 수 있습니다. 사진과 연락처를 넣고 A4 로 출력하세요.";

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
 * 전단지 만들기 진입 페이지.
 *
 * 폼 자체는 client 컴포넌트로 분리하고 이 파일은 서버 컴포넌트로 남겨 metadata 와 안내 문구를
 * 크롤러에 노출한다 — "실종동물 전단지 양식" 류 검색이 실제로 있는 질의라 색인 대상이다.
 * (게시글이 있는 사용자는 실종 상세의 전단지 버튼이 더 낫다는 안내를 아래에 둔다.)
 */
export default function FlyerPage() {
  return (
    <main>
      <FlyerStandaloneClient />
      <section className="mx-auto w-full max-w-2xl px-4 pb-12 text-sm text-gray-600">
        <h2 className="font-semibold text-gray-800">이미 실종 소식을 올리셨나요?</h2>
        <p className="mt-2 leading-relaxed">
          게시글이 있다면{" "}
          <Link href="/profile" className="underline">
            내 게시글
          </Link>{" "}
          에서 전단지를 만드는 쪽이 좋아요. 그때는 QR 이 실종 소식 상세로 연결돼 사진과 목격 제보를
          함께 보여줄 수 있어요.
        </p>
        <p className="mt-3 leading-relaxed">
          전단지를 붙인 뒤에는{" "}
          <Link href="/guide" className="underline">
            실종 대응 가이드
          </Link>{" "}
          의 다음 단계(동물병원·경찰·보호소 확인)도 함께 진행해 보세요.
        </p>
      </section>
    </main>
  );
}
