#!/usr/bin/env node
/**
 * IndexNow 제출기 — findmypet.platformholder.site
 *
 * 유기동물 공고는 공공데이터 동기화(1시간 주기)로 계속 생기고 사라진다.
 * sitemap 재크롤링만 기다리면 신선도가 뒤처지므로, 새로 올라온 공고를
 * IndexNow(Bing·Yandex·Seznam·Naver 등 참여 엔진)에 직접 통보한다.
 * Google 은 IndexNow 미참여 — Google 경로는 기존 sitemap + lastmod 가 그대로 담당한다.
 *
 * 설계 원칙
 * - 기본 동작은 "변경분만". 전량(10,000+) 제출은 --all 로 명시할 때만.
 * - 색인 대상만 보낸다. 백엔드가 종료로 판정한 공고는 상세 페이지가 noindex 이므로 제외.
 *   sitemap 이 아니라 API 를 소스로 쓰고 서버의 noticeClosed 값을 직접 확인한다.
 * - 실패해도 배포를 깨뜨리지 않는다. 항상 exit 0.
 *
 * 사용
 *   node scripts/indexnow.mjs --dry-run            # 제출 없이 대상만 출력
 *   node scripts/indexnow.mjs                      # 최근 1일 신규 공고
 *   node scripts/indexnow.mjs --since=3            # 최근 3일
 *   node scripts/indexnow.mjs --include-core       # 정적 핵심 페이지 + 블로그 글 추가
 *   node scripts/indexnow.mjs --include-regions    # 지역별 공고 페이지 추가
 *   node scripts/indexnow.mjs --all --include-core --include-regions   # 전량(초기 1회용)
 *   node scripts/indexnow.mjs --url=https://findmypet.platformholder.site/guide
 *   node scripts/indexnow.mjs --state=.indexnow-state.json             # 중복 제출 억제
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SITE = "https://findmypet.platformholder.site";
const SITE_HOST = "findmypet.platformholder.site";

/** 키는 비밀이 아니다 — 도메인 소유 증명용이라 공개 호스팅이 전제다(public/{key}.txt). */
const DEFAULT_KEY = "415d353ce4212adb03660ebf5163862c";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://fmp.platformholder.site/api/v1";

/** IndexNow 규격: 한 요청당 최대 10,000 URL. */
const MAX_URLS_PER_REQUEST = 10_000;

const LIST_PAGE_SIZE = 200;
/** sitemap 과 같은 상한 (200 × 50 = 10,000건). */
const LIST_MAX_PAGES = 50;

/**
 * 목록 API 는 happenDt 내림차순이라 조기 종료가 가능하다.
 * 다만 happenDt 가 오래됐는데 공고(noticeSdt)만 최근인 건이 있어 여유분을 둔다.
 */
const SCAN_SLACK_DAYS = 14;

/** robots.txt Disallow + 페이지 metadata 의 noindex 와 반드시 같이 유지할 것. */
const BLOCKED_PREFIXES = [
  "/profile",
  "/notifications",
  "/auth/",
  "/edit/",
  "/leaflet",
  "/search",
];

/** 상태 파일이 무한히 커지지 않도록 오래된 기록은 정리. */
const STATE_PRUNE_DAYS = 180;

// ---------------------------------------------------------------- args

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    all: false,
    since: 1,
    slack: SCAN_SLACK_DAYS,
    includeCore: false,
    includeRegions: false,
    coreOnly: false,
    urls: [],
    urlsFile: null,
    state: null,
    force: false,
    limit: Infinity,
    key: process.env.INDEXNOW_KEY || DEFAULT_KEY,
    endpoint: process.env.INDEXNOW_ENDPOINT || INDEXNOW_ENDPOINT,
  };
  for (const raw of argv) {
    const [flag, value] = raw.includes("=") ? raw.split(/=(.*)/s) : [raw, undefined];
    switch (flag) {
      case "--dry-run":
      case "--dryrun":
        opts.dryRun = true;
        break;
      case "--all":
        opts.all = true;
        break;
      case "--since":
        opts.since = Number(value);
        break;
      case "--slack":
        opts.slack = Number(value);
        break;
      case "--include-core":
        opts.includeCore = true;
        break;
      case "--include-regions":
        opts.includeRegions = true;
        break;
      case "--core-only":
        opts.includeCore = true;
        opts.coreOnly = true;
        break;
      case "--url":
        if (value) opts.urls.push(value);
        break;
      case "--urls-file":
        opts.urlsFile = value ?? null;
        break;
      case "--state":
        opts.state = value ?? ".indexnow-state.json";
        break;
      case "--force":
        opts.force = true;
        break;
      case "--limit":
        opts.limit = Number(value);
        break;
      case "--key":
        if (value) opts.key = value;
        break;
      case "--endpoint":
        if (value) opts.endpoint = value;
        break;
      default:
        if (flag.startsWith("--")) log(`알 수 없는 옵션 무시: ${flag}`);
    }
  }
  if (!Number.isFinite(opts.since) || opts.since < 0) opts.since = 1;
  if (!Number.isFinite(opts.slack) || opts.slack < 0) opts.slack = SCAN_SLACK_DAYS;
  return opts;
}

function log(...args) {
  console.log("[indexnow]", ...args);
}

// ---------------------------------------------------------------- dates

/** 공공데이터 날짜는 KST 기준 YYYYMMDD 문자열이라 비교도 같은 형식으로 맞춘다. */
function kstYmd(offsetDays = 0) {
  const ms = Date.now() + 9 * 60 * 60 * 1000 - offsetDays * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10).replace(/-/g, "");
}

function isYmd(v) {
  return typeof v === "string" && /^\d{8}$/.test(v);
}

/** 공고가 "최근"인지 판정. 발견일(happenDt)과 공고 시작일(noticeSdt) 중 늦은 쪽 기준. */
function freshnessYmd(item) {
  const candidates = [item.happenDt, item.noticeSdt].filter(isYmd);
  return candidates.length ? candidates.sort().at(-1) : null;
}

// ---------------------------------------------------------------- fetch

async function getJson(url, { retries = 2 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) {
        if (res.status >= 500 && attempt < retries) {
          await sleep(500 * (attempt + 1));
          continue;
        }
        return null;
      }
      return await res.json();
    } catch (err) {
      if (attempt >= retries) {
        log(`요청 실패(무시): ${url} — ${err?.message ?? err}`);
        return null;
      }
      await sleep(500 * (attempt + 1));
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------- collectors

/** 진행중 공고만 수집. 종료(반환·입양·자연사) 건은 상세가 noindex 라 제출 대상이 아니다. */
function isOngoing(item) {
  return item?.noticeClosed === false;
}

async function collectAbandonedUrls({ all, since, slack }) {
  const cutoff = all ? null : kstYmd(since);
  const scanCutoff = all ? null : kstYmd(since + slack);

  const urls = [];
  let scanned = 0;
  let closedSkipped = 0;

  for (let pageNo = 1; pageNo <= LIST_MAX_PAGES; pageNo++) {
    const json = await getJson(
      `${API_BASE}/abandoned-animals?pageNo=${pageNo}&numOfRows=${LIST_PAGE_SIZE}&noticeStatus=OPEN`,
    );
    const contents = json?.data?.contents;
    if (!Array.isArray(contents) || contents.length === 0) break;
    scanned += contents.length;

    for (const item of contents) {
      if (!item?.desertionNo) continue;
      if (!isOngoing(item)) {
        closedSkipped++;
        continue;
      }
      if (cutoff) {
        const fresh = freshnessYmd(item);
        if (!fresh || fresh < cutoff) continue;
      }
      urls.push(`${SITE}/abandonment/${encodeURIComponent(item.desertionNo)}`);
    }

    if (json?.data?.hasNextPage === false) break;

    // 목록은 happenDt 내림차순 — 페이지 전체가 여유분보다 오래되면 이후는 볼 필요가 없다.
    if (scanCutoff) {
      const newest = contents
        .map((c) => c.happenDt)
        .filter(isYmd)
        .sort()
        .at(-1);
      if (newest && newest < scanCutoff) break;
    }
  }

  log(
    `공고 스캔 ${scanned}건 → 제출 후보 ${urls.length}건 (종료 상태 제외 ${closedSkipped}건)`,
  );
  return urls;
}

/** 지역별 공고 페이지(/abandonment/region/*). sitemap 과 같은 소스. */
async function collectRegionUrls() {
  const sidoJson = await getJson(`${API_BASE}/abandoned-animals/sido`);
  const sidoList = sidoJson?.data;
  if (!Array.isArray(sidoList) || sidoList.length === 0) {
    log("시도 목록 조회 실패 — 지역 페이지 건너뜀");
    return [];
  }

  const urls = [`${SITE}/abandonment/region`];
  let skipped = 0;

  for (const sido of sidoList) {
    if (!isRegionName(sido?.orgdownNm)) {
      skipped++;
      continue;
    }
    const sidoSlug = encodeURIComponent(sido.orgdownNm);
    urls.push(`${SITE}/abandonment/region/${sidoSlug}`);

    const sggJson = await getJson(
      `${API_BASE}/abandoned-animals/sigungu?uprCd=${encodeURIComponent(sido.orgCd)}`,
    );
    const sggList = sggJson?.data;
    if (!Array.isArray(sggList)) continue;
    for (const sgg of sggList) {
      // 일부 시군구는 이름이 비어 있고, 해당 URL 은 실제로 404 다 — 제출하면 신뢰도만 깎인다.
      if (!isRegionName(sgg?.orgdownNm)) {
        skipped++;
        continue;
      }
      urls.push(
        `${SITE}/abandonment/region/${sidoSlug}/${encodeURIComponent(sgg.orgdownNm)}`,
      );
    }
  }

  if (skipped > 0) log(`지역명 비정상으로 제외 ${skipped}건`);
  return urls;
}

function isRegionName(name) {
  return (
    typeof name === "string" &&
    name.trim().length > 0 &&
    name !== "null" &&
    name !== "undefined"
  );
}

/** 정적 핵심 페이지 + MDX 블로그 글. 모두 index,follow 로 서비스되는 페이지다. */
function collectCoreUrls() {
  const urls = [
    `${SITE}/`,
    `${SITE}/guide`,
    `${SITE}/faq`,
    `${SITE}/posts`,
    `${SITE}/register`,
    `${SITE}/lost`,
    `${SITE}/abandonment`,
    `${SITE}/abandonment/region`,
  ];

  const postsDir = path.join(ROOT, "src", "posts");
  try {
    for (const file of fs.readdirSync(postsDir)) {
      if (!file.endsWith(".mdx")) continue;
      urls.push(`${SITE}/posts/${file.replace(/\.mdx$/, "")}`);
    }
  } catch {
    log("블로그 글 디렉터리를 읽지 못해 건너뜀");
  }

  return urls;
}

function readUrlsFile(file) {
  try {
    return fs
      .readFileSync(path.resolve(ROOT, file), "utf-8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));
  } catch (err) {
    log(`URL 파일을 읽지 못함(무시): ${file} — ${err?.message ?? err}`);
    return [];
  }
}

// ---------------------------------------------------------------- url guard

/** 같은 host + https + 차단 경로가 아닌 URL 만 통과. */
function isSubmittable(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.hostname !== SITE_HOST) return false;
  if (parsed.pathname.split("/").some((seg) => seg === "null" || seg === "undefined")) {
    return false;
  }
  return !BLOCKED_PREFIXES.some(
    (p) => parsed.pathname === p || parsed.pathname.startsWith(p),
  );
}

function normalize(urls) {
  const seen = new Set();
  const kept = [];
  let dropped = 0;
  for (const url of urls) {
    if (!isSubmittable(url)) {
      dropped++;
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);
    kept.push(url);
  }
  if (dropped > 0) log(`제출 대상 아님으로 제외 ${dropped}건 (타 호스트·차단 경로·비정상 URL)`);
  return kept;
}

// ---------------------------------------------------------------- state

function loadState(file) {
  if (!file) return null;
  const abs = path.resolve(ROOT, file);
  try {
    const parsed = JSON.parse(fs.readFileSync(abs, "utf-8"));
    if (parsed && typeof parsed.submitted === "object" && parsed.submitted !== null) {
      return { file: abs, submitted: parsed.submitted };
    }
  } catch {
    // 상태 파일이 없거나 깨졌으면 빈 상태로 시작 — 제출 자체는 계속한다.
  }
  return { file: abs, submitted: {} };
}

function saveState(state, urls) {
  if (!state) return;
  const now = Date.now();
  const cutoff = now - STATE_PRUNE_DAYS * 24 * 60 * 60 * 1000;
  const next = {};
  for (const [url, iso] of Object.entries(state.submitted)) {
    const at = Date.parse(iso);
    if (Number.isFinite(at) && at >= cutoff) next[url] = iso;
  }
  const iso = new Date(now).toISOString();
  for (const url of urls) next[url] = iso;

  try {
    fs.mkdirSync(path.dirname(state.file), { recursive: true });
    fs.writeFileSync(
      state.file,
      `${JSON.stringify({ version: 1, updatedAt: iso, submitted: next }, null, 2)}\n`,
      "utf-8",
    );
    log(`상태 저장: ${state.file} (${Object.keys(next).length}건 기록)`);
  } catch (err) {
    log(`상태 저장 실패(무시): ${err?.message ?? err}`);
  }
}

// ---------------------------------------------------------------- submit

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * 한 배치 제출. 성공은 200(수락) / 202(키 검증 대기).
 * 4xx 는 재시도해도 소용없으므로 로그만 남긴다. 429·5xx·네트워크 오류만 재시도.
 */
async function submitBatch(urls, { key, endpoint }, index, total) {
  const body = {
    host: SITE_HOST,
    key,
    keyLocation: `${SITE}/${key}.txt`,
    urlList: urls,
  };

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });

      if (res.status === 200 || res.status === 202) {
        log(`배치 ${index}/${total} 제출 성공 — HTTP ${res.status}, ${urls.length}건`);
        return true;
      }
      if (res.status === 429 || res.status >= 500) {
        if (attempt < 2) {
          const wait = 2000 * (attempt + 1);
          log(`배치 ${index}/${total} HTTP ${res.status} — ${wait}ms 후 재시도`);
          await sleep(wait);
          continue;
        }
      }
      const text = await res.text().catch(() => "");
      log(
        `배치 ${index}/${total} 제출 실패 — HTTP ${res.status} ${text.slice(0, 200)} (재시도 안 함)`,
      );
      return false;
    } catch (err) {
      if (attempt < 2) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      log(`배치 ${index}/${total} 네트워크 오류(무시): ${err?.message ?? err}`);
      return false;
    }
  }
  return false;
}

// ---------------------------------------------------------------- main

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!/^[0-9a-fA-F]{8,128}$/.test(opts.key)) {
    log(`키 형식이 올바르지 않음(8~128자 16진수): ${opts.key} — 중단`);
    return;
  }

  const keyFile = path.join(ROOT, "public", `${opts.key}.txt`);
  if (!fs.existsSync(keyFile)) {
    log(`경고: 키 파일이 없습니다 — ${keyFile}. 배포본에 없으면 검증에 실패한다.`);
  }

  const collected = [];

  if (opts.urls.length > 0) collected.push(...opts.urls);
  if (opts.urlsFile) collected.push(...readUrlsFile(opts.urlsFile));

  const explicitOnly = opts.urls.length > 0 || Boolean(opts.urlsFile);

  if (!explicitOnly) {
    if (opts.includeCore) collected.push(...collectCoreUrls());
    if (!opts.coreOnly) {
      if (opts.includeRegions) collected.push(...(await collectRegionUrls()));
      collected.push(
        ...(await collectAbandonedUrls({
          all: opts.all,
          since: opts.since,
          slack: opts.slack,
        })),
      );
    }
  }

  let urls = normalize(collected);

  const state = loadState(opts.state);
  if (state && !opts.force) {
    const before = urls.length;
    urls = urls.filter((u) => !(u in state.submitted));
    if (before !== urls.length) {
      log(`이전 제출분 제외 ${before - urls.length}건 (--force 로 무시 가능)`);
    }
  }

  if (Number.isFinite(opts.limit) && urls.length > opts.limit) {
    log(`--limit ${opts.limit} 적용 — ${urls.length}건 중 앞쪽만 제출`);
    urls = urls.slice(0, opts.limit);
  }

  if (urls.length === 0) {
    log("제출할 URL 이 없습니다. 종료.");
    return;
  }

  const batches = chunk(urls, MAX_URLS_PER_REQUEST);
  log(
    `대상 ${urls.length}건 / 배치 ${batches.length}개 / key=${opts.key} / mode=${
      opts.all ? "all" : `since ${opts.since}d`
    }`,
  );

  if (opts.dryRun) {
    log("--dry-run — 실제 제출은 하지 않습니다. 샘플:");
    for (const u of urls.slice(0, 10)) console.log(`  ${u}`);
    if (urls.length > 10) console.log(`  ... 외 ${urls.length - 10}건`);
    return;
  }

  const submitted = [];
  for (let i = 0; i < batches.length; i++) {
    const ok = await submitBatch(batches[i], opts, i + 1, batches.length);
    if (ok) submitted.push(...batches[i]);
    if (i < batches.length - 1) await sleep(1000);
  }

  log(`완료 — ${submitted.length}/${urls.length}건 수락됨`);
  if (submitted.length > 0) saveState(state, submitted);
}

// 어떤 실패도 배포를 깨뜨리지 않는다.
main()
  .catch((err) => {
    log(`예상치 못한 오류(무시): ${err?.stack ?? err}`);
  })
  .finally(() => {
    process.exitCode = 0;
  });
