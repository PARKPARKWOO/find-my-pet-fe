import { BASE_URL } from "@/app/constant/api";
import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  getCookie,
  removeCookie,
  setCookie,
} from "./cookieUtils";

let isRefreshing = false;
let refreshedTokenPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  withCredentials: true, // 쿠키 자동 전송 (향후 HttpOnly 전환 대비)
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 — 쿠키의 access token 을 Authorization 헤더에 이중 부착
apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie(COOKIE_ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 응답 인터셉터 — 401/403 에서 refresh 재시도. find-my-pet 백엔드는 현재 403 사용, 호환 위해 둘 다.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const { config, response } = error;
    const status = response?.status;
    if ((status === 401 || status === 403) && !isRefreshing) {
      isRefreshing = true;
      const originalRequest = config;
      const refreshToken = getCookie(COOKIE_REFRESH_TOKEN);
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }
      // Auth 서비스의 reissue 는 fmp 백엔드(animal/) 가 아니라 별도 auth 서비스에 위임됨.
      // platform Auth REST: POST {AUTH_API_URL}/auth/token/reissue (RFC 6819 rotation 적용).
      // NEXT_PUBLIC_AUTH_API_URL 미설정 시 운영 기본값으로 fallback.
      const authApiUrl =
        process.env.NEXT_PUBLIC_AUTH_API_URL ?? "https://auth.platformholder.site/api/v1";
      refreshedTokenPromise = axios
        .post(`${authApiUrl}/auth/token/reissue`, { refreshToken }, { withCredentials: true })
        .then((res) => {
          isRefreshing = false;
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          setCookie(COOKIE_ACCESS_TOKEN, accessToken);
          if (newRefresh) setCookie(COOKIE_REFRESH_TOKEN, newRefresh);
          refreshedTokenPromise = null;
          return { accessToken, refreshToken: newRefresh ?? refreshToken };
        })
        .catch((err) => {
          isRefreshing = false;
          refreshedTokenPromise = null;
          removeCookie(COOKIE_ACCESS_TOKEN);
          removeCookie(COOKIE_REFRESH_TOKEN);
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
          return Promise.reject(err);
        });
      const newToken = await refreshedTokenPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken.accessToken}`;
      }
      return apiClient(originalRequest);
    }

    // 이미 재발급 중인 요청은 대기 후 재시도
    if ((status === 401 || status === 403) && isRefreshing) {
      const newToken = await refreshedTokenPromise;
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken.accessToken}`;
      }
      return apiClient(config);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
