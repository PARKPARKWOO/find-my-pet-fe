"use client";

import { useMemo, useState } from "react";
import { useBreeds } from "@/hooks/useBreeds";
import type { AnimalType } from "@/types/breed";

interface Props {
  animalType: AnimalType;
  value: string | null;
  onChange: (breedId: string | null) => void;
}

export default function BreedSelect({ animalType, value, onChange }: Props) {
  const { breeds, isLoading } = useBreeds(animalType);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return breeds;
    const q = query.toLowerCase();
    return breeds.filter(
      (b) => b.nameKo.includes(query) || (b.nameEn?.toLowerCase().includes(q) ?? false),
    );
  }, [breeds, query]);

  const selected = breeds.find((b) => b.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left border rounded-md px-3 py-2 text-sm bg-surface-raised hover:bg-surface-canvas"
      >
        {selected ? (
          <span>
            {selected.nameKo}{" "}
            <span className="text-xs text-content-muted">({selected.sizeCategory})</span>
          </span>
        ) : (
          <span className="text-content-muted">
            {isLoading ? "품종 불러오는 중..." : "품종 선택 (검색 가능 · 선택사항)"}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-surface-raised shadow-lg max-h-72 overflow-auto z-20">
          <input
            type="text"
            autoFocus
            placeholder="품종 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 border-b text-sm focus:outline-none"
          />
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm text-content-muted hover:bg-surface-canvas"
            onClick={() => {
              onChange(null);
              setOpen(false);
              setQuery("");
            }}
          >
            품종 모름 / 선택 안 함
          </button>
          {filtered.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-canvas ${
                value === b.id ? "bg-forest/10 font-semibold" : ""
              }`}
              onClick={() => {
                onChange(b.id);
                setOpen(false);
                setQuery("");
              }}
            >
              <span>{b.nameKo}</span>{" "}
              <span className="text-xs text-content-muted">
                {b.sizeCategory}
                {b.baseSpeedKmh ? ` · ${b.baseSpeedKmh}km/h` : ""}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-sm text-content-muted text-center">
              검색 결과 없음
            </div>
          )}
        </div>
      )}
    </div>
  );
}
