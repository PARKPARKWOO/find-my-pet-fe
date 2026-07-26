"use client";

import { useEffect, useState } from "react";
import AdFitSlot from "./AdFitSlot";

/**
 * AdFit 배너 광고단위는 등록할 때 **플랫폼(PC웹/모바일웹)과 사이즈가 고정**된다. 하나의 유닛 ID 가
 * 화면 폭에 따라 크기를 바꾸지 않고, `data-ad-width/height` 가 등록값과 한 픽셀이라도 다르면 광고가
 * 채워지지 않는다. 그래서 반응형 슬롯 하나가 아니라 플랫폼별 유닛을 각각 받는다.
 *
 * 사이즈까지 env 로 받는 이유: 이미 만들어 둔 배너 유닛이 320×50 이든 728×90 이든 코드를 고치지 않고
 * 맞출 수 있어야 한다. 사이즈가 어긋나면 에러 없이 그냥 빈칸이 되므로 디버깅이 유난히 어렵다.
 */
const PC_UNIT = process.env.NEXT_PUBLIC_ADFIT_UNIT_FOOTER_PC;
const MOBILE_UNIT = process.env.NEXT_PUBLIC_ADFIT_UNIT_FOOTER_MOBILE;
const PC_SIZE_RAW = process.env.NEXT_PUBLIC_ADFIT_UNIT_FOOTER_PC_SIZE;
const MOBILE_SIZE_RAW = process.env.NEXT_PUBLIC_ADFIT_UNIT_FOOTER_MOBILE_SIZE;

const PC_DEFAULT = { width: 728, height: 90 };
const MOBILE_DEFAULT = { width: 320, height: 100 };

/** 슬롯을 가르는 기준. Tailwind `md` 와 맞춘다. */
const MD_BREAKPOINT = 768;

/** `"728x90"` 형태를 파싱한다. 형식이 깨졌으면 조용히 기본값으로 되돌아간다. */
function parseSize(raw: string | undefined, fallback: { width: number; height: number }) {
  const matched = raw?.trim().match(/^(\d{2,4})\s*[xX*]\s*(\d{2,4})$/);
  if (!matched) return fallback;
  return { width: Number(matched[1]), height: Number(matched[2]) };
}

const PC = { unit: PC_UNIT, ...parseSize(PC_SIZE_RAW, PC_DEFAULT) };
const MOBILE = { unit: MOBILE_UNIT, ...parseSize(MOBILE_SIZE_RAW, MOBILE_DEFAULT) };

/** 세로 여백. 자리를 미리 잡을 때도 같은 값을 더해야 광고가 들어올 때 밀리지 않는다. */
const VERTICAL_PADDING = 40;

/**
 * 푸터 배너 광고.
 *
 * 본문 아래·푸터 링크 위에 정상 노출한다. 본문 흐름은 끊지 않으면서 실제로 보이는 자리다. 접거나
 * 화면 밖으로 밀지 않는 건 취향이 아니라 요건이다 — 뷰어빌리티 기준을 못 넘으면 유효 노출로 잡히지도
 * 않고, 무효 트래픽으로 분류되면 정산 회수·계정 정지로 이어진다.
 *
 * 두 가지를 지킨다.
 *
 * 1. **레이아웃 시프트 방지.** AdFit 의 `<ins>` 는 `display:none` 으로 시작해 스크립트가 매칭한 뒤
 *    block 이 된다. 자리를 비워두면 그 순간 푸터가 통째로 밀린다. 그래서 로드 전에도 높이를 잡아둔다.
 * 2. **한쪽만 마운트.** 두 슬롯을 다 그려놓고 CSS 로 감추면 감춰진 쪽도 스크립트가 잡아 노출로 센다.
 *    그건 정확히 무효 노출이다. 그래서 뷰포트를 보고 한쪽만 DOM 에 넣는다.
 *
 * 유닛 ID 가 하나도 없으면 아무것도 렌더하지 않는다 — 미설정 환경에서 빈 회색 박스가 푸터에 남는 것보다
 * 낫다. 한쪽만 설정돼 있으면 그 플랫폼에서만 광고가 나온다.
 */
export default function FooterAd() {
  const [variant, setVariant] = useState<"pc" | "mobile" | null>(null);

  useEffect(() => {
    const pick = () => setVariant(window.innerWidth >= MD_BREAKPOINT ? "pc" : "mobile");
    pick();
    window.addEventListener("resize", pick);
    return () => window.removeEventListener("resize", pick);
  }, []);

  if (!PC.unit && !MOBILE.unit) return null;

  const slot = variant === "pc" ? PC : variant === "mobile" ? MOBILE : null;

  // 뷰포트 판정 전에는 더 낮은 쪽으로 자리를 잡는다. 모자란 만큼만 밀리고, 넘치게 잡아 빈 공간이
  // 남는 것보다 낫다.
  const reservedHeight =
    (slot?.height ?? Math.min(PC.height, MOBILE.height)) + VERTICAL_PADDING;

  return (
    <div
      className="flex w-full justify-center overflow-hidden px-4 py-5"
      style={{ minHeight: reservedHeight }}
    >
      {slot?.unit && (
        <AdFitSlot unit={slot.unit} width={slot.width} height={slot.height} />
      )}
    </div>
  );
}
