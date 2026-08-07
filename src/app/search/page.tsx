import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BASE_URL } from "@/app/constant/api";
import SearchBar from "@/app/_components/layout/SearchBar";
import { formatKindLabel } from "@/lib/animalType";

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
  /**
   * 백엔드가 공고를 CLOSED로 판정했는지 (ABANDONED만 해당).
   *
   * 검색은 목록과 달리 **종료분도 함께 돌려준다.** 공고가 끝났다고 그 아이가 보호소에서 사라진 게
   * 아니고, 여기서 숨기면 보호자가 "보호소에 없구나" 하고 포기한다 — 재결합 경로를 스스로 끊는 셈이다.
   * CLOSED는 기간 경과뿐 아니라 명시 종료·상류 미제공을 포함할 수 있다. 뱃지로 구분하되
   * 동물의 현재 상태를 추정하지 않고 "보호소에 확인해 보라"는 신호만 준다.
   */
  noticeClosed?: boolean;
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
      <h1 className="text-xl font-bold mb-3">통합 검색</h1>

      {/* 결과 페이지 자체 검색창 — 재검색 편의 (현재 검색어 prefill) */}
      <div className="mb-4">
        <SearchBar variant="hero" defaultQ={q} />
      </div>

      {!q && (
        <p className="text-sm text-content-muted">검색창에 키워드를 입력해 주세요.</p>
      )}

      {q && !data && (
        <p className="text-sm text-content-muted">
          &quot;{q}&quot; 검색 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {q && data && (
        <>
          <div className="flex gap-2 mb-4 text-sm">
            <FilterTab q={q} current={type} target="ALL" label={`전체 ${data.totalLost + data.totalAbandoned}`} />
            <FilterTab q={q} current={type} target="LOST" label={`실종 ${data.totalLost}`} />
            {/* "보호중" 이 아니라 "유기동물" 인 이유: 검색은 공고 종료분까지 함께 돌려주므로
                이 숫자에 종료된 아이도 들어간다. 라벨이 상태를 단정하면 카드 뱃지와 어긋난다. */}
            <FilterTab q={q} current={type} target="ABANDONED" label={`유기동물 ${data.totalAbandoned}`} />
          </div>

          {data.items.length === 0 ? (
            <p className="text-sm text-content-muted py-8 text-center border-dashed border-2 rounded">
              &quot;{q}&quot; 와 일치하는 결과가 없습니다.
            </p>
          ) : (
            <ul className="grid gap-3">
              {data.items.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <Link
                    href={item.link}
                    className="flex gap-3 p-3 border rounded-lg hover:bg-surface-canvas transition-colors"
                  >
                    <div className="w-20 h-20 rounded shrink-0 relative bg-surface-canvas">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          layout="fill"
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-content-muted">
                          {item.type === "LOST" ? "실종" : "보호"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 items-center mb-1">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                            item.type === "LOST"
                              ? "bg-destructive/10 text-action-destructive"
                              : item.noticeClosed
                                ? "bg-border text-content-secondary"
                                : "bg-forest/10 text-forest-strong"
                          }`}
                        >
                          {item.type === "LOST"
                            ? "실종"
                            : item.noticeClosed
                              ? "공고 종료"
                              : "보호중"}
                        </span>
                        {/* ABANDONED 의 title 은 백엔드가 kindFullNm("[개] 말티즈")로 채운다.
                            LOST 는 사용자가 쓴 제목이라 절대 손대지 않는다. */}
                        <span className="font-semibold truncate">
                          {item.type === "ABANDONED"
                            ? formatKindLabel(item.title) ?? item.title
                            : item.title}
                        </span>
                      </div>
                      {item.place && (
                        <p className="text-xs text-content-secondary mb-0.5">{item.place}</p>
                      )}
                      {item.description && (
                        <p className="text-xs text-content-muted line-clamp-2">{item.description}</p>
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
                className="px-4 py-2 text-sm border rounded hover:bg-surface-canvas"
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
        active ? "bg-action-primary text-content-inverse" : "bg-surface-canvas text-content-secondary hover:bg-border"
      }`}
    >
      {label}
    </Link>
  );
}
