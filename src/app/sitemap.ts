import type { MetadataRoute } from "next";
import { BASE_URL } from "@/app/constant/api";
import { getAllPosts } from "@/lib/parsePost";
import {
  happenDtCutoff,
  happenDtToDate,
  isClosedNotice,
  normalizeHappenDt,
} from "@/lib/abandonment";

const DOMAIN_URL = "https://findmypet.platformholder.site";
const POSTS_PAGE_SIZE = 100;
const POSTS_MAX_PAGES = 10; // 최대 1000건만 sitemap 에 포함 (그 이상은 정적 page param 추가 필요)

/**
 * 유기동물 공고 신선도 윈도우(일). 이보다 오래된 공고는 sitemap 에서 제외한다.
 *
 * 근거(2026-07 실측, 전체 30,976건 / 상류 mirror 보존기간 약 113일):
 *  - 공고 법정 기간은 10일이지만 그 뒤로도 상당 기간 `보호중` 으로 남는다.
 *    발견 후 경과일별 `종료*` 비율 표본(200건/페이지):
 *      ~2일 1.5% / ~19일 0.5% / ~38일 1.5% / ~54일 3.0% / ~69일 2.0%
 *      / ~88일 11.5% / ~108일 53.0% / ~112일 65.3%
 *  - 즉 90일 부근이 "살아있는 공고" → "종료된 죽은 콘텐츠" 로 급격히 꺾이는 지점이다.
 *    더 짧게 자르면(예: 종전의 페이지 상한 부산물이던 ~38일) 98% 가 아직 `보호중` 인
 *    유효 공고를 대량으로 버리게 되고, 더 길게 잡으면 종료 공고 비중이 절반을 넘는다.
 *  - 90일 기준 예상 수집량은 약 2.5만건으로 sitemap 상한(50,000 URL / 50MB) 안쪽이다.
 */
const ABANDONED_FRESHNESS_DAYS = 90;

interface ApiPostSummary {
  id: string;
  time?: string;
}

interface ApiAbandonedSummary {
  desertionNo: string;
  happenDt?: string | null;
  processState?: string | null;
}

/** 백엔드에서 실종 게시글 ID + 작성 시간 listing. 실패 시 빈 배열로 fallback (sitemap 자체는 빌드 됨). */
async function fetchAllPosts(): Promise<ApiPostSummary[]> {
  const result: ApiPostSummary[] = [];
  for (let page = 0; page < POSTS_MAX_PAGES; page++) {
    try {
      const res = await fetch(
        `${BASE_URL}/posts?pageSize=${POSTS_PAGE_SIZE}&pageOffset=${page}&orderBy=CREATED_AT_DESC`,
        { next: { revalidate: 600 } },
      );
      if (!res.ok) break;
      const json = await res.json();
      const contents: ApiPostSummary[] = json?.data?.contents ?? [];
      if (contents.length === 0) break;
      result.push(...contents);
      if (!json?.data?.hasNextPage) break;
    } catch {
      break;
    }
  }
  return result;
}

/**
 * 조기 종료가 정상 동작이라면 최소 이 정도는 모였어야 한다는 하한선.
 *
 * 실측 유입량 약 274건/일 × 90일 ≈ 24,700건이 기대치다. 여기서 한 자릿수 % 수준으로
 * 떨어진 채로 컷오프 break 가 걸렸다면 정렬 전제가 깨졌다는 신호이므로 경고를 남긴다
 * (넉넉히 잡아 약 1주치 유입량 = 2,000건).
 */
const ABANDONED_MIN_EXPECTED = 2_000;

/**
 * 진행중 유기동물 desertionNo listing — sitemap 의 /abandonment 페이지용.
 *
 * 수집 정책 (2건 모두 클라이언트 필터. 백엔드가 `bgnde`/`endde`(happen_dt 인덱스 부재로 무시됨) 와
 * `processState` 필터를 지원하지 않아 서버사이드로 내릴 수 없다):
 *  1) `종료*` 공고 제외 — 상세 페이지가 noindex 로 내보내는 페이지를 sitemap 이 색인 요청하던 모순 제거.
 *  2) 발견일 기준 최근 {@link ABANDONED_FRESHNESS_DAYS} 일만 포함.
 *
 * ⚠️ 조기 종료의 정렬 전제와 그 유일한 보장원:
 *   - 내림차순을 보장하는 곳은 **mirror 경로 단 하나**다 —
 *     `AbandonedAnimalRepository.findOpenByFilters` 의 `ORDER BY a.happenDt DESC, a.createdAt DESC`.
 *   - 백엔드 `AbandonedAnimalService.findAbandonedAnimals` 는 mirror 가 비어 있으면
 *     (`repository.count() == 0L`, 부팅 직후 sync 이전) `fetchDirect` 로 data.go.kr 을 그대로
 *     프록시한다. **이 경로에는 정렬 보장이 없다.**
 *   - 따라서 "항목 하나라도 오래되면 즉시 break" 는 위험하다. backdated 1건이 앞 페이지에
 *     섞이기만 해도 전체 수집이 붕괴하고, 에러도 없이 그 결과가 ISR 로 캐시된다.
 *
 * 그래서 **항목 단위가 아니라 페이지 경계**로 끊는다: 페이지의 마지막 유효 항목이 컷오프보다
 * 오래된 경우에만 중단하고, 중간에 낀 이상치 1건은 그 항목만 제외한다. 정렬이 정상인
 * mirror 경로에서는 두 방식의 종료 지점이 동일하다(내림차순이면 첫 stale 항목이 나온 페이지의
 * 마지막 항목도 반드시 stale). 정렬이 깨진 경우에만 동작이 갈린다.
 *
 * `MAX_PAGES` 는 정책이 아니라 무한루프/폭주 방어용 안전장치다. 정상 동작에서는 날짜 조건이 먼저 걸린다
 * (실측 유입량 약 274건/일 → 90일 ≈ 124페이지 < MAX_PAGES).
 */
async function fetchAllAbandoned(): Promise<ApiAbandonedSummary[]> {
  const result: ApiAbandonedSummary[] = [];
  const PAGE = 200;
  const MAX_PAGES = 160; // 안전장치: 200 × 160 = 32,000건 상한
  const cutoff = happenDtCutoff(ABANDONED_FRESHNESS_DAYS); // "YYYYMMDD"
  let outOfOrderSkipped = 0;

  for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo++) {
    try {
      const res = await fetch(
        `${BASE_URL}/abandoned-animals?pageNo=${pageNo}&numOfRows=${PAGE}`,
        { next: { revalidate: 1800 } },
      );
      if (!res.ok) break;
      const json = await res.json();
      const contents: ApiAbandonedSummary[] = json?.data?.contents ?? [];
      if (contents.length === 0) break;

      // 이 페이지에서 마지막으로 만난 "판정 가능한" happenDt.
      // 페이지 경계 판정에만 쓰므로 형식 불량/누락 항목은 갱신하지 않는다.
      let lastDatedHappenDt: string | null = null;
      let staleInPage = 0;

      for (const item of contents) {
        if (!item?.desertionNo) continue;
        const happenDt = normalizeHappenDt(item.happenDt);
        if (happenDt !== null) {
          lastDatedHappenDt = happenDt;
          // 고정폭 "YYYYMMDD" 라 문자열 사전순 비교로 안전하게 대소 판정 가능.
          if (happenDt < cutoff) {
            // 윈도우 밖 → 이 항목만 제외. 중단 여부는 페이지 끝에서 판단한다.
            staleInPage++;
            continue;
          }
        }
        // happenDt 가 형식 불량/누락이면 신선도를 판정할 수 없다.
        // 조기 종료 판단에는 쓰지 않고(잘못 끊으면 유효 공고를 대량 유실) 포함만 시킨다.
        if (isClosedNotice(item.processState)) continue;
        result.push(item);
      }

      // 페이지 경계 판정: 마지막 유효 항목이 컷오프보다 오래되면 이후 페이지는 전부 윈도우 밖.
      const reachedCutoff = lastDatedHappenDt !== null && lastDatedHappenDt < cutoff;
      if (!reachedCutoff) {
        // 끊지 않았는데 stale 이 섞여 있었다 = 내림차순 전제가 깨진 구간(fetchDirect fallback 등).
        outOfOrderSkipped += staleInPage;
      }

      if (reachedCutoff) {
        if (result.length < ABANDONED_MIN_EXPECTED) {
          // 하한 sanity check: 조기 종료가 걸렸는데 수확이 기대치보다 급감했다.
          // 정렬 보장이 없는 fetchDirect fallback 을 타고 있을 가능성이 높다.
          console.warn(
            `[sitemap] abandoned 조기 종료(page ${pageNo}, cutoff ${cutoff})인데 수집량이 ` +
              `${result.length}건으로 하한 ${ABANDONED_MIN_EXPECTED}건 미만. ` +
              `happenDt 내림차순 전제가 깨졌을 수 있음(mirror 미동기화 → fetchDirect fallback 의심).`,
          );
        }
        break;
      }
      if (!json?.data?.hasNextPage) break;
    } catch {
      break;
    }
  }

  if (outOfOrderSkipped > 0) {
    console.warn(
      `[sitemap] abandoned 목록에서 순서를 벗어난 과거 항목 ${outOfOrderSkipped}건을 개별 제외했다. ` +
        `happenDt 내림차순이 보장되지 않는 응답(fetchDirect fallback 등)일 수 있음.`,
    );
  }
  return result;
}

async function safeGetAllPosts(): Promise<Array<{ slug: string }>> {
  try {
    const r = await getAllPosts();
    return r as unknown as Array<{ slug: string }>;
  } catch {
    return [];
  }
}

/** 지역명이 비어있는(공공데이터상 orgdownNm=null) 항목 방어 — `/region/{sido}/null` 404 URL 생성 차단. */
function regionSlug(orgdownNm: string | null | undefined): string | null {
  if (typeof orgdownNm !== "string") return null;
  const trimmed = orgdownNm.trim();
  return trimmed.length > 0 ? encodeURIComponent(trimmed) : null;
}

/** 지역별 공고 페이지(/abandonment/region/*) — 시도 + 전체 시군구. 실패 시 빈 배열. */
async function fetchRegionUrls(): Promise<string[]> {
  try {
    const sidoRes = await fetch(`${BASE_URL}/abandoned-animals/sido`, {
      next: { revalidate: 86_400 },
    });
    if (!sidoRes.ok) return [];
    const sidoList: Array<{ orgCd: string | null; orgdownNm: string | null }> =
      (await sidoRes.json())?.data ?? [];

    const urls: string[] = [`${DOMAIN_URL}/abandonment/region`];
    for (const sido of sidoList) {
      const sidoSlug = regionSlug(sido?.orgdownNm);
      // orgdownNm 이 null 인 시도는 라우트 자체가 성립하지 않는다 → 건너뜀
      if (!sidoSlug || !sido?.orgCd) continue;
      urls.push(`${DOMAIN_URL}/abandonment/region/${sidoSlug}`);
      try {
        const sggRes = await fetch(
          `${BASE_URL}/abandoned-animals/sigungu?uprCd=${encodeURIComponent(sido.orgCd)}`,
          { next: { revalidate: 86_400 } },
        );
        if (!sggRes.ok) continue;
        const sggList: Array<{ orgdownNm: string | null }> = (await sggRes.json())?.data ?? [];
        for (const sgg of sggList) {
          // 인천/경남 등 일부 시군구는 orgdownNm 이 null 로 내려온다.
          // 그대로 두면 `/region/{sido}/null` 404 URL 이 sitemap 에 실린다.
          const sggSlug = regionSlug(sgg?.orgdownNm);
          if (!sggSlug) continue;
          urls.push(`${DOMAIN_URL}/abandonment/region/${sidoSlug}/${sggSlug}`);
        }
      } catch {
        // 시군구 하나 실패해도 나머지는 계속
      }
    }
    return urls;
  } catch {
    return [];
  }
}

/** URL 중복 제거 — 먼저 등장한 엔트리를 유지(정적 > 지역 > 실종 > 유기 > MDX 우선순위). */
function dedupeByUrl(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  const unique: MetadataRoute.Sitemap = [];
  for (const entry of entries) {
    if (!entry?.url || seen.has(entry.url)) continue;
    seen.add(entry.url);
    unique.push(entry);
  }
  return unique;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, abandoned, mdxPosts, regionUrls] = await Promise.all([
    fetchAllPosts(),
    fetchAllAbandoned(),
    safeGetAllPosts(),
    fetchRegionUrls(),
  ]);

  const lostPosts: MetadataRoute.Sitemap = posts.map((p: ApiPostSummary) => ({
    url: `${DOMAIN_URL}/lost/${p.id}`,
    lastModified: p.time ? new Date(p.time) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 목록이 happenDt 내림차순이라 결과도 최신 공고 순으로 유지된다.
  // lastModified 는 발견일 기준 — 빌드 시각(new Date())으로 채우면 리빌드마다
  // "전 페이지가 방금 변경됨" 이라는 거짓 신호를 보내 최신순 신호가 희석된다.
  const abandonedPages: MetadataRoute.Sitemap = abandoned.map((a) => ({
    url: `${DOMAIN_URL}/abandonment/${a.desertionNo}`,
    lastModified: happenDtToDate(a.happenDt) ?? new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const mdxEntries: MetadataRoute.Sitemap = mdxPosts.map((post) => ({
    url: `${DOMAIN_URL}${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: DOMAIN_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${DOMAIN_URL}/posts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${DOMAIN_URL}/guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${DOMAIN_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${DOMAIN_URL}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const regionPages: MetadataRoute.Sitemap = regionUrls.map((url) => ({
    url,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return dedupeByUrl([
    ...staticPages,
    ...regionPages,
    ...lostPosts,
    ...abandonedPages,
    ...mdxEntries,
  ]);
}
