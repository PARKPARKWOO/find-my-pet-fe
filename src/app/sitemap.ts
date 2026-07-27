import type { MetadataRoute } from "next";
import { BASE_URL } from "@/app/constant/api";
import { getAllPosts } from "@/lib/parsePost";
import {
  happenDtCutoff,
  happenDtToDate,
  isNoticeClosed,
  normalizeYyyyMmDd,
} from "@/lib/abandonment";

const DOMAIN_URL = "https://findmypet.platformholder.site";
const POSTS_PAGE_SIZE = 100;
const POSTS_MAX_PAGES = 10; // 최대 1000건만 sitemap 에 포함 (그 이상은 정적 page param 추가 필요)

/**
 * 유기동물 공고 신선도 윈도우(일) — **주 필터가 아니라 폭주 방어용 backstop 이다.**
 *
 * ⚠️ 예전 주석에 있던 "경과일별 `종료*` 비율(~108일 53.0% / ~112일 65.3%)" 표는 폐기했다.
 *    그 수치는 `processState` 를 측정한 값인데, 상류(data.go.kr)가 이 필드를 갱신하지 않아
 *    100일 지난 공고도 96~99% 가 "보호중" 으로 내려온다. 90일이라는 숫자의 근거 전체가
 *    사실이 아닌 필드에서 나왔던 셈이라 그대로 두면 다음 사람이 같은 착각을 반복한다.
 *
 * 지금의 실제 종료 판정은 `noticeEdt`(법정 공고기간)이고, 그 필터는 두 겹으로 건다:
 *  1) 서버사이드 — 목록 API 에 `noticeStatus=OPEN` 을 명시해 진행중만 받는다.
 *  2) 클라이언트 — {@link isNoticeClosed} 로 항목 단위 재확인(백엔드 만료 배치가 아직 돌지 않은
 *     구간, data.go.kr 직결 fallback 응답 대비).
 *
 * 그래서 이 윈도우는 평소 발화하지 않는다(진행중 공고는 정의상 `noticeEdt >= 오늘` = 발견 후 대략
 * 2주 이내). 남겨 두는 이유는 백엔드 만료 배치가 멈춰 종료분이 대량 유입되는 사고가 났을 때
 * sitemap 이 무한정 부풀지 않게 막는 마지막 방어선이기 때문이다.
 */
const ABANDONED_FRESHNESS_DAYS = 90;

/**
 * 수집 전체에 거는 벽시계 예산(ms).
 *
 * sitemap 은 정적 생성되고, Next 는 **한 페이지가 60초를 넘기면 워커에 SIGTERM 을 보내고 3회 재시도
 * 뒤 빌드 전체를 실패**시킨다. 이 파일은 최대 160+18 회의 원격 요청을 하므로 백엔드가 조금만 느려도
 * 그 한계를 넘는다 — 실제로 2026-07-26 프로덕션 배포가 이 이유로 연속 실패했다.
 *
 * 그래서 "가능한 만큼 모으고 시간이 다 되면 멈춘다" 로 바꾼다. **줄어든 sitemap 은 다음 빌드가
 * 복구하지만, 실패한 빌드는 아무것도 배포하지 못한다.** 60초에서 페이지 직렬화 등 나머지 작업 몫을
 * 빼고 잡는다.
 */
const COLLECT_BUDGET_MS = 35_000;

/** 개별 요청 상한. 하나가 멈춰도 전체 예산을 혼자 다 먹지 못하게 한다. */
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * 유기동물 목록을 한 번에 몇 페이지씩 가져올지.
 *
 * 직렬 160회는 왕복 지연만으로 예산을 넘긴다. 페이지 단위 조기 종료 조건(아래 {@link fetchAllAbandoned}
 * 참고)은 그대로 유지하고, 종료 지점을 지나친 페이지는 버린다 — 최대 {@link ABANDONED_BATCH} - 1
 * 페이지를 헛읽지만 그 대가로 수집 시간이 배수로 줄어든다.
 */
const ABANDONED_BATCH = 8;

interface Deadline {
  expired(): boolean;
  remaining(): number;
}

function makeDeadline(budgetMs: number): Deadline {
  const end = Date.now() + budgetMs;
  return {
    expired: () => Date.now() >= end,
    remaining: () => Math.max(0, end - Date.now()),
  };
}

/**
 * 예산을 지키는 JSON fetch. 실패·타임아웃·예산 소진은 모두 `null`.
 *
 * `AbortSignal` 대신 타이머 경주를 쓰는 이유: `signal` 을 넘기면 Next 의 Data Cache 를 우회하게 되어
 * `next: { revalidate }` 로 얻던 빌드 간 캐시가 사라진다. 그러면 느려서 생긴 문제를 더 느리게 만든다.
 * 여기서 필요한 건 요청 취소가 아니라 **기다림의 상한**이므로 경주로 충분하다.
 */
async function fetchJson(url: string, revalidate: number, deadline: Deadline): Promise<any | null> {
  const budget = Math.min(REQUEST_TIMEOUT_MS, deadline.remaining());
  if (budget <= 0) return null;

  return new Promise<any | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), budget);
    fetch(url, { next: { revalidate } })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (json) => {
          clearTimeout(timer);
          resolve(json);
        },
        () => {
          clearTimeout(timer);
          resolve(null);
        },
      );
  });
}

interface ApiPostSummary {
  id: string;
  time?: string;
}

interface ApiAbandonedSummary {
  desertionNo: string;
  happenDt?: string | null;
  /** 법정 공고 종료일 `"YYYYMMDD"` — 종료 판정의 주 신호. */
  noticeEdt?: string | null;
  /** 백엔드가 `closed_at` 기준으로 채워 주는 값. 만료 배치 이전/fallback 응답에서는 false. */
  noticeClosed?: boolean | null;
  processState?: string | null;
}

/** 백엔드에서 실종 게시글 ID + 작성 시간 listing. 실패 시 빈 배열로 fallback (sitemap 자체는 빌드 됨). */
async function fetchAllPosts(deadline: Deadline): Promise<ApiPostSummary[]> {
  const result: ApiPostSummary[] = [];
  for (let page = 0; page < POSTS_MAX_PAGES; page++) {
    if (deadline.expired()) break;
    const json = await fetchJson(
      `${BASE_URL}/posts?pageSize=${POSTS_PAGE_SIZE}&pageOffset=${page}&orderBy=CREATED_AT_DESC`,
      600,
      deadline,
    );
    if (!json) break;
    const contents: ApiPostSummary[] = json?.data?.contents ?? [];
    if (contents.length === 0) break;
    result.push(...contents);
    if (!json?.data?.hasNextPage) break;
  }
  return result;
}

/**
 * `happenDt` 컷오프로 조기 종료가 걸렸을 때만 평가하는 하한선.
 *
 * 진행중만 받는 지금은 `hasNextPage === false` 로 먼저 끝나므로 이 검사 자체를 거의 타지 않는다.
 * 그런데도 컷오프가 걸렸다는 건 90일치 진행중 공고가 있다는 뜻(= 만료 배치 이상) 이거나
 * `happenDt` 내림차순 전제가 깨졌다는 뜻이다. 실측 유입량 약 274건/일 기준 1주치(2,000건)를
 * 하한으로 잡아, 그보다 적게 모은 채 컷오프가 걸리면 경고를 남긴다.
 */
const ABANDONED_MIN_EXPECTED = 2_000;

/**
 * 진행중 유기동물 desertionNo listing — sitemap 의 /abandonment 페이지용.
 *
 * 수집 정책:
 *  1) 공고 종료분 제외 — 서버사이드 `noticeStatus=OPEN` + 항목 단위 {@link isNoticeClosed} 재확인.
 *     상세 페이지가 noindex 로 내보내는 페이지를 sitemap 이 색인 요청하던 모순을 제거한다.
 *     (예전에는 `processState.startsWith("종료")` 하나에 의존했는데, 상류가 그 값을 갱신하지 않아
 *      2만여 건이 필터를 그대로 통과했다 — 필터가 있는데 단 한 건도 걸리지 않는 상태였다.)
 *  2) 발견일 기준 최근 {@link ABANDONED_FRESHNESS_DAYS} 일만 포함(backstop).
 *
 * ⚠️ 종료 판정(`noticeEdt`)으로 **조기 종료(break)를 걸지 않는다.** 내림차순이 보장되는 정렬 키는
 *    `happenDt` 뿐이다(`AbandonedAnimalRepository.findOpenByFilters`). `noticeEdt` 는 정렬 키가
 *    아니므로 그걸로 break 를 걸면 아래에서 경고한 붕괴가 그대로 재현된다.
 *    → **break 는 `happenDt` 페이지 경계, 제외는 `noticeEdt` 항목 단위**로 역할을 분리한다.
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
 * `MAX_PAGES` 는 정책이 아니라 무한루프/폭주 방어용 안전장치다. 진행중만 받으므로 정상 동작에서는
 * `hasNextPage === false` 가 먼저 걸린다(진행중 약 2,400~3,100건 → 200건/페이지 = 약 15페이지).
 */
async function fetchAllAbandoned(deadline: Deadline): Promise<ApiAbandonedSummary[]> {
  const result: ApiAbandonedSummary[] = [];
  const PAGE = 200;
  const MAX_PAGES = 160; // 안전장치: 200 × 160 = 32,000건 상한
  const cutoff = happenDtCutoff(ABANDONED_FRESHNESS_DAYS); // "YYYYMMDD"
  let outOfOrderSkipped = 0;
  let stopped = false;
  let ranOutOfTime = false;

  for (let start = 1; start <= MAX_PAGES && !stopped; start += ABANDONED_BATCH) {
    if (deadline.expired()) {
      ranOutOfTime = true;
      break;
    }

    const pageNos: number[] = [];
    for (let p = start; p < start + ABANDONED_BATCH && p <= MAX_PAGES; p++) pageNos.push(p);
    const batch = await Promise.all(
      pageNos.map((pageNo) =>
        // noticeStatus=OPEN 은 백엔드 기본값이기도 하지만 명시해서 보낸다 —
        // 기본값이 바뀌어도 sitemap 이 종료 공고를 색인 요청하는 사고로 이어지지 않게.
        fetchJson(
          `${BASE_URL}/abandoned-animals?pageNo=${pageNo}&numOfRows=${PAGE}&noticeStatus=OPEN`,
          1800,
          deadline,
        ),
      ),
    );

    // 배치는 병렬로 받았지만 판정은 반드시 페이지 순서대로 한다 — 종료 지점 뒤의 페이지를
    // 결과에 섞으면 신선도 윈도우가 무의미해진다.
    for (let i = 0; i < batch.length; i++) {
      const json = batch[i];
      const pageNo = pageNos[i];
      if (!json) {
        stopped = true;
        break;
      }
      const contents: ApiAbandonedSummary[] = json?.data?.contents ?? [];
      if (contents.length === 0) {
        stopped = true;
        break;
      }

      // 이 페이지에서 마지막으로 만난 "판정 가능한" happenDt.
      // 페이지 경계 판정에만 쓰므로 형식 불량/누락 항목은 갱신하지 않는다.
      let lastDatedHappenDt: string | null = null;
      let staleInPage = 0;

      for (const item of contents) {
        if (!item?.desertionNo) continue;
        const happenDt = normalizeYyyyMmDd(item.happenDt);
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
        //
        // 종료 공고는 서버가 이미 걸러 주지만(noticeStatus=OPEN) 항목 단위로 한 번 더 본다:
        // 백엔드 만료 배치가 아직 돌지 않은 구간과 data.go.kr 직결 fallback 응답은 진행중으로 온다.
        if (isNoticeClosed(item)) continue;
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
        stopped = true;
        break;
      }
      if (!json?.data?.hasNextPage) {
        stopped = true;
        break;
      }
    }
  }

  if (ranOutOfTime) {
    // 조용한 절단은 "다 담았다" 로 읽힌다. 남기지 않으면 sitemap 이 줄어든 걸 아무도 모른다.
    console.warn(
      `[sitemap] 수집 예산 ${COLLECT_BUDGET_MS}ms 를 소진해 abandoned 수집을 ${result.length}건에서 중단했다. ` +
        `백엔드 응답이 느려졌는지 확인할 것.`,
    );
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
async function fetchRegionUrls(deadline: Deadline): Promise<string[]> {
  const sidoJson = await fetchJson(`${BASE_URL}/abandoned-animals/sido`, 86_400, deadline);
  if (!sidoJson) return [];
  const sidoList: Array<{ orgCd: string | null; orgdownNm: string | null }> = sidoJson?.data ?? [];

  const valid = sidoList
    .map((sido) => ({ slug: regionSlug(sido?.orgdownNm), orgCd: sido?.orgCd }))
    // orgdownNm 이 null 인 시도는 라우트 자체가 성립하지 않는다 → 건너뜀
    .filter((s): s is { slug: string; orgCd: string } => Boolean(s.slug && s.orgCd));

  // 시도는 17개뿐이라 한 번에 병렬로 받는다 — 직렬로 돌리면 왕복 지연만으로 예산을 갉아먹는다.
  const sigungu = await Promise.all(
    valid.map((s) =>
      fetchJson(
        `${BASE_URL}/abandoned-animals/sigungu?uprCd=${encodeURIComponent(s.orgCd)}`,
        86_400,
        deadline,
      ),
    ),
  );

  const urls: string[] = [`${DOMAIN_URL}/abandonment/region`];
  valid.forEach((sido, i) => {
    urls.push(`${DOMAIN_URL}/abandonment/region/${sido.slug}`);
    // 시군구 하나 실패해도 시도 페이지와 나머지는 계속 살린다.
    const sggList: Array<{ orgdownNm: string | null }> = sigungu[i]?.data ?? [];
    for (const sgg of sggList) {
      // 인천/경남 등 일부 시군구는 orgdownNm 이 null 로 내려온다.
      // 그대로 두면 `/region/{sido}/null` 404 URL 이 sitemap 에 실린다.
      const sggSlug = regionSlug(sgg?.orgdownNm);
      if (!sggSlug) continue;
      urls.push(`${DOMAIN_URL}/abandonment/region/${sido.slug}/${sggSlug}`);
    }
  });
  return urls;
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
  // 예산은 네 수집기가 공유한다 — 전체가 60초 안에 끝나야 하지 개별이 아니다.
  const deadline = makeDeadline(COLLECT_BUDGET_MS);
  const [posts, abandoned, mdxPosts, regionUrls] = await Promise.all([
    fetchAllPosts(deadline),
    fetchAllAbandoned(deadline),
    safeGetAllPosts(),
    fetchRegionUrls(deadline),
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
    { url: `${DOMAIN_URL}/flyer`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${DOMAIN_URL}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${DOMAIN_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${DOMAIN_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
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
