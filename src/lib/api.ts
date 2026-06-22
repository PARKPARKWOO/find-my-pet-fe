import { BASE_URL } from "@/app/constant/api";
import axios, { AxiosInstance, AxiosResponse } from "axios";

/**
 * 인증 모델: HttpOnly 쿠키 + 게이트웨이 자동 회전.
 *
 * - 토큰은 auth-server/게이트웨이가 `.platformholder.site` HttpOnly 쿠키로 관리한다.
 *   JS 는 토큰을 읽지도 쓰지도 않는다 (XSS 로 토큰 탈취 불가).
 * - 모든 요청은 withCredentials 로 쿠키를 자동 전송한다. Authorization 헤더 수동 부착 없음.
 * - access 만료는 게이트웨이(AuthenticateGrpcFilter)가 refresh 쿠키로 투명하게 회전하고
 *   새 쿠키를 Set-Cookie 로 내려준다. 따라서 프론트는 자체 reissue 를 절대 하지 않는다.
 *   (프론트가 따로 reissue 하면 회전식 일회용 refresh 토큰을 게이트웨이와 서로 무효화 → 로그인 풀림)
 * - 그럼에도 401/403 이 올라오면 = 미인증(또는 refresh 만료로 게이트웨이 회전 실패).
 *   자체 재발급 없이 전역 로그아웃 상태로 정리한다.
 */
export const UNAUTHORIZED_EVENT = "fmp:auth:unauthorized";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  withCredentials: true, // HttpOnly 쿠키 자동 전송 (.platformholder.site)
  headers: {
    "Content-Type": "application/json",
  },
});

// 응답 인터셉터 — 401/403 은 게이트웨이가 회전까지 시도한 뒤의 최종 미인증 상태.
// 여기서 reissue 를 하지 않고(게이트웨이가 담당), 로그인 중이었다면 세션 만료로 보고 전역에 알린다.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const status = error?.response?.status;
    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      // 프로필 캐시가 있었다 = 로그인 상태였다 → 세션 만료. (미로그인 사용자의 /user/me 401 은 무시)
      if (window.localStorage.getItem("email")) {
        window.localStorage.removeItem("email");
        window.localStorage.removeItem("name");
        window.localStorage.removeItem("role");
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
