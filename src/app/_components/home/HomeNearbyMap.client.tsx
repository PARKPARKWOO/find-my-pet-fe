"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Map as KakaoMap, Circle, CustomOverlayMap } from "react-kakao-maps-sdk";

import { useKakaoMapStatus } from "@/app/_components/KakaoMapScript";
import apiClient from "@/lib/api";
import {
  classifyGeolocationError,
  normalizeNearbyResponse,
  type NearbyPublicItem,
} from "@/lib/homeNearby";

type LookupStatus =
  | "idle"
  | "locating"
  | "loading"
  | "success"
  | "permission-denied"
  | "position-unavailable-or-timeout"
  | "request-failed"
  | "empty"
  | "no-displayable-results";
type RadiusKm = 1 | 3 | 5 | 10;
type Coordinate = { lat: number; lng: number };

const RADII: readonly RadiusKm[] = [1, 3, 5, 10];

const STATUS_MESSAGE: Partial<Record<LookupStatus, string>> = {
  locating: "브라우저에서 현재 위치를 확인하고 있어요.",
  loading: "가까운 공개 소식을 불러오고 있어요.",
  "permission-denied": "위치 권한이 허용되지 않았어요. 브라우저 설정을 확인한 뒤 다시 시도해 주세요.",
  "position-unavailable-or-timeout": "현재 위치를 확인할 수 없거나 시간이 초과됐어요.",
  "request-failed": "가까운 소식을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.",
  empty: "선택한 반경에 등록된 공개 위치 소식이 없어요.",
  "no-displayable-results": "표시 가능한 공개 위치 소식이 없어요.",
};

export default function HomeNearbyMap() {
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [radiusKm, setRadiusKm] = useState<RadiusKm>(3);
  const [items, setItems] = useState<NearbyPublicItem[]>([]);
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const mapStatus = useKakaoMapStatus();
  const lookupSequenceRef = useRef(0);
  const mountedRef = useRef(true);
  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      lookupSequenceRef.current += 1;
      activeControllerRef.current?.abort();
    };
  }, []);

  const handleLookup = () => {
    lookupSequenceRef.current += 1;
    const sequence = lookupSequenceRef.current;
    activeControllerRef.current?.abort();
    setItems([]);
    setCoordinate(null);

    if (!navigator.geolocation) {
      setLookupStatus("position-unavailable-or-timeout");
      return;
    }

    setLookupStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!mountedRef.current || sequence !== lookupSequenceRef.current) return;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const controller = new AbortController();
        activeControllerRef.current = controller;
        setCoordinate({ lat, lng });
        setLookupStatus("loading");

        try {
          const response = await apiClient.get("/posts/nearby", {
            params: {
              lat,
              lng,
              radiusKm,
              pageSize: 20,
              pageOffset: 0,
            },
            signal: controller.signal,
          });
          if (!mountedRef.current || sequence !== lookupSequenceRef.current) return;
          const result = normalizeNearbyResponse(response.data);
          setItems(result.items);
          if (result.sourceItemCount === 0) setLookupStatus("empty");
          else if (result.items.length === 0) setLookupStatus("no-displayable-results");
          else setLookupStatus("success");
        } catch {
          if (!mountedRef.current || sequence !== lookupSequenceRef.current) return;
          if (controller.signal.aborted) return;
          setItems([]);
          setLookupStatus("request-failed");
        } finally {
          if (!mountedRef.current || sequence !== lookupSequenceRef.current) return;
          if (activeControllerRef.current === controller) activeControllerRef.current = null;
        }
      },
      (error) => {
        if (!mountedRef.current || sequence !== lookupSequenceRef.current) return;
        setLookupStatus(classifyGeolocationError(error.code));
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  };

  const handleRadiusChange = (radius: RadiusKm) => {
    if (radius === radiusKm) return;
    lookupSequenceRef.current += 1;
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
    setRadiusKm(radius);
    setItems([]);
    setCoordinate(null);
    setLookupStatus("idle");
  };

  const busy = lookupStatus === "locating" || lookupStatus === "loading";
  const statusMessage = STATUS_MESSAGE[lookupStatus];

  return (
    <div className="grid gap-6 rounded-3xl border border-border bg-surface-raised p-5 shadow-raised lg:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.25fr)] lg:p-7">
      <div>
        <fieldset>
          <legend className="font-semibold text-content-primary">조회 반경</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {RADII.map((radius) => (
              <label key={radius} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm text-content-secondary has-[:checked]:border-forest has-[:checked]:bg-forest has-[:checked]:text-content-inverse">
                <input
                  type="radio"
                  name="nearby-radius"
                  value={radius}
                  checked={radiusKm === radius}
                  disabled={busy}
                  onChange={() => handleRadiusChange(radius)}
                  className="sr-only"
                />
                {radius}km
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mt-5 text-sm leading-6 text-content-secondary">
          버튼을 누르면 좌표를 이번 조회를 위해 서버에 전송합니다. 프론트엔드는 좌표를 브라우저 저장소에 저장하지 않으며, 백엔드와 인프라의 보관 여부를 단정하지 않습니다.
        </p>
        <button
          type="button"
          onClick={handleLookup}
          disabled={busy}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-action-primary px-5 font-semibold text-content-inverse disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary focus-visible:ring-offset-2"
        >
          {busy ? "위치 소식 확인 중" : "내 위치로 가까운 소식 보기"}
        </button>
        {statusMessage ? <p role="status" className="mt-4 text-sm leading-6 text-content-secondary">{statusMessage}</p> : null}
        {mapStatus === "unavailable" ? (
          <p className="mt-3 text-xs text-content-muted">지도 설정이 없어 목록으로 소식을 보여드려요.</p>
        ) : null}
        {mapStatus === "failed" ? (
          <p className="mt-3 text-xs text-content-muted">지도를 불러오지 못해 목록으로 소식을 보여드려요.</p>
        ) : null}
      </div>

      <div className="min-w-0">
        {mapStatus === "ready" && coordinate && items.length > 0 ? (
          <div role="img" aria-label="선택한 반경의 공개 위치 소식을 보여주는 보조 지도" className="h-80 overflow-hidden rounded-2xl border border-border">
            <KakaoMap center={coordinate} level={7} style={{ width: "100%", height: "100%" }}>
              <Circle
                center={coordinate}
                radius={radiusKm * 1000}
                strokeColor="#D66F54"
                strokeOpacity={0.8}
                strokeWeight={2}
                fillColor="#D66F54"
                fillOpacity={0.12}
              />
              {items.map((item, index) => (
                <CustomOverlayMap key={`${item.id}:${index}`} position={{ lat: item.lat, lng: item.lng }}>
                  <span
                    aria-hidden="true"
                    className={`block size-4 rounded-full border-2 border-white shadow-raised ${
                      item.missingAnimalStatus === "SEARCHING" ? "bg-map-missing" : "bg-map-sighting"
                    }`}
                  />
                </CustomOverlayMap>
              ))}
            </KakaoMap>
          </div>
        ) : null}

        {items.length > 0 ? (
          <ul className="space-y-3" aria-label="가까운 공개 위치 소식">
            {items.map((item, index) => (
              <li key={`${item.id}:${index}`}>
                <Link
                  href={item.href}
                  className="block min-h-11 rounded-xl border border-border p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
                >
                  <span className="text-xs font-semibold text-clay">
                    {item.missingAnimalStatus === "SEARCHING" ? "찾는 중" : "목격"}
                  </span>
                  <strong className="mt-1 block text-content-primary">{item.title}</strong>
                  <span className="mt-2 block text-sm text-content-secondary">
                    {item.place ? `${item.place} · ` : ""}{item.distanceKm.toFixed(1)}km
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
