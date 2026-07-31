import axios from "axios";
import apiClient from "./api";

/**
 * 프로필 캐시 비우기.
 *
 * 3키(email/name/role)는 로그아웃·탈퇴·401 인터셉터 세 곳에서 지워지므로 한 곳에 모아 둔다.
 * 반드시 멱등이어야 한다 — 인터셉터가 401 을 보고 먼저 지운 뒤 여기로 다시 들어오는 경로가 있다.
 */
export function clearProfileCache(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("email");
  window.localStorage.removeItem("name");
  window.localStorage.removeItem("role");
}

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
    clearProfileCache();
  }
}

/** 탈퇴 확인 화면에 보여줄 "사라질 항목"의 건수. 개인정보 본문은 담기지 않는다(건수만). */
export interface WithdrawalPreview {
  posts: number;
  postImages: number;
  sightings: number;
  flyers: number;
  bookmarks: number;
  abandonedSubscriptions: number;
  notifications: number;
  reviews: number;
  total: number;
}

/**
 * 파기·탈퇴는 여러 테이블을 한 트랜잭션으로 훑기 때문에 기본 5초 타임아웃으로는 짧다.
 * 타임아웃으로 끊어도 서버는 그대로 진행하므로, 화면에는 실패로 보이는데 실제로는 파기된
 * 최악의 어긋남이 생긴다. 두 API 모두 멱등이라 넉넉히 기다렸다 재시도하는 편이 안전하다.
 */
const WITHDRAW_TIMEOUT_MS = 20_000;

/** 탈퇴 시 사라질 데이터의 건수 조회. 이용자가 무엇이 지워지는지 모르고 누르는 일이 없어야 한다. */
export async function fetchWithdrawalPreview(): Promise<WithdrawalPreview> {
  const res = await apiClient.get("/user/me/withdrawal-preview");
  return res.data.data as WithdrawalPreview;
}

/**
 * 탈퇴 1단계 — 파인드마이펫에 남은 개인정보 파기.
 *
 * 반드시 계정 탈퇴(2단계)보다 먼저다. 인증이 살아 있어야 서버가 본인 확인을 할 수 있고,
 * 순서를 뒤집으면 인증이 끊긴 뒤라 게시글의 전화번호가 주인 없이 남는다.
 * 멱등이므로 재시도해도 안전하다.
 */
export async function destroyMyServiceData(): Promise<void> {
  await apiClient.delete("/user/me/data", { timeout: WITHDRAW_TIMEOUT_MS });
}

/**
 * 탈퇴 2단계 — auth-server 계정 탈퇴(카카오 연결 해제 포함).
 *
 * 응답의 Set-Cookie 가 인증 쿠키를 만료시킨다. JS 는 HttpOnly 쿠키를 못 지우므로
 * 세션 종료는 전적으로 이 응답에 의존한다. revoke 를 내부에 포함하므로 별도 로그아웃 호출은 없다.
 * 이미 탈퇴한 계정이 다시 호출해도 200 이다(멱등).
 */
export async function withdrawAccount(): Promise<void> {
  await apiClient.delete("/auth/user/me", { timeout: WITHDRAW_TIMEOUT_MS });
}

/**
 * 미인증 응답인지 판별.
 *
 * 탈퇴 도중 401/403 은 "탈퇴 실패"가 아니라 "세션 만료"라서 안내 문구가 달라야 한다
 * (다시 로그인하면 그대로 이어서 진행할 수 있다). 게이트웨이는 passport 가 없으면 403 을 준다.
 */
export function isUnauthorizedError(error: unknown): boolean {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return status === 401 || status === 403;
}
