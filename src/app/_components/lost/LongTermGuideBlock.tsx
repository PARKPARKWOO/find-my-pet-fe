"use client";

import { getTimeStage, elapsedHoursSince } from "@/lib/searchRadius";

interface Props {
  missingTime: string;
  place?: string;
}

/**
 * 72시간 이상 경과한 실종 건에 노출되는 "지도 반경 말고 이것부터 해라" 가이드.
 * 14일+ 면 더 강한 톤으로 전환.
 */
export default function LongTermGuideBlock({ missingTime, place }: Props) {
  const stage = getTimeStage(missingTime);
  if (stage === "GOLDEN" || stage === "EXTENDED") return null;

  const isSevere = stage === "FADING" || stage === "EXPIRED";
  const hours = elapsedHoursSince(missingTime);
  const days = Math.floor(hours / 24);

  return (
    <section
      className={`mt-4 p-4 rounded-lg border ${
        isSevere ? "bg-destructive/10 border-destructive/40" : "bg-waiting/10 border-waiting/40"
      }`}
    >
      <h3 className="font-bold text-base mb-2">
        {isSevere
          ? `${days}일 경과 — 지도 반경 의미가 낮아집니다`
          : `${days}일 경과 — 전략을 바꾸세요`}
      </h3>
      <p className="text-sm mb-3 text-content-secondary">
        {isSevere
          ? "이 시점부터 가장 효과적인 것:"
          : "지도 반경보다 아래 채널이 더 중요합니다:"}
      </p>

      <ul className="space-y-2 text-sm">
        <li>
          <b>유기동물 공공DB 매일 체크</b>
          {" — "}
          <a
            href="/"
            className="text-forest underline"
            onClick={(e) => {
              e.preventDefault();
              // 홈 페이지로 이동해 구조동물 탭 열기
              window.location.href = "/?tab=abandonment";
            }}
          >
            지금 구조동물 보기
          </a>
        </li>
        <li>
          <b>근처 동물보호소 / 동물병원 임시보호 확인</b>
          {place ? ` (${place} 주변)` : ""}
        </li>
        <li>
          <b>SNS · 지역 커뮤니티 재게시</b> — 당근 동네생활, 지역 맘카페
        </li>
        <li>
          <b>전단지 장기 비치 체크</b> — 24시간 편의점, 동물병원 대기실
        </li>
      </ul>

      {isSevere && (
        <p className="mt-3 text-xs text-action-destructive">
          * 2주 이상 경과 시 사진 기반 자동 매칭(AI)이 더 효과적입니다. 아래 섹션의 닮은 아이들을 꼭 확인하세요.
        </p>
      )}
    </section>
  );
}
