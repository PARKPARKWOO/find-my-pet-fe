import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadTypeScriptModule } from "./test-utils/load-typescript-module.mjs";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const registryPath = path.resolve(scriptsDirectory, "../src/lib/purposeCategories.ts");
const paginationPath = path.resolve(scriptsDirectory, "../src/lib/pagination.ts");
const lostListPath = path.resolve(scriptsDirectory, "../src/app/_components/main/LostList.tsx");
const abandonmentListPath = path.resolve(
  scriptsDirectory,
  "../src/app/_components/main/AbandonmentList.tsx",
);
const lostPaginationPath = path.resolve(
  scriptsDirectory,
  "../src/app/_components/LostPagination.tsx",
);
const paginationUiPath = path.resolve(
  scriptsDirectory,
  "../src/app/_components/ui/pagination.tsx",
);
const abandonmentCardPath = path.resolve(
  scriptsDirectory,
  "../src/app/_components/AbandonmentCard.tsx",
);
const lostCardPath = path.resolve(scriptsDirectory, "../src/app/_components/LostCard.tsx");
const homeSeedPath = path.resolve(scriptsDirectory, "../src/lib/homeSeed.ts");
const lostIndexPagePath = path.resolve(
  scriptsDirectory,
  "../src/app/(route)/lost/page.tsx",
);
const abandonmentIndexPagePath = path.resolve(
  scriptsDirectory,
  "../src/app/(route)/abandonment/page.tsx",
);
const llmsPath = path.resolve(scriptsDirectory, "../public/llms.txt");

function extractAbandonmentMainEffect(source) {
  const start = source.indexOf(
    "  useEffect(() => {\n    if (!isCanonicalPageQuery(rawPage, currentPage))",
  );
  assert.notEqual(start, -1, "main abandonment effect must start with the canonical-page guard");
  const end = source.indexOf("\n  ]);", start);
  assert.notEqual(end, -1, "main abandonment effect dependency boundary must exist");
  return source.slice(start, end + "\n  ]);".length);
}

function assertAbandonmentMainRequestContract(mainEffect) {
  const canonicalIndex = mainEffect.indexOf(
    "if (!isCanonicalPageQuery(rawPage, currentPage))",
  );
  const decisionIndex = mainEffect.indexOf("const seedDecision = decideHomeSeedRequest");
  const controllerIndex = mainEffect.indexOf("const controller = new AbortController()");
  const requestIndex = mainEffect.indexOf('apiClient.get("/abandoned-animals"');

  assert.ok(
    canonicalIndex >= 0 &&
      canonicalIndex < decisionIndex &&
      decisionIndex < controllerIndex &&
      controllerIndex < requestIndex,
  );
  assert.equal((mainEffect.match(/apiClient\.get\("\/abandoned-animals"/g) ?? []).length, 1);
  assert.doesNotMatch(mainEffect, /\/abandoned-animals\/(?:sido|sigungu)/);
  assert.match(mainEffect, /signal: controller\.signal/);
  assert.ok((mainEffect.match(/controller\.signal\.aborted/g) ?? []).length >= 3);
  assert.match(mainEffect, /return \(\) => controller\.abort\(\);/);
}

test("목적 카테고리는 승인된 명칭과 경로를 한 단계로 제공한다", () => {
  const { PURPOSE_CATEGORIES } = loadTypeScriptModule(registryPath);

  assert.deepEqual(
    PURPOSE_CATEGORIES.map(({ label, href, availability }) => ({ label, href, availability })),
    [
      { label: "보호소에서 가족을 기다려요", href: "/abandonment", availability: "available" },
      { label: "집을 잃었어요", href: "/lost", availability: "available" },
      { label: "우리집 근처 보호소", href: "/shelters", availability: "planned" },
      { label: "반려동물을 입양하고 싶어요", href: "/adoption/wanted", availability: "planned" },
      { label: "반려동물의 새 가족을 찾아요", href: "/adoption/offer", availability: "planned" },
    ],
  );
});

test("목록은 오류와 빈 결과를 구분하고 보호 카드를 링크로 제공한다", () => {
  const lost = fs.readFileSync(lostListPath, "utf8");
  const abandoned = fs.readFileSync(abandonmentListPath, "utf8");
  const lostPagination = fs.readFileSync(lostPaginationPath, "utf8");
  const abandonmentCard = fs.readFileSync(abandonmentCardPath, "utf8");

  assert.match(lost, /목록을 불러오지 못했어요/);
  assert.match(lost, /지금 등록된 실종 소식이 없어요/);
  assert.match(lost, /다시 시도/);
  assert.match(abandoned, /보호 동물 정보를 불러오지 못했어요/);
  assert.match(abandoned, /다시 시도/);
  assert.match(abandoned, /<Link[\s\S]*?href=\{`\/abandonment\//);
  assert.doesNotMatch(abandoned, /localStorage\.setItem\("petInfo"/);
  assert.match(lost, /const controller = new AbortController\(\)/);
  assert.ok((lost.match(/signal: controller\.signal/g) ?? []).length >= 2);
  assert.match(lost, /if \(controller\.signal\.aborted\) return;/);
  assert.match(lost, /return \(\) => controller\.abort\(\)/);
  assert.match(abandoned, /const rawPage = searchParams\.get\(QUERY_KEY\.page\)/);
  assert.match(abandoned, /if \(!isCanonicalPageQuery\(rawPage, currentPage\)\) \{[\s\S]*?replacePage\(currentPage\);[\s\S]*?return;/);
  assert.match(abandoned, /let keepLoadingForRedirect = false/);
  assert.match(
    abandoned,
    /keepLoadingForRedirect = true;\s*replacePage\(normalizedPage\);\s*return;/,
  );
  assert.match(
    abandoned,
    /if \(!controller\.signal\.aborted && !keepLoadingForRedirect\) setIsLoading\(false\);/,
  );
  assert.match(lostPagination, /if \(totalPages <= 0\) return null/);
  assert.match(abandonmentCard, /className="h-\[350px\] w-full/);
});

test("홈 서버 시드는 정규 요청에서 한 번만 쓰고 목록의 기존 요청 계약은 보존한다", () => {
  const lost = fs.readFileSync(lostListPath, "utf8");
  const abandoned = fs.readFileSync(abandonmentListPath, "utf8");
  const seed = fs.readFileSync(homeSeedPath, "utf8");

  assert.match(seed, /export function decideHomeSeedRequest/);
  assert.match(lost, /export interface LostListProps\s*\{\s*initialPage\?: HomeListSeed<LostPetSummary>/);
  assert.match(abandoned, /export interface AbandonmentListProps\s*\{\s*initialPage\?: HomeListSeed<AbandonedAnimalSummary>/);
  assert.match(lost, /HOME_LOST_REQUEST_KEY/);
  assert.match(abandoned, /HOME_ABANDONMENT_REQUEST_KEY/);
  assert.match(lost, /getLostRequestKey\(\{ currentPage, pageSize: ITEM_PER_PAGE, nearby \}\)/);
  assert.match(
    abandoned,
    /getAbandonmentRequestKey\(\{\s*noticeStatus,\s*animalType: filter,\s*uprCd,\s*orgCd,\s*currentPage,\s*pageSize: PAGE_SIZE,\s*\}\)/,
  );
  assert.match(lost, /useState\(\(\) => initialSeedRef\.current\?\.data\.contents \?\? \[\]\)/);
  assert.match(lost, /useState\(\(\) => !initialSeedRef\.current\)/);
  assert.match(abandoned, /useState\(\(\) => initialSeedRef\.current\?\.data\.totalCount \?\? 0\)/);
  assert.match(abandoned, /useState\(\(\) => !initialSeedRef\.current\)/);
  assert.match(lost, /const seedDecision = decideHomeSeedRequest\(/);
  assert.match(abandoned, /const seedDecision = decideHomeSeedRequest\(/);
  assert.match(lost, /retryRequested: reloadToken > 0/);
  assert.match(abandoned, /retryRequested: reloadToken > 0/);
  assert.doesNotMatch(lost, /\[[^\]]*initialPage[^\]]*\]/);
  assert.doesNotMatch(abandoned, /\[[^\]]*initialPage[^\]]*\]/);

  assert.match(
    abandoned,
    /validateHomeListSeed\(initialPage, \{\s*isCanonicalRequest: isCanonicalPageQuery\(rawPage, currentPage\),\s*expectedRequestKey: HOME_ABANDONMENT_REQUEST_KEY,\s*currentRequestKey,\s*\}\)/,
  );

  const mainEffect = extractAbandonmentMainEffect(abandoned);
  assertAbandonmentMainRequestContract(mainEffect);
  assert.ok(lost.indexOf("const seedDecision = decideHomeSeedRequest") < lost.indexOf("apiClient.get"));

  assert.match(lost, /\/posts\/nearby[\s\S]*?signal: controller\.signal/);
  assert.match(lost, /\/posts\?pageSize=\$\{ITEM_PER_PAGE\}&pageOffset=\$\{currentPage - 1\}&orderBy=CREATED_AT_DESC[\s\S]*?signal: controller\.signal/);
  assert.match(lost, /return \(\) => controller\.abort\(\)/);
  assert.match(abandoned, /\/abandoned-animals\/sido/);
  assert.match(abandoned, /\/abandoned-animals\/sigungu[\s\S]*?signal: controller\.signal/);
  assert.match(abandoned, /\/me\/abandoned-subscriptions/);
  assert.match(lost, /flatMap\(/);
  assert.match(lost, /AD_INTERVAL/);
  assert.match(lost, /AdFitSlot/);
  assert.match(lost, /AdSlot/);
  assert.doesNotMatch(lost, /homeFeed\.server/);
  assert.doesNotMatch(abandoned, /homeFeed\.server/);

  const retryMutation = lost.replace("retryRequested: reloadToken > 0", "retryRequested: false");
  assert.doesNotMatch(retryMutation, /retryRequested: reloadToken > 0/);
  const canonicalMutation = abandoned.replace(
    "if (!isCanonicalPageQuery(rawPage, currentPage))",
    "if (false)",
  );
  assert.equal(canonicalMutation.indexOf("if (!isCanonicalPageQuery(rawPage, currentPage))"), -1);

  const mainSignalMutation = mainEffect.replace("signal: controller.signal,", "");
  const sourceWithoutMainSignal = abandoned.replace(mainEffect, mainSignalMutation);
  assert.match(
    sourceWithoutMainSignal,
    /\/abandoned-animals\/sigungu[\s\S]*?signal: controller\.signal/,
  );
  assert.throws(() => assertAbandonmentMainRequestContract(mainSignalMutation));

  const mainCleanupMutation = mainEffect.replace("return () => controller.abort();", "return;");
  const sourceWithoutMainCleanup = abandoned.replace(mainEffect, mainCleanupMutation);
  assert.match(
    sourceWithoutMainCleanup,
    /\/abandoned-animals\/sigungu[\s\S]*?return \(\) => controller\.abort\(\)/,
  );
  assert.throws(() => assertAbandonmentMainRequestContract(mainCleanupMutation));
});

test("공유된 nullable 카드 타입은 빈 필드를 꾸며내지 않는다", () => {
  const lostCard = fs.readFileSync(lostCardPath, "utf8");
  const abandonmentCard = fs.readFileSync(abandonmentCardPath, "utf8");
  const lost = fs.readFileSync(lostListPath, "utf8");
  const abandoned = fs.readFileSync(abandonmentListPath, "utf8");

  assert.match(lostCard, /import type \{ LostPetSummary \} from "@\/lib\/homeFeed"/);
  assert.match(lostCard, /thumbnail \?/);
  assert.match(abandonmentCard, /import type \{ AbandonedAnimalSummary \} from "@\/lib\/homeFeed"/);
  assert.doesNotMatch(abandonmentCard, /from "\.\/main\/AbandonmentList"/);
  assert.doesNotMatch(lostCard, /homeFeed\.server/);
  assert.doesNotMatch(abandonmentCard, /homeFeed\.server/);
  assert.doesNotMatch(abandoned, /interface IPet/);
  assert.doesNotMatch(lost, /interface ILostPet/);
  assert.match(abandonmentCard, /pet\.sexCd &&/);
  assert.match(abandonmentCard, /pet\.weight &&/);
  assert.match(abandonmentCard, /pet\.processState &&/);
  assert.match(abandonmentCard, /formatKindLabel\(pet\.kindCd\) \?\? "구조동물"/);
});

test("페이지 번호는 총 건수를 벗어나지 않도록 정규화한다", () => {
  const { clampPageToTotal, isCanonicalPageQuery } = loadTypeScriptModule(paginationPath);

  assert.equal(clampPageToTotal(999, 101, 20), 6);
  assert.equal(clampPageToTotal(0, 101, 20), 1);
  assert.equal(clampPageToTotal(999, 0, 20), 1);
  assert.equal(isCanonicalPageQuery(null, 1), true);
  assert.equal(isCanonicalPageQuery("2", 2), true);
  assert.equal(isCanonicalPageQuery("1", 1), false);
  assert.equal(isCanonicalPageQuery("0", 1), false);
  assert.equal(isCanonicalPageQuery("-1", 1), false);
  assert.equal(isCanonicalPageQuery("foo", 1), false);
  assert.equal(isCanonicalPageQuery("01", 1), false);
});

test("목록 갱신은 범위를 벗어난 페이지와 이전 지역 응답을 남기지 않는다", () => {
  const lost = fs.readFileSync(lostListPath, "utf8");
  const abandoned = fs.readFileSync(abandonmentListPath, "utf8");

  assert.match(lost, /clampPageToTotal\(currentPage, nextTotalCount, ITEM_PER_PAGE\)/);
  assert.match(
    lost,
    /normalizedPage !== currentPage[\s\S]*?keepLoadingForRedirect = true;[\s\S]*?setCurrentPage\(normalizedPage\)/,
  );
  assert.match(
    lost,
    /if \(!controller\.signal\.aborted && !keepLoadingForRedirect\) setIsLoading\(false\)/,
  );
  assert.ok((abandoned.match(/const controller = new AbortController\(\)/g) ?? []).length >= 2);
  assert.match(
    abandoned,
    /\/abandoned-animals\/sigungu[\s\S]*?signal: controller\.signal[\s\S]*?return \(\) => controller\.abort\(\)/,
  );
});

test("페이지 이동 컨트롤은 키보드로 조작 가능한 실제 버튼이다", () => {
  const paginationUi = fs.readFileSync(paginationUiPath, "utf8");

  assert.match(paginationUi, /React\.ComponentProps<"button">/);
  assert.match(paginationUi, /<button\s+type="button"/);
  assert.doesNotMatch(paginationUi, /<a\s/);
  assert.match(paginationUi, /aria-label="이전 페이지"/);
  assert.match(paginationUi, /aria-label="다음 페이지"/);
});

test("카테고리 목록 인덱스는 독립 라우트 소스를 제공한다", () => {
  const lostIndex = fs.readFileSync(lostIndexPagePath, "utf8");
  const abandonmentIndex = fs.readFileSync(abandonmentIndexPagePath, "utf8");

  assert.match(lostIndex, /export default function LostIndexPage\(\)/);
  assert.match(abandonmentIndex, /export default function AbandonmentIndexPage\(\)/);
  assert.match(lostIndex, /const PAGE_URL = `\$\{SITE_DOMAIN\}\/lost`/);
  assert.match(abandonmentIndex, /const PAGE_URL = `\$\{SITE_DOMAIN\}\/abandonment`/);
});

test("카테고리 인덱스의 브레드크럼은 내비게이션 목적을 설명한다", () => {
  const lostIndex = fs.readFileSync(lostIndexPagePath, "utf8");
  const abandonmentIndex = fs.readFileSync(abandonmentIndexPagePath, "utf8");

  assert.match(lostIndex, /<nav[^>]+aria-label="현재 위치"/);
  assert.match(abandonmentIndex, /<nav[^>]+aria-label="현재 위치"/);
});

test("실종 목록 설명은 상태를 제한한다고 오해시키지 않는다", () => {
  const llms = fs.readFileSync(llmsPath, "utf8");

  assert.match(llms, /\/lost\): 실종 소식 목록/);
  assert.doesNotMatch(llms, /\/lost\): 진행 중인 실종 소식 목록/);
});

test("보호 목록 필터는 선택 상태와 지역 선택 목적을 전달한다", () => {
  const abandoned = fs.readFileSync(abandonmentListPath, "utf8");

  assert.match(abandoned, /aria-pressed=\{filter === "ALL"\}/);
  assert.match(abandoned, /aria-pressed=\{filter === type\}/);
  assert.match(abandoned, /aria-pressed=\{noticeStatus === status\}/);
  assert.match(abandoned, /aria-label="시도 선택"/);
  assert.match(abandoned, /aria-label="시군구 선택"/);
});
