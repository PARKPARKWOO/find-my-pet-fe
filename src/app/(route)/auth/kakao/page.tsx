import type { Metadata } from "next";
import Auth from "@/app/_components/auth/Auth";

// OAuth 콜백 페이지 — 색인 불필요/금지.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// HttpOnly 쿠키 모델: 토큰은 auth-server 가 쿠키로 심으므로 URL 파라미터를 읽지 않는다.
export default function KakaoAuth() {
  return <Auth />;
}
