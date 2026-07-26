/**
 * 유기동물 공고(abandoned-animals)의 "색인 가치" 판정 헬퍼.
 *
 * sitemap(/app/sitemap.ts) 과 상세 페이지(/abandonment/[detail]) 가 **같은 기준**을 써야 한다.
 * 두 곳이 어긋나면 "상세는 noindex 인데 sitemap 은 색인 요청" 같은 모순이 생기므로
 * 판정 로직은 반드시 이 모듈만 사용한다.
 */

/**
 * 종료된 공고인지 판정.
 *
 * 공공데이터 `processState` 실측 값: `"보호중"`, `"종료(반환)"`, `"종료(자연사)"`, `"종료(입양)"` 등.
 * 서버사이드 필터 파라미터가 없으므로(백엔드가 processState 필터를 지원하지 않음) 클라이언트에서 거른다.
 *
 * ⚠️ `null`/`undefined`(상태 미상)는 **종료가 아닌 것으로 취급**한다 = 색인 대상에 포함.
 *    근거: 상세 페이지가 정확히 같은 판정(`processState?.startsWith("종료") === true`)으로
 *    noindex 를 결정한다. 여기서 "미상 = 종료"로 다르게 취급하면 상세는 index 인데
 *    sitemap 에는 빠지는 반대 방향 모순이 생긴다. 상태를 모를 때는 살아있는 공고를
 *    버리는 쪽(false negative)보다 포함하는 쪽이 안전하다.
 */
export function isClosedNotice(processState: string | null | undefined): boolean {
  return processState?.startsWith("종료") === true;
}

/** `happenDt` 는 `"YYYYMMDD"` 문자열. 형식이 어긋나면(null·빈 문자열·길이 불일치) null 반환. */
export function normalizeHappenDt(happenDt: string | null | undefined): string | null {
  if (typeof happenDt !== "string") return null;
  const trimmed = happenDt.trim();
  return /^\d{8}$/.test(trimmed) ? trimmed : null;
}

/**
 * `days` 일 전의 `"YYYYMMDD"` 컷오프 문자열.
 * `happenDt` 가 같은 포맷(zero-padded 고정폭)이라 Date 파싱 없이 문자열 사전순 비교로 대소를 판정할 수 있다.
 *
 * 빌드가 UTC 에서 도는데 happenDt 는 KST 기준이라 경계에서 최대 하루 오차가 나지만,
 * 90일 윈도우에서 ±1일은 무의미하므로 별도 타임존 보정은 하지 않는다.
 */
export function happenDtCutoff(days: number, now: Date = new Date()): string {
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const y = cutoff.getUTCFullYear();
  const m = String(cutoff.getUTCMonth() + 1).padStart(2, "0");
  const d = String(cutoff.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/** `"YYYYMMDD"` → Date. 형식이 어긋나면 null. */
export function happenDtToDate(happenDt: string | null | undefined): Date | null {
  const normalized = normalizeHappenDt(happenDt);
  if (!normalized) return null;
  const parsed = new Date(
    `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}T00:00:00Z`,
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
