"use client";

import { Map, MapMarker } from "react-kakao-maps-sdk";
import { useEffect, useRef } from "react";

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
  /** 주소 필드가 변경되면 자동 지오코딩 — 사용자가 아직 지도 클릭 안 했을 때만 반영. */
  address?: string;
  height?: string;
}

const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 };

export default function CoordinatePicker({ value, onChange, address, height = "300px" }: Props) {
  const userPickedRef = useRef<boolean>(false);
  // Kakao Map SDK 는 layout 의 KakaoMapScript 가 전역 로드.

  useEffect(() => {
    if (!address || userPickedRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const k: any = typeof window !== "undefined" ? (window as any).kakao : null;
    if (!k?.maps?.services) return;
    const geocoder = new k.maps.services.Geocoder();
    geocoder.addressSearch(address, (result: Array<{ x: string; y: string }>, status: string) => {
      if (status === k.maps.services.Status.OK && result[0]) {
        onChange(Number(result[0].y), Number(result[0].x));
      }
    });
  }, [address, onChange]);

  const center = value ?? SEOUL_CITY_HALL;

  return (
    <div className="w-full">
      <Map
        center={center}
        style={{ width: "100%", height }}
        level={4}
        onClick={(_, mouseEvent) => {
          userPickedRef.current = true;
          onChange(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
        }}
      >
        {value && <MapMarker position={value} />}
      </Map>
      <p className="mt-2 text-xs text-gray-500">
        {value
          ? `선택된 좌표: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
          : "지도를 클릭해 정확한 실종 위치를 표시해 주세요."}
      </p>
    </div>
  );
}
