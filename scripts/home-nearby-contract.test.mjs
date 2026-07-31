import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { loadTypeScriptModule } from "./test-utils/load-typescript-module.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nearbyPath = path.join(rootDir, "src/lib/homeNearby.ts");
const homeFeedPath = path.join(rootDir, "src/lib/homeFeed.ts");

function loadNearbyModule() {
  assert.equal(fs.existsSync(nearbyPath), true, "homeNearby contract module must exist");
  const output = ts.transpileModule(fs.readFileSync(nearbyPath, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  const homeFeed = loadTypeScriptModule(homeFeedPath);
  const require = (specifier) => {
    if (specifier === "./homeFeed") return homeFeed;
    throw new Error(`Unexpected dependency: ${specifier}`);
  };
  new Function("module", "exports", "require", output)(module, module.exports, require);
  return module.exports;
}

function page(contents, overrides = {}) {
  return {
    success: true,
    data: { contents, totalCount: contents.length, hasNextPage: false, ...overrides },
  };
}

const valid = {
  id: "pet/한 칸",
  title: "  흰 강아지를 찾습니다  ",
  place: "  마포구  ",
  missingAnimalStatus: "SEARCHING",
  lat: 37.5,
  lng: 126.9,
  distanceKm: 1.25,
};

test("nearby parser requires the strict public page envelope", () => {
  const { normalizeNearbyResponse } = loadNearbyModule();
  for (const malformed of [
    null,
    1,
    "body",
    [],
    {},
    { success: false, data: { contents: [], totalCount: 0, hasNextPage: false } },
    { success: true, data: null },
    { success: true, data: { contents: [], totalCount: "0", hasNextPage: false } },
    { success: true, data: { contents: [], totalCount: 0, hasNextPage: "false" } },
  ]) {
    assert.throws(() => normalizeNearbyResponse(malformed), /Invalid public page response/);
  }
});

test("nearby parser trims public fields, encodes IDs, and preserves eligible order", () => {
  const { normalizeNearbyResponse } = loadNearbyModule();
  const second = {
    ...valid,
    id: "second",
    title: "목격 소식",
    place: "   ",
    missingAnimalStatus: "SEEN",
    distanceKm: 0,
  };

  assert.deepEqual(normalizeNearbyResponse(page([valid, second], { totalCount: 999 })), {
    sourceItemCount: 2,
    items: [
      {
        id: "pet/한 칸",
        href: "/lost/pet%2F%ED%95%9C%20%EC%B9%B8",
        title: "흰 강아지를 찾습니다",
        place: "마포구",
        missingAnimalStatus: "SEARCHING",
        lat: 37.5,
        lng: 126.9,
        distanceKm: 1.25,
      },
      {
        id: "second",
        href: "/lost/second",
        title: "목격 소식",
        place: null,
        missingAnimalStatus: "SEEN",
        lat: 37.5,
        lng: 126.9,
        distanceKm: 0,
      },
    ],
  });
});

test("nearby parser distinguishes an empty source from a non-displayable source", () => {
  const { normalizeNearbyResponse } = loadNearbyModule();
  assert.deepEqual(normalizeNearbyResponse(page([])), { sourceItemCount: 0, items: [] });
  assert.deepEqual(
    normalizeNearbyResponse(
      page([
        null,
        7,
        "item",
        { ...valid, id: " " },
        { ...valid, title: " " },
        { ...valid, missingAnimalStatus: "FOUND" },
        { ...valid, missingAnimalStatus: "UNKNOWN" },
        { ...valid, missingAnimalStatus: undefined },
      ]),
    ),
    { sourceItemCount: 8, items: [] },
  );
});

test("nearby parser excludes IDs that cannot be safely URL-encoded", () => {
  const { normalizeNearbyResponse } = loadNearbyModule();
  assert.deepEqual(
    normalizeNearbyResponse(page([{ ...valid, id: "\uD800" }, { ...valid, id: "safe" }])),
    {
      sourceItemCount: 2,
      items: [
        {
          id: "safe",
          href: "/lost/safe",
          title: "흰 강아지를 찾습니다",
          place: "마포구",
          missingAnimalStatus: "SEARCHING",
          lat: 37.5,
          lng: 126.9,
          distanceKm: 1.25,
        },
      ],
    },
  );
});

test("nearby parser accepts coordinate boundaries and rejects unsafe numeric fields", () => {
  const { normalizeNearbyResponse } = loadNearbyModule();
  const boundaries = [
    { ...valid, id: "north-west", lat: 90, lng: -180, distanceKm: 0 },
    { ...valid, id: "south-east", lat: -90, lng: 180, distanceKm: 10 },
  ];
  assert.equal(normalizeNearbyResponse(page(boundaries)).items.length, 2);

  const invalidNumbers = [
    { ...valid, lat: 90.0001 },
    { ...valid, lat: -90.0001 },
    { ...valid, lng: 180.0001 },
    { ...valid, lng: -180.0001 },
    { ...valid, lat: Number.NaN },
    { ...valid, lng: Number.POSITIVE_INFINITY },
    { ...valid, distanceKm: Number.NEGATIVE_INFINITY },
    { ...valid, distanceKm: -0.01 },
  ];
  assert.deepEqual(normalizeNearbyResponse(page(invalidNumbers)), {
    sourceItemCount: invalidNumbers.length,
    items: [],
  });
});

test("geolocation errors preserve permission denial separately", () => {
  const { classifyGeolocationError } = loadNearbyModule();
  assert.equal(classifyGeolocationError(1), "permission-denied");
  assert.equal(classifyGeolocationError(2), "position-unavailable-or-timeout");
  assert.equal(classifyGeolocationError(3), "position-unavailable-or-timeout");
  assert.equal(classifyGeolocationError(999), "position-unavailable-or-timeout");
});
