import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadTypeScriptModule } from "./test-utils/load-typescript-module.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const content = loadTypeScriptModule(path.join(rootDir, "src/lib/featuredGuides.ts"));
const searchBar = fs.readFileSync(
  path.join(rootDir, "src/app/_components/layout/SearchBar.tsx"),
  "utf8",
);
const homeFeed = fs.readFileSync(
  path.join(rootDir, "src/app/_components/home/HomeFeed.client.tsx"),
  "utf8",
);

test("home guidance links retain their stable destinations", () => {
  assert.deepEqual(
    content.FEATURED_GUIDES.map(({ id, href }) => ({ id, href })),
    [
      { id: "lost-first-steps", href: "/guide#수색" },
      { id: "shelter-return", href: "/faq#shelter-return" },
      { id: "adoption-process", href: "/faq#adoption-process" },
      { id: "missing-prevention", href: "/posts/dog-escape-while-walking" },
    ],
  );
});

test("FAQ entries retain their exact ordered stable guide anchors", () => {
  assert.deepEqual(
    content.FAQ_ENTRIES.map(({ id }) => id),
    [
      "shelter-check",
      "notice-period",
      "shelter-return",
      "animal-registration",
      "found-animal-report",
      "after-notice",
      "adoption-process",
      "missing-report",
      "data-source",
      "search-radius",
    ],
  );
  assert.equal(new Set(content.FAQ_ENTRIES.map(({ id }) => id)).size, content.FAQ_ENTRIES.length);
});

test("both site search variants remain accessible native GET forms", () => {
  const forms = [...searchBar.matchAll(/<form\b[\s\S]*?<\/form>/g)].map(([form]) => form);

  assert.equal(forms.length, 2, "hero and compact search forms must both exist");

  for (const form of forms) {
    assert.match(form, /action="\/search"/);
    assert.match(form, /method="get"/);
    assert.match(form, /name="q"/);
    assert.match(form, /defaultValue=\{defaultQ\}/);
    assert.match(form, /required/);
    assert.match(form, /<label[\s\S]*?실종 또는 보호 동물 검색[\s\S]*?<\/label>/);
  }

  const [heroForm, compactForm] = forms;
  assert.match(heroForm, /placeholder="실종 \/ 보호중 동물 검색 — 지역, 품종, 특징 등"/);
  assert.match(compactForm, /placeholder="실종 \/ 보호중 검색"/);
  assert.match(compactForm, /className="flex items-center"/);
  assert.match(compactForm, /w-44 lg:w-64/);
  assert.doesNotMatch(compactForm, /w-full/);
  assert.doesNotMatch(compactForm, /<button\b/);

  assert.doesNotMatch(searchBar, /"use client"/);
  assert.doesNotMatch(searchBar, /useRouter/);
  assert.doesNotMatch(searchBar, /preventDefault/);
  assert.doesNotMatch(searchBar, /router\.push/);
});

test("홈 피드 client island는 서버 seed와 기존 상호작용을 보존한다", () => {
  assert.match(homeFeed, /^"use client";/);
  assert.match(homeFeed, /export interface HomeFeedProps\s*\{[\s\S]*?lostSeed\?: HomeListSeed<LostPetSummary>/);
  assert.match(homeFeed, /abandonmentSeed\?: HomeListSeed<AbandonedAnimalSummary>/);
  assert.match(homeFeed, /data-native-scroll/);
  assert.match(homeFeed, /<LostList initialPage=\{lostSeed\} \/>/);
  assert.match(homeFeed, /<AbandonmentList initialPage=\{abandonmentSeed\} \/>/);
  assert.match(homeFeed, /<Suspense fallback=\{<div className="h-\[400px\]" \/>\}>/);
  assert.match(homeFeed, />\s*전체\s*</);
  assert.match(homeFeed, />\s*집을 잃었어요\s*</);
  assert.match(homeFeed, />\s*보호소에서 가족을 기다려요\s*</);
  assert.match(homeFeed, /useIsLoginStore/);
  assert.match(homeFeed, /router\.push\('\/register'\)/);
  assert.match(homeFeed, /로그인이 필요합니다/);
  assert.doesNotMatch(homeFeed, /homeFeed\.server/);
  assert.doesNotMatch(homeFeed, /SearchBar/);
  assert.doesNotMatch(homeFeed, /PurposeCategoryNav/);

  const missingLostSeed = homeFeed.replace("<LostList initialPage={lostSeed} />", "<LostList />");
  assert.doesNotMatch(missingLostSeed, /<LostList initialPage=\{lostSeed\} \/>/);
});
