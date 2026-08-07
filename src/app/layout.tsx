import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navigation from "@/app/_components/layout/Navigation";
import Footer from "@/app/_components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";
import GoogleAnalytics from "@/lib/GoogleAnalytics";
import AuthQueryCapture from "@/app/_components/auth/AuthQueryCapture";
import AdSenseScript from "@/app/_components/ads/AdSenseScript";
import AdFitScript from "@/app/_components/ads/AdFitScript";
import { ADSENSE_CLIENT } from "@/app/_components/ads/adsenseClient";
import KakaoMapScript from "@/app/_components/KakaoMapScript";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

const SITE_NAME = "파인드마이펫";
/**
 * 사이트 설명. 이 한 값이 meta description · og:description · twitter:description ·
 * Organization JSON-LD 에 함께 들어간다.
 *
 * **80자를 넘기지 말 것.** 네이버 서치어드바이저가 "80자 이내로 작성해주세요"로 지적한다.
 * 이전 문구는 81자로 딱 1자 초과였다. 길이를 줄이면서 실제로 제공하는 세 가지 —
 * 실종 신고 등록 · 유기동물 보호 공고 조회 · 실종 시 대처 가이드 — 를 모두 남겼다.
 */
const SITE_DESCRIPTION =
  "잃어버린 반려동물을 동네와 함께 찾습니다. 실종 신고 등록, 전국 유기동물 보호 공고 조회, 실종 시 대처 가이드 제공.";

export const metadata: Metadata = {
  // favicon 은 app/favicon.ico 가 자동 서빙되므로 icons 오버라이드 제거 (기존 경로는 깨져 있었음).
  metadataBase: new URL("https://findmypet.platformholder.site"),
  title: "파인드마이펫 | 실종동물 공유게시판",
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "실종동물",
    "실종동물 찾는법",
    "강아지 실종",
    "반려견 실종",
    "반려동물 찾기",
    "유기동물",
    "실종 전단지",
    "반려동물 실종 신고",
  ],
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      // 네이버 서치어드바이저 사이트 소유 확인 메타 태그
      "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ?? "",
    },
  },
  other: {
    // AdSense 사이트 소유 확인 수단. 광고 로더가 body 끝에 붙는 것과 무관하게 <head> 에 들어가므로
    // 심사 초기(광고를 아직 띄우지 않는 상태)에도 소유권 확인이 통과된다. ID 가 없으면 빈 태그를
    // 남기지 않기 위해 조건부로 넣는다.
    ...(ADSENSE_CLIENT ? { "google-adsense-account": ADSENSE_CLIENT } : {}),
  },
  alternates: {
    canonical: "https://findmypet.platformholder.site",
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "https://findmypet.platformholder.site",
    siteName: SITE_NAME,
    locale: "ko_KR",
    title: "파인드마이펫 | 실종동물 공유게시판",
    description: SITE_DESCRIPTION,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "파인드마이펫 | 실종동물 공유게시판",
    description: SITE_DESCRIPTION,
    images: ["/og.jpg"],
  },
};

// 사이트 전역 구조화 데이터 — 검색엔진/LLM 의 브랜드 엔티티 이해 강화.
const ORG_AND_SITE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://findmypet.platformholder.site/#organization",
      name: SITE_NAME,
      alternateName: "Find My Pet",
      url: "https://findmypet.platformholder.site",
      logo: "https://findmypet.platformholder.site/og.jpg",
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": "https://findmypet.platformholder.site/#website",
      name: SITE_NAME,
      url: "https://findmypet.platformholder.site",
      inLanguage: "ko-KR",
      publisher: { "@id": "https://findmypet.platformholder.site/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://findmypet.platformholder.site/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${pretendard.variable} antialiased w-full flex flex-col items-center`}
      >
        {/* eslint-disable-next-line react/no-danger */}
        <div
          hidden
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: 경황 중인 보호자가 3초 안에 다음 행동을 아는 밝은 동네 서비스. 어두운 감성 연출 대신 익숙한 로컬 앱 문법을 흠 없이 집행하고, 사진과 상태색이 정보를 끌고 간다.
OWN-WORLD: 흰 바탕(#FFF)과 웜 라이트 그레이 섹션(#F7F7F5), 프라이머리 웜 그린(#0D8348)과 틴트, 상태색 코랄/블루/그린/그레이, Pretendard 단일 서체의 무게 위계, 16px 라운드 카드와 부드러운 앰비언트 그림자, 카카오 노랑은 카카오 버튼에만.
STORY: 방문자는 첫 화면에서 "잃어버렸다/찾아주고 싶다" 중 자기 상황을 고르고, 사진 카드 피드에서 동네의 실종·보호 소식을 훑고, 등록·공유·전화 중 하나를 실행한다.
FIRST VIEWPORT: 좌측 큰 헤드라인+한 줄 서브텍스트+검색바, 우측 실사진 상황 카드 2장(집을 잃었어요/가족을 기다려요). 스크롤 없이 주행동 노출. 모바일은 세로 스택.
FORM: 카테고리 표준(밝은 로컬 서비스 캔온), 사용자 지정 standing exit, seed key 09b74aa6.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_AND_SITE_JSONLD) }}
        />
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
        )}
        <AdSenseScript />
        <AdFitScript />
        <KakaoMapScript />
        <AuthQueryCapture />
        <div className="w-full flex flex-col min-h-screen h-full">
          <a href="#main-content" className="sr-only focus:not-sr-only">
            본문으로 바로가기
          </a>
          <Navigation />
          <div
            id="main-content"
            tabIndex={-1}
            className="flex flex-grow justify-center px-4 py-6 md:px-6"
          >
            <div className="w-full max-w-page">{children}</div>
          </div>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
