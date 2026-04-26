"use client";

import Script from "next/script";

/**
 * Kakao Maps SDK 전역 로더. layout 에 한 번 마운트해 모든 페이지의 react-kakao-maps-sdk
 * `<Map>` 컴포넌트가 SDK 의존성을 보장받도록 함.
 *
 * `autoload=false` + 컴포넌트 내부에서 `kakao.maps.load(...)` 패턴 (MapFirst/MapSecond 와 동일).
 *
 * `NEXT_PUBLIC_KAKAO_JS_API_KEY` 미설정 시 no-op.
 */
export default function KakaoMapScript() {
  const appkey = process.env.NEXT_PUBLIC_KAKAO_JS_API_KEY;
  if (!appkey) return null;
  return (
    <Script
      strategy="afterInteractive"
      src={`https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${appkey}&libraries=services,clusterer`}
      onLoad={() => {
        const k = (window as unknown as { kakao?: { maps?: { load: (cb: () => void) => void } } }).kakao;
        if (k?.maps) {
          // SDK lib 메인 모듈은 lazy 로딩이라 명시적 load 호출이 필요.
          k.maps.load(() => {});
        }
      }}
    />
  );
}
