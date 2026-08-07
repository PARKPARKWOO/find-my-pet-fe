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
const layoutPath = "src/app/layout.tsx";
const navigationPath = "src/app/_components/layout/Navigation.tsx";
const footerPath = "src/app/_components/layout/Footer.tsx";
const siteNavigationPath = "src/lib/siteNavigation.ts";

const assertMobileNavigationContract = (navigation) => {
  assert.match(
    navigation,
    /<nav(?=[^>]*\bid="mobile-navigation")(?=[^>]*\baria-label="모바일 탐색")[^>]*>/,
  );

  const mappedBlock = navigation.match(
    /\{MOBILE_NAVIGATION\.map\(\(item\) => \(([\s\S]*?)\)\)\}/,
  )?.[1];
  assert.ok(mappedBlock, "MOBILE_NAVIGATION.map block must exist");
  assert.match(
    mappedBlock,
    /<Link(?=[^>]*\bhref=\{item\.href\})(?=[^>]*\bonClick=\{closeMenu\})[^>]*>/,
  );
};

test("승인된 색을 semantic token으로 제공한다", () => {
  const css = read(globalsPath);

  // 2026-08-07 밝은 캔온 리뉴얼 — 흰 바탕 + 웜 그린. 이름은 유지, 값은 새 시스템.
  assert.match(css, /--fmp-canvas:\s*247 247 245;\s*\/\* #F7F7F5/);
  assert.match(css, /--fmp-paper:\s*255 255 255;\s*\/\* #FFFFFF/);
  assert.match(css, /--fmp-raised:\s*255 255 255;\s*\/\* #FFFFFF/);
  assert.match(css, /--fmp-ink:\s*26 28 26;\s*\/\* #1A1C1A/);
  assert.match(css, /--fmp-forest:\s*13 131 72;\s*\/\* #0D8348/);
  assert.match(css, /--fmp-clay:\s*229 72 77;\s*\/\* #E5484D/);
  assert.match(css, /--fmp-wine:\s*176 82 34;\s*\/\* #B05222/);
  assert.match(css, /--fmp-sighting:\s*37 99 191;\s*\/\* #2563BF/);
  assert.match(css, /--fmp-waiting:\s*154 93 0;\s*\/\* #9A5D00/);
  assert.match(css, /--fmp-kakao:\s*254 229 0;/);
  for (const token of [
    "text-secondary", "text-muted", "text-inverse", "action-primary",
    "action-secondary", "action-destructive", "action-brand", "state-searching",
    "state-sighting", "state-found", "state-protected", "state-waiting",
    "state-archived", "map-missing-pin", "map-sighting-pin", "map-radius", "map-selected",
  ]) {
    assert.match(css, new RegExp(`--fmp-${token}:`));
  }
  assert.match(css, /--background:\s*0 0% 100%/);
  assert.match(css, /--foreground:\s*120 4% 11%/);
  assert.match(css, /font-family:\s*var\(--font-pretendard\)/);
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

test("legacy Button은 생략된 크기를 sm으로 정규화해 양쪽 variant 경계에 전달한다", () => {
  const adapter = read(legacyButtonPath);

  assert.match(adapter, /const resolvedSize = size \?\? ["']sm["']/);
  assert.match(adapter, /<CanonicalButton[\s\S]*?size=\{resolvedSize\}/);
  assert.match(adapter, /buttonVariants\(\{\s*variant,\s*size:\s*resolvedSize\s*\}\)/);
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
  assert.match(button, /action:\s*["']bg-action-primary text-content-inverse hover:bg-forest-strong["']/);
  assert.match(button, /signal:\s*["']bg-clay text-white hover:bg-clay\/90["']/);
  assert.match(button, /brand:\s*["']bg-kakao text-\[#191919\] hover:brightness-95["']/);
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

test("전역 셸은 접근 가능한 64px 탐색, 건너뛰기 링크, 안전한 랜드마크를 제공한다", () => {
  const layout = read(layoutPath);
  const navigation = read(navigationPath);
  const siteNavigation = read(siteNavigationPath);

  assert.match(navigation, /<Link[^>]+href="\/"/);
  assert.doesNotMatch(navigation, /<div[^>]+onClick=\{\(\) => router\.push\("\/"\)\}/);
  assert.doesNotMatch(navigation, /<Button[^>]*>\s*<Link/);
  assert.match(navigation, /<nav[^>]+className="[^"]*\bflex\b[^"]*\bh-16\b[^"]*"/);
  assert.doesNotMatch(navigation, /focus-visible:outline-none/);
  assert.match(
    navigation,
    /<button(?=[^>]*className="[^"]*\bh-11\b[^"]*\bmin-w-11\b[^"]*")(?=[^>]*aria-expanded=\{isMenuOpen\})(?=[^>]*aria-controls="mobile-navigation")[^>]*>/,
  );
  assert.match(navigation, /NotificationBell/);
  assert.match(navigation, /requestLogout/);
  assert.match(navigation, /소식 등록/);
  assert.match(navigation, /상황별 반려동물 안내/);
  assert.match(navigation, /href: "\/faq"/);
  assert.match(navigation, /href="\/register" onClick=\{closeMenu\}/);
  assertMobileNavigationContract(navigation);
  assert.match(navigation, /if \(!isLogin\) return <KakaoLoginDialog>\{button\}<\/KakaoLoginDialog>;/);
  assert.match(navigation, /import \{ Popover, PopoverContent, PopoverTrigger \} from "@\/components\/ui\/popover";/);
  assert.doesNotMatch(navigation, /from "@radix-ui\/react-popover"/);
  for (const [label, href] of [
    ["함께 찾기", "/lost"],
    ["보호 동물", "/abandonment"],
    ["보호소·입양", "/abandonment/region"],
    ["이용 안내", "/guide"],
  ]) {
    assert.match(siteNavigation, new RegExp(`\\{ label: "${label}", href: "${href}" \\}`));
  }
  assert.match(layout, /href="#main-content"/);
  assert.match(layout, /id="main-content"/);
  for (const component of [
    "GoogleAnalytics", "AdSenseScript", "AdFitScript", "KakaoMapScript", "AuthQueryCapture", "Toaster",
  ]) {
    assert.match(layout, new RegExp(`<${component}(?:\\s|\\/|>)`));
  }
  assert.doesNotMatch(layout, /<main[\s>]/);
  assert.doesNotMatch(layout, /from ["']lenis["']/);
  assert.doesNotMatch(layout, /from ["']gsap["']/);
  assert.match(layout, /max-w-page/);
});

test("모바일 탐색 landmark 계약은 div 대체 mutation을 거부한다", () => {
  const navigation = read(navigationPath);
  const mutation = navigation.replace(
    /<nav(\s+id="mobile-navigation")/,
    "<div$1",
  );

  assert.notEqual(mutation, navigation);
  assert.throws(() => assertMobileNavigationContract(mutation));
});

test("모바일 탐색 링크 계약은 close handler 제거 mutation을 거부한다", () => {
  const navigation = read(navigationPath);
  const mutation = navigation.replace(
    /(\{MOBILE_NAVIGATION\.map\(\(item\) => \([\s\S]*?<Link[\s\S]*?)\s+onClick=\{closeMenu\}/,
    "$1",
  );

  assert.notEqual(mutation, navigation);
  assert.throws(() => assertMobileNavigationContract(mutation));
});

test("푸터의 광고와 법적 링크를 전역 셸에서 보존한다", () => {
  const footer = read(footerPath);

  assert.match(footer, /<FooterAd\s*\/>/);
  assert.ok(footer.indexOf("<FooterAd") < footer.indexOf("<footer"));
  assert.match(footer, /href="\/terms"/);
  assert.match(footer, /href="\/privacy"/);
});
