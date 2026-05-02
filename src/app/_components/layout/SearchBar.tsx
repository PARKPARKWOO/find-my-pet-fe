"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

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
          placeholder="실종 / 유기 검색"
          className="pl-7 pr-3 py-1.5 text-sm border rounded-md w-40 sm:w-56 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
    </form>
  );
}
