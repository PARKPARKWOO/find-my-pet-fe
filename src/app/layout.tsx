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

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const SITE_NAME = "파인드마이펫";
const SITE_DESCRIPTION =
  "파인드마이펫은 실종된 동물의 정보를 공유하여 찾을 수 있도록 도와주는 커뮤니티입니다. 실종 정보를 등록하고 실종 시 대처 가이드라인을 참고하세요.";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full flex flex-col items-center`}
      >
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
