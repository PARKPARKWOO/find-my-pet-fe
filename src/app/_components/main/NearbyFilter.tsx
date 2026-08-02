"use client";

import { useState } from "react";

export type NearbySetting =
  | { enabled: false }
  | { enabled: true; lat: number; lng: number; radiusKm: number };

interface Props {
  value: NearbySetting;
  onChange: (v: NearbySetting) => void;
}

const OPTIONS = [1, 3, 5, 10] as const;

export default function NearbyFilter({ value, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enable = (radiusKm: number) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("브라우저가 위치 접근을 지원하지 않아요.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onChange({
          enabled: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radiusKm,
        });
      },
      (err) => {
        setLoading(false);
        setError(err.message || "위치를 가져올 수 없어요.");
      },
      { timeout: 8000 },
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-canvas border border-border rounded-xl mb-4">
      <span className="text-sm font-medium text-content-primary">내 주변</span>
      {OPTIONS.map((km) => {
        const active = value.enabled && value.radiusKm === km;
        return (
          <button
            key={km}
            type="button"
            disabled={loading}
            onClick={() => enable(km)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition ${
              active
                ? "border-action-primary bg-action-primary text-content-inverse"
                : "bg-surface-raised text-content-secondary border-border hover:border-clay/60"
            } ${loading ? "opacity-60" : ""}`}
          >
            {km}km
          </button>
        );
      })}
      {value.enabled && (
        <button
          type="button"
          onClick={() => onChange({ enabled: false })}
          className="px-3 py-1 text-xs font-medium rounded-full border border-border bg-surface-raised text-content-muted hover:border-clay/60"
        >
          초기화
        </button>
      )}
      {loading && <span className="text-xs text-content-muted">위치 확인 중...</span>}
      {error && <span className="text-xs font-medium text-action-destructive">{error}</span>}
    </div>
  );
}
