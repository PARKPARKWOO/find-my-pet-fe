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

export const metadata: Metadata = {
  title: "파인드마이펫 | 실종동물 공유게시판",
  description:
    "파인드마이펫은 실종된 동물의 정보를 공유하여 찾을 수 있도록 도와주는 커뮤니티입니다. 실종 정보를 등록하고 실종 시 대처 가이드라인을 참고하세요.",
  icons: {
    icon: "../static/image/favicon.png",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
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
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
        )}
        <AdSenseScript />
        <AdFitScript />
        <KakaoMapScript />
        <AuthQueryCapture />
        <div className="w-full flex flex-col min-h-screen h-full">
          <Navigation />
          <div className="flex flex-grow justify-center p-6 ">
            <div className="max-w-[1280px] w-full">{children}</div>
          </div>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
