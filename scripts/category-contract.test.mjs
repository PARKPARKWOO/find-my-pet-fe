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
const lostIndexPagePath = path.resolve(
  scriptsDirectory,
  "../src/app/(route)/lost/page.tsx",
);
const abandonmentIndexPagePath = path.resolve(
  scriptsDirectory,
  "../src/app/(route)/abandonment/page.tsx",
);
const llmsPath = path.resolve(scriptsDirectory, "../public/llms.txt");

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
  assert.match(abandoned, /const \[isLoading, setIsLoading\] = useState\(true\)/);
  assert.match(abandoned, /<Link[\s\S]*?href=\{`\/abandonment\//);
  assert.doesNotMatch(abandoned, /localStorage\.setItem\("petInfo"/);
  assert.match(lost, /const controller = new AbortController\(\)/);
  assert.ok((lost.match(/signal: controller\.signal/g) ?? []).length >= 2);
  assert.match(lost, /if \(controller\.signal\.aborted\) return;/);
  assert.match(lost, /return \(\) => controller\.abort\(\)/);
  assert.match(abandoned, /const controller = new AbortController\(\)/);
  assert.match(abandoned, /signal: controller\.signal/);
  assert.match(abandoned, /if \(controller\.signal\.aborted\) return;/);
  assert.match(abandoned, /return \(\) => controller\.abort\(\)/);
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
