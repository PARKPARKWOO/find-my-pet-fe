import Link from "next/link";
import { PawPrint } from "lucide-react";
import FooterAd from "@/app/_components/ads/FooterAd";

export default function Footer() {
  return (
    <div className="w-full bg-surface-canvas text-ink">
      {/* 본문과 푸터 링크 사이. 읽던 흐름은 끊지 않으면서 스크롤 끝에서 실제로 보이는 자리다. */}
      <FooterAd />
      <footer className="mx-auto w-full max-w-page border-t border-border px-4 md:px-6">
        <div className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-sm font-bold">
              <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-lg bg-forest text-content-inverse">
                <PawPrint className="size-3.5" strokeWidth={2.2} />
              </span>
              파인드마이펫
            </div>
            <div className="text-xs leading-5 text-content-muted">
              Contact wy9295@naver.com
              <br />
              Copyright findmypet. All rights reserved
            </div>
          </div>
          <nav aria-label="푸터" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              target="_blank"
              href="https://equinox-cemetery-0bf.notion.site/1582b2350b22803f8a82c010dd708efd"
              className="text-sm font-medium break-keep text-content-secondary hover:text-content-primary"
            >
              서비스 소개
            </Link>
            <Link href="/terms" className="text-sm font-medium break-keep text-content-secondary hover:text-content-primary">
              이용약관
            </Link>
            {/* 개인정보 처리방침은 AdSense 필수 요건이라 외부 문서가 아니라 자사 도메인 경로여야 한다. */}
            <Link href="/privacy" className="text-sm font-medium break-keep text-content-secondary hover:text-content-primary">
              개인정보 처리방침
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
