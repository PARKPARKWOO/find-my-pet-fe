import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadTypeScriptModule } from "./test-utils/load-typescript-module.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("backend noticeClosed is the only OPEN/CLOSED signal", () => {
  const { isNoticeClosed } = loadTypeScriptModule(
    path.join(root, "src/lib/abandonment.ts"),
  );

  assert.equal(
    isNoticeClosed({
      noticeClosed: false,
      noticeEdt: "20200101",
      processState: "보호중",
    }),
    false,
  );
  assert.equal(
    isNoticeClosed({
      noticeClosed: false,
      noticeEdt: "20991231",
      processState: "종료(반환)",
    }),
    false,
  );
  assert.equal(
    isNoticeClosed({
      noticeClosed: true,
      noticeEdt: "20991231",
      processState: "보호중",
    }),
    true,
  );
  assert.equal(isNoticeClosed({ noticeEdt: "20200101" }), false);
});

test("IndexNow treats only an explicit false boolean as ongoing", () => {
  const source = read("scripts/indexnow.mjs");
  const ongoingFunction = source.match(
    /function isOngoing\(item\) \{(?<body>[\s\S]*?)\n\}/,
  );

  assert.ok(ongoingFunction?.groups?.body, "isOngoing function must exist");
  assert.match(ongoingFunction.groups.body, /noticeClosed\s*===\s*false/);
  assert.doesNotMatch(
    ongoingFunction.groups.body,
    /isNoticeClosed|processState|noticeEdt/,
  );
});

test("region requests explicitly ask for OPEN notices and retain noticeClosed", () => {
  const source = read("src/lib/region.ts");

  assert.match(source, /noticeStatus(?:=|%3D)OPEN|noticeStatus["']?\s*:\s*["']OPEN["']/);
  assert.match(source, /noticeClosed\??\s*:\s*boolean/);
  assert.match(source, /effectiveNoticeEdt\??\s*:\s*string\s*\|\s*null/);
});

test("explicit null effective end suppresses raw display while a missing key keeps legacy fallback", () => {
  const abandonment = loadTypeScriptModule(
    path.join(root, "src/lib/abandonment.ts"),
  );
  const detailSource = read("src/app/(route)/abandonment/[detail]/page.tsx");

  assert.equal(typeof abandonment.resolveDisplayedNoticeEdt, "function");
  const explicitUnknown = abandonment.resolveDisplayedNoticeEdt({
    effectiveNoticeEdt: null,
    noticeEdt: "20261340",
  });
  assert.equal(explicitUnknown, null);
  assert.equal(abandonment.formatYyyyMmDdKo(explicitUnknown), null);
  assert.equal(abandonment.happenDtToDate(explicitUnknown), null);
  assert.equal(
    abandonment.resolveDisplayedNoticeEdt({ noticeEdt: "20260730" }),
    "20260730",
  );
  assert.equal(
    detailSource.match(
      /displayedNoticeEdt\s*=\s*resolveDisplayedNoticeEdt\(pet\)/g,
    )?.length,
    2,
  );
  assert.match(
    detailSource,
    /noticeEnd\s*=\s*happenDtToDate\(displayedNoticeEdt\)/,
  );
  assert.match(detailSource, /expires:\s*noticeEnd\.toISOString\(\)/);
});

test("notice collectors continue past an empty page only when hasNextPage is true", () => {
  const indexNowSource = read("scripts/indexnow.mjs");
  const sitemapSource = read("src/app/sitemap.ts");
  const indexNowCollector = indexNowSource.match(
    /async function collectAbandonedUrls[\s\S]*?(?=\/\*\* 지역별 공고 페이지)/,
  )?.[0];
  const sitemapCollector = sitemapSource.match(
    /async function fetchAllAbandoned[\s\S]*?(?=async function safeGetAllPosts)/,
  )?.[0];

  assert.ok(indexNowCollector, "IndexNow abandoned collector must exist");
  assert.ok(sitemapCollector, "sitemap abandoned collector must exist");
  assert.doesNotMatch(indexNowCollector, /contents\.length\s*===\s*0[^;{]*(?:break|\{)/);
  assert.match(indexNowCollector, /hasNextPage\s*!==\s*true\)\s*break/);
  assert.doesNotMatch(
    sitemapCollector,
    /contents\.length\s*===\s*0[\s\S]{0,80}(?:stopped\s*=\s*true|break)/,
  );
  assert.match(
    sitemapCollector,
    /hasNextPage\s*!==\s*true\)\s*\{[\s\S]{0,80}stopped\s*=\s*true[\s\S]{0,40}break/,
  );
});

test("closed-notice fallback copy does not claim a displayed future date passed", () => {
  const source = read("src/app/_components/abandonment/ClosedNoticeBanner.tsx");
  const unknownReasonFallback = source.match(
    /\) : \(\s*<>\s*(?<copy>[\s\S]*?)<\/\>\s*\)\s*}\s*<\/p>/,
  );

  assert.ok(unknownReasonFallback?.groups?.copy, "unknown-reason fallback must exist");
  assert.match(unknownReasonFallback.groups.copy, /공고가 종료|더 이상 제공되지 않/);
  assert.match(unknownReasonFallback.groups.copy, /보호소.*확인|확인.*보호소/);
  assert.doesNotMatch(
    unknownReasonFallback.groups.copy,
    /(?:endedOn|\$\{endedOn\})[\s\S]{0,120}(?:끝났|지났|종료됐)|(?:끝났|지났|종료됐)[\s\S]{0,120}(?:endedOn|\$\{endedOn\})/,
  );
});

test("CLOSED and ALL list guidance does not infer that the notice period elapsed", () => {
  const source = read("src/app/_components/main/AbandonmentList.tsx");

  assert.match(source, /NOTICE_STATUSES[^\n]*\["OPEN", "CLOSED", "ALL"\]/);
  assert.match(source, /종료된 공고가 포함될 수/);
  assert.match(source, /보호소.*확인|확인.*보호소/);
  assert.doesNotMatch(source, /공고 ?기간이? 끝난 아이/);
});

test("integrated search marks ended shelter notices with the backend status", () => {
  const source = read("src/app/search/page.tsx");

  assert.match(source, /item\.noticeClosed[\s\S]{0,240}공고 종료/);
});

test("FAQ distinguishes the seven-day notice minimum from ten-day ownership transfer", () => {
  const { FAQ_ENTRIES } = loadTypeScriptModule(
    path.join(root, "src/lib/featuredGuides.ts"),
  );
  const source = FAQ_ENTRIES.map(({ a }) => a).join("\n");

  assert.match(source, /7일|칠일|일주일/);
  assert.match(source, /10일|십일/);
  assert.match(source, /소유권.*(취득|귀속|이전)|(취득|귀속|이전).*소유권/);
  assert.match(source, /10일[\s\S]{0,80}소유자[\s\S]{0,40}알 수 없/);
  assert.doesNotMatch(source, /공고\s*후\s*10일이\s*지나면\s*소유권/);
  assert.doesNotMatch(source, /공고\s*기간이\s*끝난\s*동물부터\s*입양이\s*가능/);
  assert.doesNotMatch(source, /진행중인\s*공고만\s*노출됩니다/);
  assert.match(source, /진행 중인 공고\(OPEN\)[\s\S]{0,40}기본/);
  assert.match(source, /공고 종료\(CLOSED\)[\s\S]{0,80}전체 필터[\s\S]{0,120}안내/);
  assert.match(source, /통합검색[\s\S]{0,80}공고 종료[\s\S]{0,40}뱃지/);
});

test("FAQ page renders its registry without static contract-only copy", () => {
  const source = read("src/app/faq/page.tsx");

  assert.match(source, /import\s*\{\s*FAQ_ENTRIES\s*\}\s*from\s*["']@\/lib\/featuredGuides["']/);
  assert.match(source, /mainEntity:\s*FAQ_ENTRIES\.map/);
  assert.doesNotMatch(source, /Static content-contract compatibility/);
});
