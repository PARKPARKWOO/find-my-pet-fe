"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT } from "./adsenseClient";

interface Props {
  /** AdSense 광고 단위 슬롯 ID (예: "1234567890"). 환경변수에 두고 주입 권장. */
  slot: string;
  /** `auto` | `fluid` | `rectangle` 등 AdSense format. 기본 auto. */
  format?: string;
  /** 반응형 여부 — `true` 이면 data-full-width-responsive="true" */
  responsive?: boolean;
  /** 카드 그리드에 녹이기 위한 최소 높이. */
  minHeight?: number;
  className?: string;
}

/**
 * 단일 AdSense 슬롯. 게시자 ID 미설정 시 placeholder 로 대체되므로 개발/프리뷰 환경에서
 * 레이아웃만 확인 가능. 게시자 ID 는 로더·`/ads.txt` 와 같은 값을 봐야 하므로
 * {@link ADSENSE_CLIENT} 에서만 읽는다.
 */
export default function AdSlot({
  slot,
  format = "auto",
  responsive = true,
  minHeight = 180,
  className,
}: Props) {
  const clientId = ADSENSE_CLIENT;
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    // 슬롯 ID 도 함께 본다. 광고 단위는 AdSense **승인 후에만** 만들 수 있으므로
    // "게시자 ID 는 있고 슬롯은 아직 없는" 구간이 반드시 존재한다. 그때 push 하면
    // data-ad-slot="" 인 잘못된 광고 요청이 나간다.
    if (!clientId || !slot) return;
    if (typeof window === "undefined") return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queue: unknown[] = ((window as any).adsbygoogle = (window as any).adsbygoogle || []);
      queue.push({});
    } catch {
      // AdSense script 미로딩 상황 무시
    }
  }, [clientId, slot]);

  // 게시자 ID 든 슬롯이든 하나라도 없으면 광고를 만들 수 없다. 점선 박스를 그리지 않고 아예
  // 렌더하지 않는다 — 심사 중 홈 피드에 6장마다 "광고 자리" 박스가 반복되면 미완성 사이트로 읽힌다.
  if (!clientId || !slot) return null;

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle block ${className ?? ""}`}
      style={{ display: "block", minHeight }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
