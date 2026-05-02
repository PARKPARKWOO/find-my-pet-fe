"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface Props {
  /** 'compact' = 헤더용 작은 입력 / 'hero' = 메인 / 모바일 전용 큰 입력 */
  variant?: "compact" | "hero";
}

export default function SearchBar({ variant = "compact" }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  if (variant === "hero") {
    return (
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="실종 / 보호중 동물 검색 — 지역, 품종, 특징 등"
            aria-label="실종 또는 보호중 동물 검색"
            className="pl-10 pr-20 py-3 text-base border-2 border-gray-200 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-full hover:bg-blue-600"
          >
            검색
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="실종 / 보호중 검색"
          aria-label="검색"
          className="pl-7 pr-3 py-1.5 text-sm border rounded-md w-44 lg:w-64 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
    </form>
  );
}
