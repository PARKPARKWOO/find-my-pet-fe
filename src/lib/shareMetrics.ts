import { BASE_URL } from "@/app/constant/api";

/**
 * 공유 사용빈도 집계 비콘.
 *
 * 백엔드는 Prometheus 카운터 `fmp_share_total{channel,content_type}` 만 올리고 아무것도 저장하지
 * 않는다 — "카카오 공유가 이번 주 몇 번" 수준의 추이만 Grafana 에서 본다.
 *
 * 설계상 지키는 것 두 가지:
 *
 * 1. **공유를 절대 막지 않는다.** await 하지 않고, 실패해도 삼킨다. 집계가 안 되는 것보다 공유
 *    버튼이 안 눌리는 게 훨씬 나쁘다.
 * 2. **`keepalive: true`.** 카카오 공유는 앱/새 창으로 넘어가면서 페이지를 떠날 수 있는데, 일반
 *    fetch 는 그 시점에 취소된다. keepalive 를 주면 브라우저가 이탈 후에도 요청을 마저 보낸다.
 *
 * `apiClient` 대신 fetch 를 쓰는 이유: apiClient 의 인터셉터가 401/403 에서 전역 로그아웃
 * 이벤트를 쏘는데, 집계 실패가 사용자를 로그아웃시키는 일은 있어선 안 된다.
 */
export type ShareChannel = "KAKAO" | "NATIVE" | "LINK_COPY" | "DAANGN_TEXT";
export type ShareContentType = "LOST" | "ABANDONED";

export function trackShare(channel: ShareChannel, contentType: ShareContentType): void {
  if (typeof window === "undefined") return;
  try {
    void fetch(`${BASE_URL}/share-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, contentType }),
      keepalive: true,
    }).catch(() => {
      // 집계 실패는 사용자에게 알리지 않는다.
    });
  } catch {
    // 구형 브라우저에서 keepalive 미지원 등으로 fetch 자체가 던지는 경우.
  }
}
