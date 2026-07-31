import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const globalsPath = "src/app/globals.css";
const tailwindPath = "tailwind.config.ts";
const canonicalButtonPath = "src/components/ui/button.tsx";
const legacyButtonPath = "src/app/_components/ui/button.tsx";
const legacyInputPath = "src/app/_components/ui/input.tsx";
const legacyLabelPath = "src/app/_components/ui/label.tsx";
const containerPath = "src/components/layout/Container.tsx";
const pageShellPath = "src/components/layout/PageShell.tsx";
const sectionHeadingPath = "src/components/typography/SectionHeading.tsx";

test("승인된 색을 semantic token으로 제공한다", () => {
  const css = read(globalsPath);

  assert.match(css, /--fmp-canvas:\s*233 230 223;\s*\/\* #E9E6DF \*\//);
  assert.match(css, /--fmp-paper:\s*245 240 232;\s*\/\* #F5F0E8 \*\//);
  assert.match(css, /--fmp-raised:\s*255 253 248;\s*\/\* #FFFDF8 \*\//);
  assert.match(css, /--fmp-ink:\s*32 42 38;\s*\/\* #202A26 \*\//);
  assert.match(css, /--fmp-forest:\s*47 90 73;\s*\/\* #2F5A49 \*\//);
  assert.match(css, /--fmp-clay:\s*214 111 84;\s*\/\* #D66F54 \*\//);
  assert.match(css, /--fmp-wine:\s*112 69 65;\s*\/\* #704541 \*\//);
  assert.match(css, /--fmp-sighting:\s*75 127 163;\s*\/\* #4B7FA3 \*\//);
  assert.match(css, /--fmp-waiting:\s*185 137 59;\s*\/\* #B9893B \*\//);
  for (const token of [
    "text-secondary", "text-muted", "text-inverse", "action-primary",
    "action-secondary", "action-destructive", "action-brand", "state-searching",
    "state-sighting", "state-found", "state-protected", "state-waiting",
    "state-archived", "map-missing-pin", "map-sighting-pin", "map-radius", "map-selected",
  ]) {
    assert.match(css, new RegExp(`--fmp-${token}:`));
  }
  assert.match(css, /--background:\s*37 39% 94%/);
  assert.match(css, /--foreground:\s*156 14% 15%/);
  assert.match(css, /font-family:\s*var\(--font-geist-sans\)/);
  assert.match(css, /:focus-visible\s*\{/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("기존 xs breakpoint와 primitive 호환 경로를 보존한다", () => {
  const tailwind = read(tailwindPath);
  const adapter = read(legacyButtonPath);

  assert.match(tailwind, /['"]xs['"]:\s*['"]480px['"]/);
  assert.match(adapter, /CanonicalButton/);
  assert.match(adapter, /defaultVariants:[\s\S]*?size:\s*["']sm["']/);
  assert.match(adapter, /export\s*\{\s*Button,\s*buttonVariants\s*\}/);
});

test("semantic Tailwind maps와 canonical Button 변형을 제공한다", () => {
  const tailwind = read(tailwindPath);
  const button = read(canonicalButtonPath);

  for (const map of ["surface", "content", "action", "state", "map"]) {
    assert.match(tailwind, new RegExp(`${map}:\\s*\\{`));
  }
  assert.match(tailwind, /maxWidth:\s*\{/);
  assert.match(tailwind, /page:\s*["']80rem["']/);
  assert.match(tailwind, /reading:\s*["']48rem["']/);
  assert.match(tailwind, /raised:\s*["']var\(--fmp-shadow-raised\)["']/);
  assert.match(button, /action:\s*["']bg-forest text-white hover:bg-forest\/90["']/);
  assert.match(button, /signal:\s*["']bg-clay text-white hover:bg-clay\/90["']/);
  assert.match(button, /brand:\s*["']bg-kakao text-\[#191919\] hover:bg-kakao\/90["']/);
});

test("layout과 typography primitive의 선언된 public interface를 제공한다", () => {
  const container = read(containerPath);
  const pageShell = read(pageShellPath);
  const sectionHeading = read(sectionHeadingPath);

  assert.match(container, /export interface ContainerProps/);
  assert.match(container, /size\?:\s*["']page["']\s*\|\s*["']reading["']/);
  assert.match(container, /max-w-page/);
  assert.match(container, /max-w-reading/);
  assert.match(pageShell, /export interface PageShellProps/);
  assert.match(pageShell, /surface\?:\s*["']paper["']\s*\|\s*["']raised["']\s*\|\s*["']transparent["']/);
  assert.match(sectionHeading, /export interface SectionHeadingProps/);
  assert.match(sectionHeading, /title:\s*React\.ReactNode/);
  assert.match(sectionHeading, /eyebrow\?:\s*string/);
});

test("legacy Input과 Label은 canonical primitive를 재수출한다", () => {
  assert.match(read(legacyInputPath), /from\s+["']@\/components\/ui\/input["']/);
  assert.match(read(legacyLabelPath), /from\s+["']@\/components\/ui\/label["']/);
});
