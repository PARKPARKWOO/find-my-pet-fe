"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import apiClient from "@/lib/api";
import LocalStorage from "@/lib/localStorage";
import useIsLoginStore from "@/store/loginStore";
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  getCookie,
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

    fetchUserProfile("query-param");
  }, [pathname, router, setLogin]);

  // REDIRECT_WITH_COOKIE 흐름 — auth-server 가 cookie 만 set 하고 단순 redirect 한 케이스
  // (URL 에 query param 없음). cookie 가 존재하는데 프로필이 비어있으면 /user/me 호출.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasCookie = Boolean(getCookie(COOKIE_ACCESS_TOKEN));
    if (!hasCookie) return;
    // 이미 프로필 있으면 skip (중복 호출 방지)
    if (LocalStorage.getItem("email")) return;

    console.info("[fmp:auth] cookie present, fetching profile");
    setLogin();
    fetchUserProfile("cookie");
  }, [setLogin]);

  // 확인용 상태 로그 — cookie 존재 여부
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasAt = Boolean(getCookie(COOKIE_ACCESS_TOKEN));
    console.info(`[fmp:auth] mount check pathname=${pathname} hasAccessCookie=${hasAt}`);
  }, [pathname]);

  return null;
}

function fetchUserProfile(via: "query-param" | "cookie"): void {
  apiClient
    .get("/user/me")
    .then((res) => {
      LocalStorage.setItem("email", JSON.stringify(res.data.data.email));
      LocalStorage.setItem("name", JSON.stringify(res.data.data.name));
      LocalStorage.setItem("role", JSON.stringify(res.data.data.role));
      console.info(`[fmp:auth] user profile loaded (via ${via})`);
    })
    .catch((e) => {
      console.warn(`[fmp:auth] /user/me failed (via ${via})`, e);
    });
}
