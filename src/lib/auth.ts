import apiClient from "./api";

/**
 * 로그아웃 — 서버에서 refresh 토큰 폐기 + HttpOnly 쿠키 만료.
 *
 * HttpOnly 쿠키는 JS(document.cookie)로 지울 수 없으므로 반드시 revoke API 를 호출해야 한다.
 * 게이트웨이가 passport 를 주입(이 경로는 강제 인증) → auth-server 가 쿠키/Redis refresh 를 정리한다.
 * 서버 폐기가 실패해도 클라이언트 로컬 프로필은 항상 비운다(best-effort).
 */
export async function requestLogout(): Promise<void> {
  try {
    await apiClient.post("/auth/token/revoke");
  } catch {
    // 서버 폐기 실패해도 로컬 정리는 진행한다.
  } finally {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("email");
      window.localStorage.removeItem("name");
      window.localStorage.removeItem("role");
    }
  }
}
