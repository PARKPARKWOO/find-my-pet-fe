import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadTypeScriptModule } from "./test-utils/load-typescript-module.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const homeFeedPath = path.join(root, "src/lib/homeFeed.ts");
const serverPath = path.join(root, "src/lib/homeFeed.server.ts");

const homeFeed = () => loadTypeScriptModule(homeFeedPath);

const page = (contents, totalCount = contents.length, hasNextPage = false) => ({
  contents,
  totalCount,
  hasNextPage,
});

const lost = (overrides = {}) => ({
  id: "lost-1",
  author: "author",
  title: "Searching pet",
  description: "description",
  gratuity: 0,
  place: "Seoul",
  time: "2026-02-28T10:00:00",
  thumbnail: "https://images.example/lost.jpg",
  missingAnimalStatus: "SEARCHING",
  animalType: "DOG",
  breedId: null,
  ...overrides,
});

const abandoned = (overrides = {}) => ({
  desertionNo: "abandoned-1",
  filename: null,
  popfile: "https://images.example/abandoned.jpg",
  kindCd: "[DOG] Maltese",
  sexCd: null,
  age: null,
  weight: null,
  specialMark: null,
  happenPlace: "Busan",
  happenDt: "20260228",
  careNm: null,
  careTel: null,
  careAddr: null,
  processState: "보호중",
  noticeNo: null,
  noticeSdt: null,
  noticeEdt: null,
  effectiveNoticeEdt: null,
  animalType: "DOG",
  orgNm: null,
  noticeClosed: false,
  noticeClosedAt: null,
  ...overrides,
});

const snapshot = (lostContents = [], abandonmentContents = []) => ({
  lost: { status: "success", data: page(lostContents) },
  abandonment: { status: "success", data: page(abandonmentContents) },
});

test("normalizes eligible records, filters first, and interleaves endpoint order", () => {
  const { toMarqueeItems } = homeFeed();
  const result = toMarqueeItems(
    snapshot(
      [
        lost({ id: " lost/one ", title: "  Lost one  ", missingAnimalStatus: "SEARCHING" }),
        lost({ id: "found", missingAnimalStatus: "FOUND" }),
        lost({ id: "seen", title: " Seen one ", missingAnimalStatus: "SEEN" }),
      ],
      [
        abandoned({ desertionNo: " closed ", noticeClosed: true }),
        abandoned({ desertionNo: " shelter/two ", kindCd: "  [CAT] Korean  " }),
        abandoned({ desertionNo: "shelter-three" }),
      ],
    ),
  );

  assert.deepEqual(result, [
    {
      key: "lost:lost/one",
      kind: "SEARCHING",
      href: "/lost/lost%2Fone",
      title: "Lost one",
      place: "Seoul",
      occurredAt: "2026-02-28T10:00:00",
      dateFormat: "iso",
      thumbnail: "https://images.example/lost.jpg",
    },
    {
      key: "abandoned:shelter/two",
      kind: "PROTECTED",
      href: "/abandonment/shelter%2Ftwo",
      title: "[CAT] Korean",
      place: "Busan",
      occurredAt: "20260228",
      dateFormat: "yyyymmdd",
      thumbnail: "https://images.example/abandoned.jpg",
    },
    {
      key: "lost:seen",
      kind: "SEEN",
      href: "/lost/seen",
      title: "Seen one",
      place: "Seoul",
      occurredAt: "2026-02-28T10:00:00",
      dateFormat: "iso",
      thumbnail: "https://images.example/lost.jpg",
    },
    {
      key: "abandoned:shelter-three",
      kind: "PROTECTED",
      href: "/abandonment/shelter-three",
      title: "[DOG] Maltese",
      place: "Busan",
      occurredAt: "20260228",
      dateFormat: "yyyymmdd",
      thumbnail: "https://images.example/abandoned.jpg",
    },
  ]);
});

test("keeps independently successful sources and handles empty, failed, and bounded feeds", () => {
  const { toMarqueeItems } = homeFeed();
  const protectedSource = { status: "success", data: page([abandoned()]) };

  assert.deepEqual(
    toMarqueeItems({ lost: { status: "error" }, abandonment: protectedSource }),
    [
      {
        key: "abandoned:abandoned-1",
        kind: "PROTECTED",
        href: "/abandonment/abandoned-1",
        title: "[DOG] Maltese",
        place: "Busan",
        occurredAt: "20260228",
        dateFormat: "yyyymmdd",
        thumbnail: "https://images.example/abandoned.jpg",
      },
    ],
  );
  assert.deepEqual(
    toMarqueeItems({ lost: { status: "error" }, abandonment: { status: "error" } }),
    [],
  );
  assert.deepEqual(toMarqueeItems(snapshot()), []);
  assert.deepEqual(toMarqueeItems(snapshot([lost()], [abandoned()]), 0), []);
  assert.deepEqual(toMarqueeItems(snapshot([lost()], [abandoned()]), -1), []);
  assert.deepEqual(toMarqueeItems(snapshot([lost()], [abandoned()]), Number.NaN), []);
  assert.deepEqual(toMarqueeItems(snapshot([lost(), lost({ id: "two" })], [abandoned()]), 2.8), [
    {
      key: "lost:lost-1",
      kind: "SEARCHING",
      href: "/lost/lost-1",
      title: "Searching pet",
      place: "Seoul",
      occurredAt: "2026-02-28T10:00:00",
      dateFormat: "iso",
      thumbnail: "https://images.example/lost.jpg",
    },
    {
      key: "abandoned:abandoned-1",
      kind: "PROTECTED",
      href: "/abandonment/abandoned-1",
      title: "[DOG] Maltese",
      place: "Busan",
      occurredAt: "20260228",
      dateFormat: "yyyymmdd",
      thumbnail: "https://images.example/abandoned.jpg",
    },
  ]);
});

test("rejects unknown wire values and treats only noticeClosed true as closed", () => {
  const { toMarqueeItems } = homeFeed();
  const result = toMarqueeItems(
    snapshot(
      [
        null,
        lost({ id: "unknown", missingAnimalStatus: "PENDING" }),
        lost({ id: "missing", missingAnimalStatus: undefined }),
        lost({ id: "blank", title: "   " }),
      ],
      [
        null,
        abandoned({ desertionNo: "still-open", processState: "종료(반환)", noticeClosed: false }),
        abandoned({ desertionNo: "closed", processState: "보호중", noticeClosed: true }),
        abandoned({ desertionNo: " ", kindCd: "[DOG] Poodle" }),
        abandoned({ desertionNo: "missing-kind", kindCd: null }),
      ],
    ),
  );

  assert.deepEqual(result.map(({ key }) => key), ["abandoned:still-open"]);
});

test("normalizes nullable and blank values without inventing fallbacks or colliding keys", () => {
  const { toMarqueeItems } = homeFeed();
  const result = toMarqueeItems(
    snapshot(
      [
        lost({
          id: "same",
          title: "  Pet  ",
          place: " ",
          time: " ",
          thumbnail: " ",
        }),
      ],
      [
        abandoned({
          desertionNo: "same",
          kindCd: "  Shelter pet  ",
          happenPlace: " ",
          happenDt: " ",
          popfile: " ",
        }),
      ],
    ),
  );

  assert.deepEqual(result, [
    {
      key: "lost:same",
      kind: "SEARCHING",
      href: "/lost/same",
      title: "Pet",
      place: null,
      occurredAt: null,
      dateFormat: "iso",
      thumbnail: null,
    },
    {
      key: "abandoned:same",
      kind: "PROTECTED",
      href: "/abandonment/same",
      title: "Shelter pet",
      place: null,
      occurredAt: null,
      dateFormat: "yyyymmdd",
      thumbnail: null,
    },
  ]);
});

test("formats strict local calendar dates without timezone parsing", () => {
  const { formatMarqueeDate } = homeFeed();

  assert.equal(formatMarqueeDate("2024-02-29", "iso"), "2024.02.29");
  assert.equal(formatMarqueeDate("2026-02-28T10:00:00", "iso"), "2026.02.28");
  assert.equal(formatMarqueeDate("2026-02-28T10:00:00+09:00", "iso"), "2026.02.28");
  assert.equal(formatMarqueeDate("20260228", "yyyymmdd"), "2026.02.28");
  assert.equal(formatMarqueeDate("2026-02-30", "iso"), null);
  assert.equal(formatMarqueeDate("20261301", "yyyymmdd"), null);
  assert.equal(formatMarqueeDate("2026-2-08", "iso"), null);
  assert.equal(formatMarqueeDate("202602281", "yyyymmdd"), null);
});

test("uses exact deterministic request keys and only seeds successful default sources", () => {
  const {
    HOME_ABANDONMENT_REQUEST_KEY,
    HOME_LOST_REQUEST_KEY,
    getAbandonmentRequestKey,
    getLostRequestKey,
    toAbandonmentSeed,
    toLostSeed,
  } = homeFeed();
  const lostData = page([lost()]);
  const abandonmentData = page([abandoned()]);

  assert.equal(HOME_LOST_REQUEST_KEY, "lost:standard:page=1:size=5");
  assert.equal(
    HOME_ABANDONMENT_REQUEST_KEY,
    "abandonment:status=OPEN:type=ALL:sido=:sigungu=:page=1:size=20",
  );
  assert.equal(
    getLostRequestKey({ currentPage: 2, pageSize: 9, nearby: { enabled: false } }),
    "lost:standard:page=2:size=9",
  );
  assert.equal(
    getLostRequestKey({
      currentPage: 2,
      pageSize: 9,
      nearby: { enabled: true, lat: 37.5, lng: 127.1, radiusKm: 3 },
    }),
    "lost:nearby:lat=37.5:lng=127.1:radius=3:page=2:size=9",
  );
  assert.equal(
    getAbandonmentRequestKey({
      noticeStatus: "CLOSED",
      animalType: "CAT",
      uprCd: "11",
      orgCd: "680",
      currentPage: 3,
      pageSize: 12,
    }),
    "abandonment:status=CLOSED:type=CAT:sido=11:sigungu=680:page=3:size=12",
  );
  assert.deepEqual(toLostSeed({ status: "success", data: lostData }), {
    requestKey: HOME_LOST_REQUEST_KEY,
    data: lostData,
  });
  assert.deepEqual(toAbandonmentSeed({ status: "success", data: abandonmentData }), {
    requestKey: HOME_ABANDONMENT_REQUEST_KEY,
    data: abandonmentData,
  });
  assert.equal(toLostSeed({ status: "error" }), undefined);
  assert.equal(toAbandonmentSeed({ status: "error" }), undefined);
});

test("accepts only strict successful pagination envelopes", () => {
  const { parsePagePayload } = homeFeed();
  const valid = { success: true, data: page([lost()], 9, true) };

  assert.deepEqual(parsePagePayload(valid), valid.data);
  assert.deepEqual(parsePagePayload({ success: true, data: page([], 2, false) }), page([], 2, false));
  for (const invalid of [
    null,
    [],
    { success: false, data: page([]) },
    { success: true },
    { success: true, data: null },
    { success: true, data: { ...page([]), contents: "not-array" } },
    { success: true, data: { ...page([]), totalCount: "0" } },
    { success: true, data: { ...page([]), totalCount: Number.NaN } },
    { success: true, data: { ...page([]), totalCount: -1 } },
    { success: true, data: { ...page([]), totalCount: 1.5 } },
    { success: true, data: { ...page([]), hasNextPage: "false" } },
  ]) {
    assert.throws(() => parsePagePayload(invalid));
  }
});

test("server fetch layer has a public cache-only contract with isolated failures", () => {
  const source = fs.readFileSync(serverPath, "utf8");

  assert.match(source, /^import\s+["']server-only["'];/);
  assert.match(source, /import\s*\{\s*BASE_URL\s*\}\s*from\s*["']@\/app\/constant\/api["']/);
  assert.match(source, /\$\{BASE_URL\}\/posts\?pageSize=5&pageOffset=0&orderBy=CREATED_AT_DESC/);
  assert.match(source, /\$\{BASE_URL\}\/abandoned-animals\?pageNo=1&numOfRows=20&noticeStatus=OPEN/);
  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /process\.env\.FMP_E2E\s*===\s*["']1["']\s*\?\s*\{\s*cache:\s*["']no-store["']\s*\}/);
  assert.match(source, /fetchPublicPage<LostPetSummary>[\s\S]*?\n\s*30,/);
  assert.match(source, /fetchPublicPage<AbandonedAnimalSummary>[\s\S]*?\n\s*1800,/);
  assert.match(source, /parsePagePayload/);
  assert.doesNotMatch(source, /apiClient|cookies\s*\(|Authorization|console\.(?:log|error|warn)/);
});
