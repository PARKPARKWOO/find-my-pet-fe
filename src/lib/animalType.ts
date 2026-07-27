import type { AnimalType } from "@/types/breed";

/**
 * 동물 종의 **화면 표시 문구** 단일 출처.
 *
 * 내부 코드(`DOG`/`CAT`/`OTHER`)는 백엔드 계약이라 절대 바꾸지 않고, 사람이 읽는 라벨만 여기서 관리한다.
 * 예전에는 `t === "DOG" ? "개" : ...` 삼항식이 등록 폼·수정 폼·유기동물 목록 세 곳에 복붙돼 있어
 * "개 → 강아지" 같은 문구 변경이 항상 누락 지점을 남겼다. 이 파일 한 줄로 끝나야 한다.
 */
export const ANIMAL_TYPE_LABEL: Record<AnimalType, string> = {
  DOG: "강아지",
  CAT: "고양이",
  OTHER: "그 외 반려동물",
};

/** 선택 UI 의 노출 순서. 배열을 돌려 쓰면 탭/버튼이 늘어도 마크업을 복붙하지 않는다. */
export const ANIMAL_TYPES: AnimalType[] = ["DOG", "CAT", "OTHER"];

/** 종 무관 "전체" 를 포함한 목록 필터 값. */
export type AnimalTypeFilter = AnimalType | "ALL";

/** 인식 불가 값은 "전체" 로 폴백 — 공유된 URL 이 깨졌을 때 빈 화면 대신 기본 목록을 보여준다. */
export function parseAnimalTypeFilter(raw: string | null | undefined): AnimalTypeFilter {
  const value = raw?.trim().toUpperCase();
  return value === "DOG" || value === "CAT" || value === "OTHER" ? value : "ALL";
}

/**
 * 공공데이터 `kindCd` 는 `"[개] 말티즈"` 포맷으로 내려온다.
 *
 * 선두 대괄호 토큰(축종 표기)만 우리 표기 기준으로 치환하고 **품종명은 원본 그대로 둔다** —
 * 품종까지 손대면 원본 데이터를 위조하는 셈이 된다. `[고양이]`/`[기타축종]` 은 그대로 통과시킨다.
 */
export function formatKindLabel(kindCd: string | null | undefined): string | null {
  if (typeof kindCd !== "string") return null;
  const trimmed = kindCd.trim();
  if (trimmed.length === 0) return null;
  return trimmed.replace(/^\[개\]/, `[${ANIMAL_TYPE_LABEL.DOG}]`);
}

/** 알림 body 처럼 문장 맨 앞에 `kindCd` 가 붙는 문자열용. 선두 축종 토큰만 치환한다. */
export function formatKindLeadingText(text: string | null | undefined): string | null {
  if (typeof text !== "string") return null;
  return text.replace(/^\[개\]/, `[${ANIMAL_TYPE_LABEL.DOG}]`);
}
