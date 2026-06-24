"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * guide 페이지의 유일한 인터랙티브 요소 — "전단지 만들기" 버튼.
 * 본문은 서버 컴포넌트(크롤링/구조화데이터)로 두고 이 버튼만 client 로 분리.
 */
export default function FlyerButton() {
  const router = useRouter();
  return (
    <Button size="sm" onClick={() => router.push("/profile")}>
      전단지 만들기
    </Button>
  );
}
