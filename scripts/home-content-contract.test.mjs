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
const readOwnedSource = (relativePath) => {
  const file = path.join(rootDir, relativePath);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
};
const page = readOwnedSource("src/app/page.tsx");
const categoryNav = readOwnedSource(
  "src/app/_components/category/PurposeCategoryNav.tsx",
);
const hero = readOwnedSource("src/app/_components/home/HomeHero.tsx");
const guide = readOwnedSource("src/app/_components/home/SituationGuide.tsx");
const nearby = readOwnedSource("src/app/_components/home/NearbyDiscovery.tsx");
const nearbyMap = readOwnedSource(
  "src/app/_components/home/HomeNearbyMap.client.tsx",
);
const marquee = readOwnedSource("src/app/_components/home/LatestPetMarquee.tsx");
const kakaoScript = readOwnedSource("src/app/_components/KakaoMapScript.tsx");

function assertHomeSnapshotComposition(source) {
  assert.doesNotMatch(source, /^"use client";/);
  assert.doesNotMatch(source, /useRouter|useToast|useIsLoginStore|useState/);
  assert.doesNotMatch(source, /banner\.jpg|무엇을 도와드릴까요/);
  assert.equal((source.match(/getHomeFeedSnapshot\(\)/g) ?? []).length, 1);
  assert.match(source, /const snapshot = await getHomeFeedSnapshot\(\)/);
  assert.match(source, /toMarqueeItems\(snapshot\)/);
  assert.match(source, /toLostSeed\(snapshot\.lost\)/);
  assert.match(source, /toAbandonmentSeed\(snapshot\.abandonment\)/);
  const order = ["<HomeHero", "<SearchBar", "<LatestPetMarquee", "<NearbyDiscovery", "<HomeFeed"];
  let cursor = -1;
  for (const token of order) {
    const next = source.indexOf(token);
    assert.ok(next > cursor, `${token} must retain the approved home order`);
    cursor = next;
  }
}

function assertNearbyConcurrencyContract(source) {
  assert.match(source, /^"use client";/);
  assert.match(source, /import apiClient from "@\/lib\/api"/);
  assert.equal((source.match(/useEffect\(\(\) => \{/g) ?? []).length, 1);
  assert.match(source, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(source, /const handleLookup =/);
  const mountEffect = source.slice(
    source.indexOf("useEffect(() => {"),
    source.indexOf("  }, []);") + "  }, []);".length,
  );
  assert.doesNotMatch(mountEffect, /navigator\.geolocation|getCurrentPosition|handleLookup/);
  assert.ok(source.indexOf("const handleLookup =") < source.indexOf("navigator.geolocation.getCurrentPosition"));
  assert.match(source, /apiClient\.get\("\/posts\/nearby",\s*\{[\s\S]*?params:\s*\{[\s\S]*?lat,[\s\S]*?lng,[\s\S]*?radiusKm,[\s\S]*?pageSize: 20,[\s\S]*?pageOffset: 0,[\s\S]*?signal: controller\.signal/);
  assert.match(source, /lookupSequenceRef\.current \+= 1/);
  assert.match(source, /activeControllerRef\.current\?\.abort\(\)/);
  assert.match(source, /useEffect\(\(\) => \{\s*mountedRef\.current = true;/);
  const staleGuard = /if \(!mountedRef\.current \|\| sequence !== lookupSequenceRef\.current\) return;/;
  assert.match(source, /async \(position\) => \{\s*if \(!mountedRef\.current \|\| sequence !== lookupSequenceRef\.current\) return;/);
  assert.match(source, /await apiClient\.get\("\/posts\/nearby",[\s\S]*?\);\s*if \(!mountedRef\.current \|\| sequence !== lookupSequenceRef\.current\) return;\s*const result = normalizeNearbyResponse/);
  assert.match(source, /\} catch \{\s*if \(!mountedRef\.current \|\| sequence !== lookupSequenceRef\.current\) return;/);
  assert.match(source, /\} finally \{\s*if \(!mountedRef\.current \|\| sequence !== lookupSequenceRef\.current\) return;/);
  assert.match(source, /\(error\) => \{\s*if \(!mountedRef\.current \|\| sequence !== lookupSequenceRef\.current\) return;/);
  assert.ok((source.match(new RegExp(staleGuard.source, "g")) ?? []).length >= 5);
  assert.match(source, /return \(\) => \{[\s\S]*?mountedRef\.current = false;[\s\S]*?lookupSequenceRef\.current \+= 1;[\s\S]*?activeControllerRef\.current\?\.abort\(\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
}

test("home category navigation separates real links from planned non-links", () => {
  assert.match(categoryNav, /HOME_PURPOSE_CATEGORIES/);
  assert.match(categoryNav, /availableCategories\.map/);
  assert.match(categoryNav, /plannedCategories\.map/);
  assert.match(categoryNav, /<Link[\s\S]*?href=\{category\.href\}/);
  const plannedBlock = categoryNav.slice(categoryNav.indexOf("plannedCategories.map"));
  assert.match(plannedBlock, /<li/);
  assert.match(plannedBlock, /준비 중/);
  assert.doesNotMatch(plannedBlock, /<Link|href=/);

  const plannedLinkMutation = plannedBlock.replace("<li", '<Link href={category.href}');
  assert.throws(() => assert.doesNotMatch(plannedLinkMutation, /<Link|href=/));
});

test("home hero owns the exact H1 and all guide registry links remain real", () => {
  assert.equal((hero.match(/<h1\b/g) ?? []).length, 1);
  assert.match(hero, />다시 만나는 길을, 동네와 함께\.<\/h1>/);
  assert.match(hero, /<PurposeCategoryNav/);
  assert.match(hero, /<SituationGuide/);
  assert.equal((guide.match(/<h1\b/g) ?? []).length, 0);
  assert.match(guide, /상황별 반려동물 안내/);
  assert.match(guide, /FEATURED_GUIDES\.map/);
  assert.match(guide, /href=\{item\.href\}/);
  assert.match(guide, /item\.title/);
  assert.match(guide, /item\.description/);
  assert.match(guide, /item\.linkLabel/);
  assert.doesNotMatch(guide, />\s*FAQ\s*</);
});

test("server home uses one snapshot for marquee and both Task 6 seeds", () => {
  assertHomeSnapshotComposition(page);
  const secondSnapshotMutation = page.replace(
    "toMarqueeItems(snapshot)",
    "toMarqueeItems(await getHomeFeedSnapshot())",
  );
  assert.throws(() => assertHomeSnapshotComposition(secondSnapshotMutation));
});

test("nearby lookup is explicit, abortable, stale-safe, and truthful", () => {
  assertNearbyConcurrencyContract(nearbyMap);
  assert.match(nearbyMap, /내 위치로 가까운 소식 보기/);
  assert.match(nearbyMap, /1, 3, 5, 10/);
  assert.match(nearbyMap, /useState<RadiusKm>\(3\)/);
  assert.match(nearbyMap, /const handleRadiusChange =/);
  assert.match(nearbyMap, /handleRadiusChange[\s\S]*?lookupSequenceRef\.current \+= 1;[\s\S]*?activeControllerRef\.current\?\.abort\(\);[\s\S]*?setItems\(\[\]\);[\s\S]*?setCoordinate\(null\);/);
  assert.match(nearbyMap, /disabled=\{busy\}[\s\S]*?onChange=\{\(\) => handleRadiusChange\(radius\)\}/);
  assert.match(nearbyMap, /표시 가능한 공개 위치 소식이 없어요/);
  assert.match(nearbyMap, /좌표.*이번 조회.*전송/);
  assert.match(nearbyMap, /브라우저 저장소에 저장하지 않/);
  assert.match(nearbyMap, /보관 여부/);
  assert.match(nearbyMap, /<ul/);
  assert.match(nearbyMap, /href=\{item\.href\}/);
  assert.match(nearbyMap, /bg-map-missing/);
  assert.match(nearbyMap, /bg-map-sighting/);

  const geolocationEffectMutation = nearbyMap.replace(
    "  useEffect(() => {\n",
    "  useEffect(() => {\n    navigator.geolocation.getCurrentPosition(() => {}, () => {});\n",
  );
  assert.throws(() => assertNearbyConcurrencyContract(geolocationEffectMutation));
  const handlerEffectMutation = nearbyMap.replace(
    "  useEffect(() => {\n",
    "  useEffect(() => {\n    handleLookup();\n",
  );
  assert.throws(() => assertNearbyConcurrencyContract(handlerEffectMutation));
  const secondHandlerEffectMutation = nearbyMap.replace(
    "  const busy =",
    "  useEffect(() => {\n    handleLookup();\n  }, []);\n\n  const busy =",
  );
  assert.throws(() => assertNearbyConcurrencyContract(secondHandlerEffectMutation));
  const successStaleMutation = nearbyMap.replace(
    "          if (!mountedRef.current || sequence !== lookupSequenceRef.current) return;\n          const result = normalizeNearbyResponse",
    "          const result = normalizeNearbyResponse",
  );
  assert.throws(() => assertNearbyConcurrencyContract(successStaleMutation));
});

test("Kakao canvas is readiness-gated while the semantic result list stays available", () => {
  assert.match(kakaoScript, /export type KakaoMapStatus = "loading" \| "ready" \| "unavailable" \| "failed"/);
  assert.match(kakaoScript, /export function useKakaoMapStatus/);
  assert.match(kakaoScript, /k\.maps\.load\(\(\) =>/);
  assert.match(kakaoScript, /onError=/);
  assert.match(nearbyMap, /Map as KakaoMap, Circle, CustomOverlayMap/);
  assert.match(nearbyMap, /mapStatus === "ready"/);
  assert.match(nearbyMap, /<KakaoMap/);
  assert.match(nearbyMap, /\{items\.length > 0 \? \(\s*<ul/);
  const hiddenListMutation = nearbyMap.replace(
    "{items.length > 0 ? (\n          <ul",
    '{mapStatus === "ready" && items.length > 0 ? (\n          <ul',
  );
  assert.doesNotMatch(hiddenListMutation, /\{items\.length > 0 \? \(\s*<ul/);
  assert.throws(() => assert.match(hiddenListMutation, /\{items\.length > 0 \? \(\s*<ul/));
});

test("nearby section exposes a real regional route and a non-clickable future status", () => {
  assert.match(nearby, /가까운 곳부터 함께 살펴봐요/);
  assert.match(nearby, /href="\/abandonment\/region"/);
  assert.match(nearby, /수색그룹과 팀 지도 · 준비 중/);
  const futureStatus = nearby.slice(nearby.indexOf("수색그룹과 팀 지도 · 준비 중") - 250);
  assert.doesNotMatch(futureStatus, /href=.*수색그룹|<Link[^>]*>[^<]*수색그룹/);
});

test("latest marquee renders only actual items and valid absolute dates", () => {
  assert.match(marquee, /if \(items\.length === 0\) return null/);
  assert.match(marquee, /items\.map/);
  assert.match(marquee, /formatMarqueeDate/);
  assert.match(marquee, /formattedDate && \(/);
  assert.match(marquee, /<time dateTime=\{item\.occurredAt/);
  assert.match(marquee, /overflow-x-auto/);
  assert.doesNotMatch(marquee, /next\/image|<Image|Date\.now|setInterval|clone/);
});

test("nearby map keys preserve duplicate public records without collisions", () => {
  assert.match(nearbyMap, /items\.map\(\(item, index\) =>/);
  assert.ok((nearbyMap.match(/key=\{`\$\{item\.id\}:\$\{index\}`\}/g) ?? []).length >= 2);
});

function assertListsStayMounted(source) {
  assert.match(
    source,
    /<section hidden=\{!showLost\} className="w-full">[\s\S]*?<LostList initialPage=\{lostSeed\} \/>[\s\S]*?<\/section>/,
  );
  assert.match(
    source,
    /<section hidden=\{!showAbandonment\} className="w-full">[\s\S]*?<Suspense[\s\S]*?<AbandonmentList initialPage=\{abandonmentSeed\} \/>[\s\S]*?<\/Suspense>[\s\S]*?<\/section>/,
  );
  assert.doesNotMatch(source, /\{showLost && \(\s*<section/);
  assert.doesNotMatch(source, /\{showAbandonment && \(\s*<section/);
  assert.equal((source.match(/<LostList initialPage=\{lostSeed\} \/>/g) ?? []).length, 1);
  assert.equal(
    (source.match(/<AbandonmentList initialPage=\{abandonmentSeed\} \/>/g) ?? []).length,
    1,
  );
}

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

  assertListsStayMounted(homeFeed);

  const missingLostSeed = homeFeed.replace("<LostList initialPage={lostSeed} />", "<LostList />");
  assert.doesNotMatch(missingLostSeed, /<LostList initialPage=\{lostSeed\} \/>/);

  const remountOnToggleMutation = homeFeed.replace(
    '<section hidden={!showLost} className="w-full">',
    '{showLost && (\n        <section className="w-full">',
  );
  assert.throws(() => assertListsStayMounted(remountOnToggleMutation));

  const abandonmentRemountMutation = homeFeed.replace(
    '<section hidden={!showAbandonment} className="w-full">',
    '{showAbandonment && (\n        <section className="w-full">',
  );
  assert.throws(() => assertListsStayMounted(abandonmentRemountMutation));
});
