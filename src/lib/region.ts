import { BASE_URL } from "@/app/constant/api";

/**
 * 지역별 유기동물 페이지(/abandonment/region/*)용 서버 헬퍼.
 * 백엔드 지역 lookup(공공데이터 시도/시군구 코드)을 SSR 에서 조회한다.
 * URL 은 한글 지역명(SEO), 코드 변환은 서버에서만.
 */
export interface RegionItem {
  orgCd: string;
  orgdownNm: string;
  uprCd: string | null;
}

export interface AbandonedSummary {
  desertionNo: string;
  kindCd: string | null;
  popfile: string | null;
  sexCd: string | null;
  age: string | null;
  happenPlace: string | null;
  happenDt: string | null;
  careNm: string | null;
  careTel: string | null;
  careAddr: string | null;
  processState: string | null;
}

export interface AbandonedPage {
  contents: AbandonedSummary[];
  totalCount: number;
  hasNextPage: boolean;
}

const REGION_REVALIDATE = 86_400; // 시도/시군구 목록은 사실상 불변 — 1일
const LIST_REVALIDATE = 1_800; // 공고 목록 30분 (백엔드 sync 1시간 주기)

export async function fetchSidoList(): Promise<RegionItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/abandoned-animals/sido`, {
      next: { revalidate: REGION_REVALIDATE },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data as RegionItem[]) ?? [];
  } catch {
    return [];
  }
}

export async function fetchSigunguList(uprCd: string): Promise<RegionItem[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/abandoned-animals/sigungu?uprCd=${encodeURIComponent(uprCd)}`,
      { next: { revalidate: REGION_REVALIDATE } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data as RegionItem[]) ?? [];
  } catch {
    return [];
  }
}

/** 한글 시도명 → 코드. Next dynamic param 은 percent-encoding 상태로 올 수 있어 호출측에서 decode 해 넘긴다. */
export async function resolveSido(sidoName: string): Promise<RegionItem | null> {
  const list = await fetchSidoList();
  return list.find((s) => s.orgdownNm === sidoName) ?? null;
}

export async function resolveSigungu(
  uprCd: string,
  sigunguName: string,
): Promise<RegionItem | null> {
  const list = await fetchSigunguList(uprCd);
  return list.find((s) => s.orgdownNm === sigunguName) ?? null;
}

export async function fetchAbandonedByRegion(params: {
  uprCd: string;
  orgCd?: string;
  numOfRows?: number;
}): Promise<AbandonedPage> {
  const q = new URLSearchParams({
    pageNo: "1",
    numOfRows: String(params.numOfRows ?? 20),
    uprCd: params.uprCd,
  });
  if (params.orgCd) q.set("orgCd", params.orgCd);
  try {
    const res = await fetch(`${BASE_URL}/abandoned-animals?${q}`, {
      next: { revalidate: LIST_REVALIDATE },
    });
    if (!res.ok) return { contents: [], totalCount: 0, hasNextPage: false };
    const json = await res.json();
    return {
      contents: (json?.data?.contents as AbandonedSummary[]) ?? [],
      totalCount: json?.data?.totalCount ?? 0,
      hasNextPage: json?.data?.hasNextPage ?? false,
    };
  } catch {
    return { contents: [], totalCount: 0, hasNextPage: false };
  }
}

export const SITE_DOMAIN = "https://findmypet.platformholder.site";

export function regionPath(sidoName: string, sigunguName?: string): string {
  const base = `/abandonment/region/${encodeURIComponent(sidoName)}`;
  return sigunguName ? `${base}/${encodeURIComponent(sigunguName)}` : base;
}

/** 페이지에서 받은 dynamic param 을 안전하게 decode (이중 인코딩 방어 포함). */
export function decodeParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** 시군구 페이지 하단 보호소 안내용 — 공고에서 보호소 정보 dedupe 추출. */
export function extractShelters(contents: AbandonedSummary[]) {
  const map = new Map<string, { name: string; tel: string | null; addr: string | null }>();
  for (const c of contents) {
    if (!c.careNm || map.has(c.careNm)) continue;
    map.set(c.careNm, { name: c.careNm, tel: c.careTel, addr: c.careAddr });
  }
  return Array.from(map.values());
}
