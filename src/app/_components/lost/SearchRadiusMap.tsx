"use client";

import { useEffect, useMemo, useState } from "react";
import { Map, MapMarker, Circle, Polygon } from "react-kakao-maps-sdk";
import apiClient from "@/lib/api";
import { useBreeds } from "@/hooks/useBreeds";
import {
  chooseMapLevel,
  computeRadiusBands,
  getPolygonOpacity,
  getTimeStage,
  type RadiusBands,
} from "@/lib/searchRadius";
import type { AnimalType } from "@/types/breed";

interface Props {
  lat: number;
  lng: number;
  missingTime: string;
  animalType: AnimalType;
  breedId?: string | null;
  postId: string;
}

type ReachableResponse =
  | {
      method: "ORS_ISOCHRONE";
      features: Array<{
        level: "CORE" | "LIKELY" | "POSSIBLE";
        /** [[[lng,lat],...]] */
        polygon: number[][][];
      }>;
    }
  | {
      method: "CIRCLE_FALLBACK";
      center: { lat: number; lng: number };
      bands: { core: number; likely: number; possible: number };
    };

const COLORS = {
  CORE: { stroke: "#dc2626", fill: "#fecaca" },
  LIKELY: { stroke: "#fb923c", fill: "#fed7aa" },
  POSSIBLE: { stroke: "#fbbf24", fill: "#fef3c7" },
} as const;

export default function SearchRadiusMap({
  lat,
  lng,
  missingTime,
  animalType,
  breedId,
  postId,
}: Props) {
  const { byId } = useBreeds(animalType);
  const [reachable, setReachable] = useState<ReachableResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 백엔드에서 도달 영역 가져오기 — 실패 시 프론트 fallback 계산
  useEffect(() => {
    let mounted = true;
    setLoaded(false);
    apiClient
      .get(`/post/${postId}/reachable`)
      .then((res) => {
        if (mounted) setReachable(res.data?.data ?? null);
      })
      .catch(() => {
        if (mounted) setReachable(null);
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [postId]);

  // 프론트 fallback bands (백엔드 응답 없을 때)
  const fallbackBands = useMemo<RadiusBands>(
    () =>
      computeRadiusBands({
        animalType,
        missingTimeISO: missingTime,
        breed: byId(breedId),
      }),
    [animalType, missingTime, breedId, byId],
  );

  const stage = getTimeStage(missingTime);
  const opacityScale = getPolygonOpacity(stage);

  // 렌더할 데이터 결정
  const rendered = useMemo(() => {
    if (reachable?.method === "ORS_ISOCHRONE") {
      return {
        mode: "polygon" as const,
        possibleRadiusM: 0, // ORS는 polygon 이라 level 계산만 추정 어려움
      };
    }
    if (reachable?.method === "CIRCLE_FALLBACK") {
      return { mode: "circle" as const, bands: reachable.bands };
    }
    return { mode: "circle" as const, bands: fallbackBands };
  }, [reachable, fallbackBands]);

  const maxRadius =
    rendered.mode === "circle" ? rendered.bands.possible : fallbackBands.possible;
  const mapLevel = chooseMapLevel(maxRadius);

  return (
    <div className="w-full" style={{ height: 400 }}>
      <Map
        center={{ lat, lng }}
        level={mapLevel}
        style={{ width: "100%", height: "100%" }}
      >
        {rendered.mode === "polygon" && reachable?.method === "ORS_ISOCHRONE" && (
          <PolygonFeatures
            features={reachable.features}
            opacityScale={opacityScale}
          />
        )}

        {rendered.mode === "circle" && (
          <CircleBands
            center={{ lat, lng }}
            bands={rendered.bands}
            opacityScale={opacityScale}
          />
        )}

        <MapMarker position={{ lat, lng }} />
      </Map>

      {animalType === "CAT" && (
        <div className="mt-2 text-xs p-2 bg-waiting/10 border border-waiting/40 rounded">
          고양이는 대부분 <b>150m 이내</b>에 숨어있습니다. 반경 외곽보다 창고·차 밑·좁은 틈을 먼저 살펴보세요.
        </div>
      )}

      {loaded && (
        <Legend stage={stage} mode={rendered.mode} />
      )}
    </div>
  );
}

function PolygonFeatures({
  features,
  opacityScale,
}: {
  features: Array<{ level: "CORE" | "LIKELY" | "POSSIBLE"; polygon: number[][][] }>;
  opacityScale: number;
}) {
  // 바깥부터 → 안쪽 순으로 그리기 (Kakao Polygon 는 뒤에 그린 것이 위)
  const ORDER: Array<"POSSIBLE" | "LIKELY" | "CORE"> = ["POSSIBLE", "LIKELY", "CORE"];
  return (
    <>
      {ORDER.map((level) => {
        const f = features.find((x) => x.level === level);
        if (!f || !f.polygon[0]) return null;
        const c = COLORS[level];
        const path = f.polygon[0].map(([lng, lat]) => ({ lat, lng }));
        return (
          <Polygon
            key={level}
            path={path}
            strokeWeight={2}
            strokeColor={c.stroke}
            strokeOpacity={0.8}
            fillColor={c.fill}
            fillOpacity={opacityScale}
          />
        );
      })}
    </>
  );
}

function CircleBands({
  center,
  bands,
  opacityScale,
}: {
  center: { lat: number; lng: number };
  bands: { core: number; likely: number; possible: number };
  opacityScale: number;
}) {
  return (
    <>
      <Circle
        center={center}
        radius={bands.possible}
        strokeWeight={1}
        strokeColor={COLORS.POSSIBLE.stroke}
        strokeOpacity={0.6}
        fillColor={COLORS.POSSIBLE.fill}
        fillOpacity={opacityScale * 0.9}
      />
      <Circle
        center={center}
        radius={bands.likely}
        strokeWeight={1}
        strokeColor={COLORS.LIKELY.stroke}
        strokeOpacity={0.75}
        fillColor={COLORS.LIKELY.fill}
        fillOpacity={opacityScale}
      />
      <Circle
        center={center}
        radius={bands.core}
        strokeWeight={2}
        strokeColor={COLORS.CORE.stroke}
        strokeOpacity={0.9}
        fillColor={COLORS.CORE.fill}
        fillOpacity={opacityScale * 1.1}
      />
    </>
  );
}

function Legend({
  stage,
  mode,
}: {
  stage: ReturnType<typeof getTimeStage>;
  mode: "polygon" | "circle";
}) {
  return (
    <div className="mt-2 flex items-center gap-3 text-xs text-content-secondary flex-wrap">
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS.CORE.fill, border: `1px solid ${COLORS.CORE.stroke}` }} />
        Core (가장 확률 높음)
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS.LIKELY.fill, border: `1px solid ${COLORS.LIKELY.stroke}` }} />
        Likely
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS.POSSIBLE.fill, border: `1px solid ${COLORS.POSSIBLE.stroke}` }} />
        Possible
      </span>
      <span className="text-content-muted">·</span>
      <span className="text-content-muted">
        {mode === "polygon" ? "실제 도로망 기반 (ORS)" : "평지 기준 원형 추정"}
      </span>
      {stage === "EXPIRED" && (
        <span className="ml-auto text-action-destructive font-semibold">참고용</span>
      )}
    </div>
  );
}
