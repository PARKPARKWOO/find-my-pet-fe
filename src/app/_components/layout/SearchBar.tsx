import { Search } from "lucide-react";

interface SearchBarProps {
  /** 'compact' = 헤더용 작은 입력 / 'hero' = 메인 / 모바일 전용 큰 입력 */
  variant?: "compact" | "hero";
  /** 결과 페이지에서 현재 검색어 prefill — 재검색 편의 */
  defaultQ?: string;
}

export default function SearchBar({ variant = "compact", defaultQ = "" }: SearchBarProps) {
  if (variant === "hero") {
    return (
      <form action="/search" method="get" role="search" className="w-full">
        <label className="sr-only" htmlFor={`site-search-${variant}`}>
          실종 또는 보호 동물 검색
        </label>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none"
          />
          <input
            id={`site-search-${variant}`}
            name="q"
            type="search"
            defaultValue={defaultQ}
            required
            placeholder="실종 / 보호중 동물 검색 — 지역, 품종, 특징 등"
            className="pl-11 pr-20 py-3 text-base bg-surface-raised border border-border rounded-full w-full placeholder:text-content-muted/70 focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-action-primary transition-colors shadow-raised"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-action-primary text-content-inverse text-sm font-semibold rounded-full hover:bg-action-primary/90"
          >
            검색
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action="/search" method="get" role="search" className="flex items-center">
      <label className="sr-only" htmlFor={`site-search-${variant}`}>
        실종 또는 보호 동물 검색
      </label>
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none"
        />
        <input
          id={`site-search-${variant}`}
          name="q"
          type="search"
          defaultValue={defaultQ}
          required
          placeholder="실종 / 보호중 검색"
          className="pl-7 pr-3 py-1.5 text-sm bg-surface-raised border border-border rounded-md w-44 lg:w-64 placeholder:text-content-muted/70 focus:outline-none focus:ring-2 focus:ring-action-primary"
        />
      </div>
    </form>
  );
}
