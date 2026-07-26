"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * guide 페이지의 유일한 인터랙티브 요소 — "전단지 만들기" 버튼.
 * 본문은 서버 컴포넌트(크롤링/구조화데이터)로 두고 이 버튼만 client 로 분리.
 *
 * /profile 이 아니라 /flyer 로 보낸다. 실종 직후에 필요한 건 전단지이지 회원가입과 게시글
 * 등록이 아니다 — 게시글이 이미 있는 사용자를 위한 안내는 /flyer 페이지 하단에 둔다.
 */
export default function FlyerButton() {
  const router = useRouter();
  return (
    <Button size="sm" onClick={() => router.push("/flyer")}>
      전단지 만들기
    </Button>
  );
}
