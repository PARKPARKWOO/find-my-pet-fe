/**
 * 유기동물 공고(abandoned-animals)의 "공고 종료 / 색인 가치" 판정 헬퍼.
 *
 * sitemap(/app/sitemap.ts) 과 상세 페이지(/abandonment/[detail]) 가 **같은 기준**을 써야 한다.
 * 두 곳이 어긋나면 "상세는 noindex 인데 sitemap 은 색인 요청" 같은 모순이 생기므로
 * 판정 로직은 반드시 이 모듈만 사용한다.
 *
 * ⚠️ 여기서 말하는 "종료" 는 **공고 기간이 끝났다** 는 뜻이지 "동물이 없다/안락사됐다" 가 아니다.
 *    공고 후에도 입양 대기로 보호소가 계속 데리고 있는 경우가 실제로 있다.
 *    화면 문구는 반드시 그 수준을 넘지 않아야 한다.
 */

/** 공고 상태 필터 — 백엔드 `noticeStatus` 파라미터와 값이 1:1로 대응한다. */
export type NoticeStatusFilter = "OPEN" | "CLOSED" | "ALL";

export const DEFAULT_NOTICE_STATUS: NoticeStatusFilter = "OPEN";

/** 인식 불가 값은 기본값(진행중)으로 폴백 — 백엔드 `NoticeStatus.from` 과 동일한 규칙. */
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

/** 백엔드 목록/상세 응답에서 종료 판정에 쓰는 필드만 추린 최소 구조. */
export interface NoticeClosableFields {
  /** 백엔드가 `closed_at` 기준으로 채워 주는 값. mirror 경로에서만 채워진다. */
  noticeClosed?: boolean | null;
  /** 법정 공고 종료일 `"YYYYMMDD"`. */
  noticeEdt?: string | null;
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
 * 보정하지 않으면 매일 09:00 KST 이전에 하루 앞선 날짜로 판정해 **아직 공고 중인 아이를 종료로**
 * 만들 수 있다. KST 는 서머타임이 없어 고정 +9h 로 충분하다.
 */
export function todayYyyyMmDd(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * 법정 공고기간이 이미 끝났는지 (`noticeEdt < 오늘`).
 *
 * 왜 `noticeEdt` 인가: 상류(data.go.kr)의 `processState` 는 갱신되지 않아 100일 지난 공고도
 * "보호중" 으로 내려온다. 반면 `noticeEdt` 는 우리가 이미 갖고 있고 상류 응답 품질과 무관하며,
 * 공고기간이 끝난 공고는 정의상 진행중이 아니다.
 *
 * ⚠️ 값이 없거나 형식이 깨졌으면 **만료로 보지 않는다.** 판정 불가를 종료로 취급하면
 *    아직 보호소에 있는 아이가 목록·sitemap 에서 통째로 사라진다. 모르면 남기는 쪽이 안전하다.
 *    종료일 당일(`noticeEdt === 오늘`)은 아직 공고 중이므로 `<` 비교를 쓴다.
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
 * `processState` 기반 종료 판정 — **보조 신호로 강등된 함수**다.
 *
 * 상류가 갱신을 멈춘 탓에 실측 96~99% 가 "보호중" 으로 얼어붙어 있어 단독으로는 거의 발화하지 않는다.
 * 그래도 제거하지는 않는다: 값이 실제로 `"종료(입양)"` 등으로 내려오는 건은 진짜 종료가 맞기 때문이다.
 * 주 판정은 {@link isNoticeExpired} 이고 이 함수는 OR 로만 얹는다.
 */
export function isClosedProcessState(processState: string | null | undefined): boolean {
  return processState?.startsWith("종료") === true;
}

/**
 * 공고가 종료됐는지 최종 판정. 목록 뱃지 / 상세 배너 / noindex / sitemap 이 전부 이 함수를 쓴다.
 *
 * 세 신호의 OR 인 이유:
 *  - `noticeClosed`: 백엔드 mirror 가 찍은 `closed_at`. 가장 정확하지만 만료 배치가 돌기 전 구간과
 *    data.go.kr 직결 fallback 응답에서는 항상 false 로 온다.
 *  - `noticeEdt`: 백엔드 배치와 무관하게 프론트가 직접 계산 가능한 기준. 위 공백을 메운다.
 *  - `processState`: 상류가 진짜로 종료를 내려준 소수 케이스.
 */
export function isNoticeClosed(pet: NoticeClosableFields): boolean {
  if (pet.noticeClosed === true) return true;
  if (isNoticeExpired(pet.noticeEdt)) return true;
  return isClosedProcessState(pet.processState);
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
