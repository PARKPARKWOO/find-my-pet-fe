import Link from "next/link";
import FooterAd from "@/app/_components/ads/FooterAd";

/**
 * 링크가 늘어나면서 고정폭(`w-[1280px]`)이 실제로 화면을 넘겼다. 뷰포트보다 넓은 고정폭은 좁은
 * 화면에서 가로 스크롤을 만들고 오른쪽 링크를 잘라먹는다 — 상한만 두고 폭 자체는 흐르게 한다.
 * 링크 묶음도 wrap 시켜 한 줄에 다 못 들어가면 아래로 접히게 한다.
 */
export default function Footer() {
  return (
    <div className="flex flex-col items-center bg-gray-100">
      {/* 본문과 푸터 링크 사이. 읽던 흐름은 끊지 않으면서 스크롤 끝에서 실제로 보이는 자리다. */}
      <FooterAd />
      <footer className="w-full max-w-[1280px] flex justify-center">
        <div className="w-[90%] md:w-[80%] flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between py-8">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-bold">파인드마이펫 🐶</div>
            <div className="text-xs">
              <b>Contact</b> wy9295@naver.com <br />
              Copyright findmypet. All rights reserved
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 md:gap-x-8">
            <Link
              target="_blank"
              href="https://equinox-cemetery-0bf.notion.site/1582b2350b22803f8a82c010dd708efd"
              className="md:text-base text-xs font-bold break-keep"
            >
              서비스 소개
            </Link>
            <Link href="/terms" className="md:text-base text-xs font-bold break-keep">
              이용약관
            </Link>
            {/* 개인정보 처리방침은 AdSense 필수 요건이라 외부 문서가 아니라 자사 도메인 경로여야 한다. */}
            <Link href="/privacy" className="md:text-base text-xs font-bold break-keep">
              개인정보 처리방침
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
