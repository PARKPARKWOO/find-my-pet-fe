import Link from "next/link";
import FooterAd from "@/app/_components/ads/FooterAd";

export default function Footer() {
  return (
    <div className="flex flex-col items-center bg-gray-100">
      {/* 본문과 푸터 링크 사이. 읽던 흐름은 끊지 않으면서 스크롤 끝에서 실제로 보이는 자리다. */}
      <FooterAd />
      <footer className="w-[1280px] flex justify-center">
        <div className="w-[80%]  justify-between flex py-8 ">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-bold">파인드마이펫 🐶</div>
            <div className="text-xs"><b>Contact</b> wy9295@naver.com <br/>Copyright findmypet. All rights reserved</div>
          </div>
          <div className="flex md:gap-10 gap-4">
            <Link target="_blank" href="https://equinox-cemetery-0bf.notion.site/1582b2350b22803f8a82c010dd708efd" className="md:text-base text-xs font-bold break-keep">서비스 소개</Link>
            <Link target="_blank" href="https://equinox-cemetery-0bf.notion.site/1582b2350b22800ca843f55223cadc7f" className="md:text-base text-xs font-bold break-keep">개인정보 처리방침</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
