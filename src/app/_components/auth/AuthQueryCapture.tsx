"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import apiClient from "@/lib/api";
import LocalStorage from "@/lib/localStorage";
import useIsLoginStore from "@/store/loginStore";
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  setCookie,
} from "@/lib/cookieUtils";

/**
 * 전역 Kakao 로그인 콜백 캐처.
 *
 * auth 서버 `redirectType=QUERY_PARAM` 은 사용자가 지정한 `redirectUrl` 에
 * `?accessToken=...&refreshToken=...` 를 붙여 리다이렉트한다. redirectUrl 이
 * `/auth/kakao` 처럼 특정 경로가 아니라 루트(`/`) 로 설정돼있을 수 있으므로,
 * **어느 페이지에서든** URL 의 토큰 파라미터를 감지해 쿠키에 저장하고 URL 을 정리한다.
 *
 * 기존 전용 페이지(`/auth/kakao/page.tsx`) 는 그대로 두되 이 컴포넌트가 보험 역할.
 */
export default function AuthQueryCapture() {
  const router = useRouter();
  const pathname = usePathname();
  const setLogin = useIsLoginStore((s) => s.setLogin);

  // QUERY_PARAM redirect_type 흐름 — auth-server 가 ?accessToken=&refreshToken= 으로 redirect 한 케이스
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    if (!accessToken || !refreshToken) return;

    console.info("[fmp:auth] capturing tokens from URL", { pathname });
    setCookie(COOKIE_ACCESS_TOKEN, accessToken);
    setCookie(COOKIE_REFRESH_TOKEN, refreshToken);
    setLogin();

    // 민감 쿼리 제거 — 이후 새로고침·공유 시 URL 에 토큰 안 남게
    const cleaned = new URL(window.location.href);
    ["accessToken", "refreshToken", "accessTokenExpiresIn", "refreshTokenExpiresIn"].forEach((k) =>
      cleaned.searchParams.delete(k),
    );
    router.replace(cleaned.pathname + (cleaned.search ? `?${cleaned.searchParams}` : ""));

    fetchUserProfile("query-param", setLogin);
  }, [pathname, router, setLogin]);

  // REDIRECT_WITH_COOKIE 흐름 — auth-server 가 httpOnly cookie 만 set 한 케이스.
  // JS 가 httpOnly cookie 를 읽을 수 없으므로 (document.cookie 접근 X), 로그인 여부는
  // /user/me 200/401 응답으로 판정한다 (서버 응답이 SSOT). 쿠키는 axios withCredentials=true
  // 로 자동 첨부됨.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // 이미 프로필 있으면 skip (페이지 이동/새로고침 시 중복 호출 방지)
    if (LocalStorage.getItem("email")) {
      setLogin();
      return;
    }
    fetchUserProfile("cookie", setLogin);
  }, [setLogin]);

  // 확인용 상태 로그 — LocalStorage 프로필 보유 여부 (httpOnly cookie 는 JS 가 못 읽으므로
  // 로그인 상태는 LocalStorage 프로필 또는 /user/me 응답으로 판정).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasProfile = Boolean(LocalStorage.getItem("email"));
    console.info(`[fmp:auth] mount check pathname=${pathname} hasProfile=${hasProfile}`);
  }, [pathname]);

  return null;
}

function fetchUserProfile(via: "query-param" | "cookie", setLogin: () => void): void {
  apiClient
    .get("/user/me")
    .then((res) => {
      LocalStorage.setItem("email", JSON.stringify(res.data.data.email));
      LocalStorage.setItem("name", JSON.stringify(res.data.data.name));
      LocalStorage.setItem("role", JSON.stringify(res.data.data.role));
      setLogin();
      console.info(`[fmp:auth] user profile loaded (via ${via})`);
    })
    .catch(() => {
      // 미인증 (cookie 미보유 또는 만료) — 사용자가 로그인 안 한 정상 상태일 수 있어 silent.
      console.info(`[fmp:auth] not logged in (via ${via})`);
    });
}
