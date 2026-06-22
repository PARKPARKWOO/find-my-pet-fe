"use client";

import { useEffect } from "react";
import apiClient, { UNAUTHORIZED_EVENT } from "@/lib/api";
import LocalStorage from "@/lib/localStorage";
import useIsLoginStore from "@/store/loginStore";

/**
 * 전역 로그인 상태 결정자 (HttpOnly 쿠키 모델).
 *
 * 토큰은 `.platformholder.site` HttpOnly 쿠키로 서버가 관리하므로 JS 가 읽을 수 없다.
 * 따라서 로그인 여부는 `/user/me` 200/401 응답(서버가 SSOT)으로 판정한다.
 * 쿠키는 axios withCredentials=true 로 자동 첨부되고, access 만료는 게이트웨이가 회전한다.
 *
 * (구 QUERY_PARAM 흐름 — URL 의 ?accessToken=&refreshToken= 을 JS 쿠키로 저장 — 은
 *  게이트웨이 자동 회전과 충돌해 로그인이 풀리던 원인이라 제거했다. 백엔드 redirectType 은
 *  REDIRECT_WITH_COOKIE 를 전제로 한다.)
 */
export default function AuthQueryCapture() {
  const setLogin = useIsLoginStore((s) => s.setLogin);
  const setLogout = useIsLoginStore((s) => s.setLogout);

  // 페이지 로드 시 1회 세션 확인 (서버 응답이 SSOT)
  useEffect(() => {
    if (typeof window === "undefined") return;
    apiClient
      .get("/user/me")
      .then((res) => {
        LocalStorage.setItem("email", JSON.stringify(res.data.data.email));
        LocalStorage.setItem("name", JSON.stringify(res.data.data.name));
        LocalStorage.setItem("role", JSON.stringify(res.data.data.role));
        setLogin();
      })
      .catch(() => {
        // 미인증(미로그인 또는 refresh 만료) — 정상 상태일 수 있어 silent.
        LocalStorage.removeItem("email");
        LocalStorage.removeItem("name");
        LocalStorage.removeItem("role");
        setLogout();
      });
  }, [setLogin, setLogout]);

  // 사용 중 세션 만료(api 인터셉터의 401/403) 를 전역 로그아웃으로 반영
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onUnauthorized = () => setLogout();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [setLogout]);

  return null;
}
