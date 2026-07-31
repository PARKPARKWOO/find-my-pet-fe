/**
 * 유기동물 공고(abandoned-animals)의 "공고 종료 / 색인 가치" 판정 헬퍼.
 *
 * sitemap(/app/sitemap.ts) 과 상세 페이지(/abandonment/[detail]) 가 **같은 기준**을 써야 한다.
 * 두 곳이 어긋나면 "상세는 noindex 인데 sitemap 은 색인 요청" 같은 모순이 생기므로
 * 판정 로직은 반드시 이 모듈만 사용한다.
 *
 * ⚠️ 여기서 말하는 "종료" 는 백엔드가 CLOSED 로 판정한 **공고 상태**다.
 *    조기 종료나 상류 미제공도 포함될 수 있으며 동물의 현재 상태나 공고 기간 경과를 뜻하지 않는다.
 *    현재 상태는 보호소 확인이 필요하다.
 */

/** 공고 상태 필터 — 백엔드 `noticeStatus` 파라미터와 값이 1:1로 대응한다. */
export type NoticeStatusFilter = "OPEN" | "CLOSED" | "ALL";

export const DEFAULT_NOTICE_STATUS: NoticeStatusFilter = "OPEN";

/** 인식 불가 값은 기본 필터 `OPEN` 으로 폴백 — 백엔드 `NoticeStatus.from` 과 동일한 규칙. */
export function parseNoticeStatus(raw: string | null | undefined): NoticeStatusFilter {
  const value = raw?.trim().toUpperCase();
  return value === "CLOSED" || value === "ALL" || value === "OPEN"
    ? value
    : DEFAULT_NOTICE_STATUS;
}

/** 공고 상태 필터의 화면 라벨. */
export const NOTICE_STATUS_LABEL: Record<NoticeStatusFilter, string> = {
  OPEN: "진행 중",
  CLOSED: "공고 종료",
  ALL: "전체",
};

/** 백엔드 목록/상세 응답에서 공고 상태와 표시 날짜에 필요한 필드만 추린 최소 구조. */
export interface NoticeClosableFields {
  /** 백엔드가 판정한 공고 종료 여부. OPEN/CLOSED 상태의 유일한 출처다. */
  noticeClosed?: boolean | null;
  /** 법정 공고 종료일 `"YYYYMMDD"`. */
  noticeEdt?: string | null;
  /** 백엔드가 보정한 표시용 공고 종료일. 상태 판정에는 쓰지 않는다. */
  effectiveNoticeEdt?: string | null;
  /** `"보호중"` / `"종료(입양)"` 등 공공데이터 원본 상태값. */
  processState?: string | null;
}

/** `"YYYYMMDD"` 고정폭 날짜 문자열 검증. 형식이 어긋나면(null·공백·길이 불일치) null 반환. */
export function normalizeYyyyMmDd(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return /^\d{8}$/.test(trimmed) ? trimmed : null;
}

/**
 * 오늘 날짜를 KST 기준 `"YYYYMMDD"` 로.
 *
 * 공고일(`noticeEdt`)은 국내 행정 데이터라 KST 기준인데 빌드/SSR 는 UTC 에서 돈다.
 * 보정하지 않으면 매일 09:00 KST 이전 표시·날짜 비교가 하루 어긋날 수 있다.
 * KST 는 서머타임이 없어 고정 +9h 로 충분하다.
 */
export function todayYyyyMmDd(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * 표시된 법정 공고기간이 이미 끝났는지 (`noticeEdt < 오늘`).
 * OPEN/CLOSED 판정에는 쓰지 않고 날짜 안내가 필요한 곳에서만 사용한다.
 *
 * 값이 없거나 형식이 깨졌으면 날짜 경과를 확인할 수 없으므로 false 다.
 * 종료일 당일(`noticeEdt === 오늘`)은 아직 지나지 않았으므로 `<` 비교를 쓴다.
 */
export function isNoticeExpired(
  noticeEdt: string | null | undefined,
  today: string = todayYyyyMmDd(),
): boolean {
  const normalized = normalizeYyyyMmDd(noticeEdt);
  if (normalized === null) return false;
  return normalized < today;
}

/**
 * 원본 `processState`가 종료 사유를 담고 있는지 확인한다.
 * 배너의 사유별 설명 같은 표시 용도이며 OPEN/CLOSED 판정에는 쓰지 않는다.
 */
export function isClosedProcessState(processState: string | null | undefined): boolean {
  return processState?.startsWith("종료") === true;
}

/**
 * 공고가 종료됐는지 최종 판정. 목록 뱃지 / 상세 배너 / noindex / sitemap 이 전부 이 함수를 쓴다.
 * 날짜와 공공데이터 원본 상태는 화면에 보여 줄 출처 사실일 뿐, 백엔드 판정을 덮어쓰지 않는다.
 */
export function isNoticeClosed(pet: NoticeClosableFields): boolean {
  return pet.noticeClosed === true;
}

/** `"YYYYMMDD"` → `"2026년 5월 22일"`. 형식이 어긋나면 null (문구에서 통째로 생략). */
export function formatYyyyMmDdKo(raw: string | null | undefined): string | null {
  const normalized = normalizeYyyyMmDd(raw);
  if (!normalized) return null;
  const y = normalized.slice(0, 4);
  const m = Number(normalized.slice(4, 6));
  const d = Number(normalized.slice(6, 8));
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}년 ${m}월 ${d}일`;
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
  const normalized = normalizeYyyyMmDd(happenDt);
  if (!normalized) return null;
  const parsed = new Date(
    `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}T00:00:00Z`,
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
