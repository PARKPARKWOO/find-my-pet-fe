import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BASE_URL } from "@/app/constant/api";

const SITE_DOMAIN = "https://findmypet.platformholder.site";

interface SearchItem {
  type: "LOST" | "ABANDONED";
  id: string;
  title: string;
  description: string | null;
  place: string | null;
  thumbnail: string | null;
  date: string | null;
  link: string;
}

interface SearchResponse {
  items: SearchItem[];
  totalLost: number;
  totalAbandoned: number;
  hasNextPage: boolean;
}

async function search(q: string, pageNo: number, type: string): Promise<SearchResponse | null> {
  if (!q.trim()) return null;
  try {
    const res = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(q)}&pageNo=${pageNo}&numOfRows=20&type=${type}`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string };
}): Promise<Metadata> {
  const q = (searchParams.q ?? "").trim();
  return {
    // 검색 결과 페이지는 인덱스 안 함 (일반적 SEO 권고).
    robots: { index: false, follow: true },
    title: q ? `"${q}" 검색 결과 | 파인드마이펫` : "검색 | 파인드마이펫",
    description: q
      ? `"${q}" 와 일치하는 실종 게시글 + 유기동물 보호중 결과를 확인하세요.`
      : "실종 게시글과 보호중 유기동물을 한 번에 검색하세요.",
    alternates: { canonical: `${SITE_DOMAIN}/search` },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; type?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const pageNo = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const type = (searchParams.type ?? "ALL").toUpperCase();
  const data = q ? await search(q, pageNo, type) : null;

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-2">
      <h1 className="text-xl font-bold mb-2">🔎 통합 검색</h1>

      {!q && (
        <p className="text-sm text-gray-500">상단 검색창에 키워드를 입력해 주세요.</p>
      )}

      {q && !data && (
        <p className="text-sm text-gray-500">
          &quot;{q}&quot; 검색 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {q && data && (
        <>
          <div className="flex gap-2 mb-4 text-sm">
            <FilterTab q={q} current={type} target="ALL" label={`전체 ${data.totalLost + data.totalAbandoned}`} />
            <FilterTab q={q} current={type} target="LOST" label={`실종 ${data.totalLost}`} />
            <FilterTab q={q} current={type} target="ABANDONED" label={`보호중 ${data.totalAbandoned}`} />
          </div>

          {data.items.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center border-dashed border-2 rounded">
              &quot;{q}&quot; 와 일치하는 결과가 없습니다.
            </p>
          ) : (
            <ul className="grid gap-3">
              {data.items.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <Link
                    href={item.link}
                    className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-20 h-20 rounded shrink-0 relative bg-gray-100">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          layout="fill"
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          {item.type === "LOST" ? "실종" : "보호"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 items-center mb-1">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                            item.type === "LOST"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.type === "LOST" ? "실종" : "보호중"}
                        </span>
                        <span className="font-semibold truncate">{item.title}</span>
                      </div>
                      {item.place && (
                        <p className="text-xs text-gray-600 mb-0.5">📍 {item.place}</p>
                      )}
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {data.hasNextPage && (
            <div className="flex justify-center mt-4">
              <Link
                href={`/search?q=${encodeURIComponent(q)}&page=${pageNo + 1}&type=${type}`}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                다음 페이지
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterTab({
  q,
  current,
  target,
  label,
}: {
  q: string;
  current: string;
  target: string;
  label: string;
}) {
  const active = current === target;
  return (
    <Link
      href={`/search?q=${encodeURIComponent(q)}&type=${target}`}
      className={`px-3 py-1.5 rounded-full ${
        active ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </Link>
  );
}
