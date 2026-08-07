"use client";

interface Props {
  /** AdFit 광고 단위 ID (예: `DAN-XXXXXXXXXXXXX`). 환경변수로 주입 권장. */
  unit: string;
  /** 픽셀 단위. 공식 지원 사이즈만 허용 (mobile: 320×50/100/250, PC: 728×90/300×250/160×600 등). */
  width: number;
  height: number;
  className?: string;
}

/**
 * 단일 AdFit 슬롯. `unit` 이 비어있으면 placeholder 로 렌더되어 레이아웃 확인 용도로 사용 가능.
 *
 * 광고 스크립트(`ba.min.js`) 는 `AdFitScript` 가 layout 에 한 번 주입한다.
 * ba.min.js 는 페이지 로드 시 DOM 을 한 번 스캔하므로 SPA 라우트 전환 후에는 새로 마운트된 `<ins>` 도
 * 스크립트가 자동 스캔해준다.
 */
export default function AdFitSlot({ unit, width, height, className }: Props) {
  if (!unit) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border border-dashed border-border bg-surface-canvas text-xs text-content-muted ${className ?? ""}`}
        style={{ width, height }}
      >
        AdFit 자리 (유닛 ID 미설정)
      </div>
    );
  }
  return (
    // 공식 스니펫과 동일하게 display:none 으로 두고 AdFit 스크립트가 매칭 후 block 으로 토글.
    <ins
      className={`kakao_ad_area ${className ?? ""}`}
      style={{ display: "none" }}
      data-ad-unit={unit}
      data-ad-width={String(width)}
      data-ad-height={String(height)}
    />
  );
}
