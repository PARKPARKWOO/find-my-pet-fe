"use client";

import Script from "next/script";
import { ADSENSE_CLIENT } from "./adsenseClient";

/**
 * Google AdSense loader. `layout.tsx` 에서 최초 1회만 삽입한다.
 *
 * - `NEXT_PUBLIC_ADSENSE_CLIENT` (예: `ca-pub-XXXXXXXXXXXXXXXX`) 미설정 시 아무것도 렌더하지 않는다.
 *   승인 전이나 프리뷰 환경에서 빈 요청을 보내지 않기 위한 것이며, `/ads.txt` 도 같은 값을 본다.
 * - 실제 광고 렌더는 {@link AdSlot} 이 담당한다.
 *
 * strategy 를 `afterInteractive` 로 두는 이유: AdSense 문서는 `<head>` 상단을 권하지만 next/script
 * 의 이 값은 body 끝에 넣는다. `beforeInteractive` 로 올리면 광고 스크립트가 첫 페인트를 막아 LCP 가
 * 나빠진다. 소유권 확인은 `/ads.txt` 와 `google-adsense-account` 메타 태그로도 가능하므로 로더 위치가
 * 심사를 막지 않는다. 실제로 스크립트 미탐지로 반려되면 그때 올린다.
 */
export default function AdSenseScript() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <Script
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
