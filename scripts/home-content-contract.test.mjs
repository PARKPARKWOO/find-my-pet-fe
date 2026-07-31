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

test("FAQ entries have unique stable guide anchors", () => {
  assert.equal(new Set(content.FAQ_ENTRIES.map(({ id }) => id)).size, content.FAQ_ENTRIES.length);
  assert.ok(content.FAQ_ENTRIES.some(({ id }) => id === "shelter-return"));
  assert.ok(content.FAQ_ENTRIES.some(({ id }) => id === "adoption-process"));
});

test("site search remains a native GET form", () => {
  assert.match(searchBar, /action="\/search"/);
  assert.match(searchBar, /method="get"/);
  assert.match(searchBar, /name="q"/);
  assert.doesNotMatch(searchBar, /preventDefault/);
  assert.doesNotMatch(searchBar, /router\.push/);
});
