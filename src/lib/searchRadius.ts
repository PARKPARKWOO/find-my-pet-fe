import type { AnimalType, Breed } from "@/types/breed";

export type TimeStage =
  | "GOLDEN"
  | "EXTENDED"
  | "DECLINING"
  | "FADING"
  | "EXPIRED";

export interface RadiusBands {
  core: number; // meters
  likely: number;
  possible: number;
}

const OTHER_FIXED: RadiusBands = { core: 30, likely: 100, possible: 300 };

/**
 * 시간(h) → likely(95% 발견 거리, m) 통계 lookup table.
 * 출처: PetFBI / Missing Pet Partnership 실종 반려동물 발견 거리 통계.
 * - 단순 누적 이동거리(speed×time) 가 아니라 **직선 변위 95% 분위수**.
 * - 24h 중 활동시간 비율 + 배회 패턴(브라운 운동) 반영된 결과.
 *
 * DOG: 50% < 0.8km / 75% < 1.6km / 95% < 5km (3일).
 * CAT: 60% < 100m, 7일+ 부터 천천히 확장.
 */
const DOG_LIKELY_TABLE: Array<[hours: number, meters: number]> = [
  [1, 200],
  [6, 800],
  [24, 1500],
  [72, 3000],
  [168, 5000], // 7일
  [336, 8000], // 14일
  [720, 12000], // 30일
];

const CAT_LIKELY_TABLE: Array<[hours: number, meters: number]> = [
  [1, 50],
  [24, 100],
  [72, 200],
  [168, 300], // 7일
  [336, 500],
  [720, 800], // 30일
];

const DOG_CAP_M = 12_000;
const CAT_CAP_M = 1_500;

/** 두 (x,y) 점 사이 선형 보간. table 은 x 오름차순 가정. */
function interpolate(table: Array<[number, number]>, x: number): number {
  if (x <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i];
    const [x1, y1] = table[i + 1];
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t;
    }
  }
  return last[1];
}

export function elapsedHoursSince(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, diff / 3_600_000);
}

export function computeRadiusBands(params: {
  animalType: AnimalType;
  missingTimeISO: string;
  breed?: Breed | null;
}): RadiusBands {
  const elapsedH = elapsedHoursSince(params.missingTimeISO);

  if (params.animalType === "OTHER") return { ...OTHER_FIXED };

  const table = params.animalType === "CAT" ? CAT_LIKELY_TABLE : DOG_LIKELY_TABLE;
  const cap = params.animalType === "CAT" ? CAT_CAP_M : DOG_CAP_M;

  // breed.exploreFactor (대략 0.5~1.3 분포) 를 ×0.7~1.3 multiplier 로 매핑.
  // 작은/소심한 개는 통계 평균보다 좁게, 활동적 견종은 약간 넓게.
  const factor = params.breed?.exploreFactor ?? 1.0;
  const multiplier = Math.max(0.7, Math.min(1.3, 0.7 + (factor - 0.5) * 0.75));

  const likely = Math.min(cap, interpolate(table, elapsedH) * multiplier);

  return {
    core: likely * 0.3,
    likely,
    possible: Math.min(cap, likely * 1.6),
  };
}

export function getTimeStage(missingTimeISO: string): TimeStage {
  const h = elapsedHoursSince(missingTimeISO);
  if (h < 24) return "GOLDEN";
  if (h < 72) return "EXTENDED";
  if (h < 168) return "DECLINING";
  if (h < 336) return "FADING";
  return "EXPIRED";
}

export function getPolygonOpacity(stage: TimeStage): number {
  return {
    GOLDEN: 0.5,
    EXTENDED: 0.35,
    DECLINING: 0.2,
    FADING: 0.12,
    EXPIRED: 0.06,
  }[stage];
}

export function chooseMapLevel(maxRadiusM: number): number {
  if (maxRadiusM < 500) return 3;
  if (maxRadiusM < 1500) return 4;
  if (maxRadiusM < 5000) return 6;
  if (maxRadiusM < 15_000) return 8;
  return 10;
}

export function formatElapsed(iso: string): string {
  const h = elapsedHoursSince(iso);
  if (h < 1) return `${Math.round(h * 60)}분 경과`;
  if (h < 24) return `${h.toFixed(1)}시간 경과`;
  const d = h / 24;
  if (d < 14) return `${d.toFixed(1)}일 경과`;
  return `${Math.floor(d)}일 경과`;
}

export const STAGE_LABEL: Record<TimeStage, string> = {
  GOLDEN: "골든타임 — 지도 반경부터 수색하세요",
  EXTENDED: "반경 수색 + 전단지 병행",
  DECLINING: "반경 의미가 낮아집니다. 보호소·공공DB 확인이 더 효과적",
  FADING: "지리적 반경 < 제보 · 보호소 · 공공DB 체크",
  EXPIRED: "지도 반경은 참고용. 다른 채널에 집중하세요",
};

export const STAGE_TONE: Record<TimeStage, string> = {
  GOLDEN: "bg-blue-50 border-blue-300 text-blue-900",
  EXTENDED: "bg-amber-50 border-amber-300 text-amber-900",
  DECLINING: "bg-orange-50 border-orange-300 text-orange-900",
  FADING: "bg-red-50 border-red-300 text-red-900",
  EXPIRED: "bg-gray-100 border-gray-300 text-gray-700",
};
