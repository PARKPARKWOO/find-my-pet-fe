import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
}

const marquee = read("src/components/patterns/MarqueeRail.client.tsx");
const latest = read("src/app/_components/home/LatestPetMarquee.tsx");
const runtime = read("src/app/_components/home/HomeMotionRuntime.client.tsx");
const page = read("src/app/page.tsx");
const rootLayout = read("src/app/layout.tsx");
const globals = read("src/app/globals.css");

function assertInitialMarkupContract(source) {
  assert.match(source, /^"use client";/);
  assert.match(source, /const \[canLoop, setCanLoop\] = useState\(false\)/);
  assert.match(source, /overflow-x-auto/);
  assert.match(source, /<ul[\s\S]*?ref=\{originalSequenceRef\}/);
  assert.match(source, /\{canLoop \? \([\s\S]*?<ul[\s\S]*?aria-hidden="true"/);
  assert.doesNotMatch(source, /aria-live|next\/dynamic|ssr:\s*false/);
}

function assertCloneAccessibilityContract(source) {
  assert.match(source, /duplicate \? `\$\{item\.key\}-duplicate` : item\.key/);
  assert.match(source, /tabIndex=\{duplicate \? -1 : undefined\}/);
  assert.match(source, /aria-hidden="true"/);
  assert.match(source, /aria-pressed=\{userPaused\}/);
  assert.match(source, /min-h-11/);
  assert.match(source, /소식 자동 이동 멈추기/);
  assert.match(source, /소식 자동 이동 다시 재생/);
  assert.doesNotMatch(source, /<li[^>]+id=|<Link[^>]+id=/);
}

function assertMeasurementContract(source) {
  assert.match(source, /const sequenceWidth = Math\.round\(original\.scrollWidth\)/);
  assert.match(source, /const viewportWidth = Math\.round\(viewport\.clientWidth\)/);
  assert.match(source, /const firstCardWidth = Math\.round\(firstCard\.getBoundingClientRect\(\)\.width\)/);
  assert.match(source, /sequenceWidth - viewportWidth >= firstCardWidth/);
  assert.match(source, /observer\.observe\(viewport\)/);
  assert.match(source, /observer\.observe\(original\)/);
  assert.equal((source.match(/observer\.observe\(/g) ?? []).length, 2);
  assert.match(source, /previous\?\.sequenceWidth === next\.sequenceWidth[\s\S]*?previous\.viewportWidth === next\.viewportWidth[\s\S]*?previous\.firstCardWidth === next\.firstCardWidth/);
}

function assertTweenContract(source) {
  assert.match(source, /const \{ gsap \} = await import\("gsap"\)/);
  assert.match(source, /const duration = dimensions\.sequenceWidth \/ 40/);
  assert.match(source, /xPercent:\s*-50/);
  assert.match(source, /duration,/);
  assert.match(source, /ease:\s*"none"/);
  assert.match(source, /repeat:\s*-1/);
  assert.match(source, /gap-0/);
  assert.ok((source.match(/w-max flex-none gap-4 pr-4/g) ?? []).length >= 2);
  assert.match(source, /tweenRef\.current\?\.kill\(\)/);
  assert.match(source, /clearProps:\s*"transform,willChange"/);
  assert.match(source, /generation !== generationRef\.current/);
}

function assertPauseContract(source) {
  for (const reason of ["hovered", "focusWithin", "pointerDown", "userPaused"]) {
    assert.match(source, new RegExp(`const \\[${reason}`));
  }
  assert.match(source, /const paused = hovered \|\| focusWithin \|\| pointerDown \|\| userPaused/);
  assert.match(source, /onPointerEnter=\{\(\) => setHovered\(true\)\}/);
  assert.match(source, /onPointerLeave=\{\(\) => setHovered\(false\)\}/);
  assert.match(source, /onPointerDown=\{handlePointerDown\}/);
  assert.match(source, /onPointerUp=\{handlePointerEnd\}/);
  assert.match(source, /onPointerCancel=\{handlePointerEnd\}/);
  assert.match(source, /setPointerCapture\(event\.pointerId\)/);
  assert.match(source, /releasePointerCapture\(event\.pointerId\)/);
  assert.match(source, /currentTarget\.contains\(event\.relatedTarget as Node \| null\)/);
  assert.match(source, /tweenRef\.current\?\.pause\(\)/);
  assert.match(source, /tweenRef\.current\?\.play\(\)/);

  const viewportIndex = source.indexOf("ref={viewportRef}");
  const trackIndex = source.indexOf("ref={trackRef}");
  assert.ok(viewportIndex >= 0 && trackIndex > viewportIndex);
  for (const handler of [
    "onPointerEnter=",
    "onPointerLeave=",
    "onFocusCapture=",
    "onBlurCapture=",
    "onPointerDown=",
    "onPointerUp=",
    "onPointerCancel=",
  ]) {
    const handlerIndex = source.indexOf(handler);
    assert.ok(
      handlerIndex > viewportIndex && handlerIndex < trackIndex,
      `${handler} must be scoped to the viewport and exclude the pause control`,
    );
  }
  assert.match(source, /<\/div>\s*\{canLoop \? \(\s*<button/);
}

function assertDateContract(source) {
  assert.match(source, /formatMarqueeDate\(item\.occurredAt, item\.dateFormat\)/);
  assert.match(source, /item\.dateFormat === "yyyymmdd"/);
  assert.match(source, /`\$\{item\.occurredAt\.slice\(0, 4\)\}-\$\{item\.occurredAt\.slice\(4, 6\)\}-\$\{item\.occurredAt\.slice\(6, 8\)\}`/);
  assert.match(source, /<time dateTime=\{dateTime\}/);
  assert.match(source, /dateTime && formattedDate \? \(/);
}

function assertRuntimeContract(source) {
  assert.match(source, /^"use client";/);
  assert.match(source, /Promise\.all\(\[[\s\S]*?import\("lenis"\)[\s\S]*?import\("gsap"\)[\s\S]*?import\("gsap\/ScrollTrigger"\)/);
  assert.match(source, /autoRaf:\s*false/);
  assert.match(source, /anchors:\s*true/);
  assert.match(source, /closest\("\[data-native-scroll\]"\)/);
  assert.match(source, /const onLenisScroll = \(\) => ScrollTrigger\.update\(\)/);
  assert.match(source, /lenis\.on\("scroll", onLenisScroll\)/);
  assert.match(source, /lenis\.off\("scroll", onLenisScroll\)/);
  assert.match(source, /const update = \(time: number\) => lenis\.raf\(time \* 1000\)/);
  assert.match(source, /gsap\.ticker\.add\(update\)/);
  assert.match(source, /gsap\.ticker\.remove\(update\)/);
  assert.match(source, /gsap\.context/);
  assert.match(source, /context\) context\.revert\(\)/);
  assert.match(source, /ownedTriggers[\s\S]*?trigger\.kill\(\)/);
  assert.match(source, /document\.documentElement\.setAttribute\("data-home-motion", "active"\)/);
  assert.match(source, /document\.documentElement\.removeAttribute\("data-home-motion"\)/);
  assert.match(source, /lenis\.destroy\(\)/);
  assert.doesNotMatch(source, /ScrollTrigger\.killAll\(\)|from\s+["'](?:lenis|gsap|gsap\/ScrollTrigger)["']/);
}

test("server composition keeps one real no-JS sequence and home-only runtime", () => {
  assert.match(latest, /if \(items\.length === 0\) return null/);
  assert.match(latest, /import \{ MarqueeRail \} from "@\/components\/patterns\/MarqueeRail\.client"/);
  assert.match(latest, /<MarqueeRail items=\{items\} \/>/);
  assert.doesNotMatch(latest, /items\.map|next\/dynamic|"use client"/);
  assertInitialMarkupContract(marquee);
  assert.equal((page.match(/<HomeMotionRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(page, /data-home-motion-root/);
  assert.doesNotMatch(rootLayout, /HomeMotionRuntime|\blenis\b|ScrollTrigger|from ["']gsap["']/);

  assert.throws(() => assertInitialMarkupContract(marquee.replace("useState(false)", "useState(true)")));
  assert.throws(() => assertInitialMarkupContract(marquee.replace("overflow-x-auto", "overflow-hidden")));
});

test("clone and pause control are loop-only and inaccessible duplicates stay inert", () => {
  assertCloneAccessibilityContract(marquee);
  assert.match(marquee, /\{canLoop \? \([\s\S]*?aria-pressed=\{userPaused\}/);
  assert.throws(() => assertCloneAccessibilityContract(marquee.replace("aria-hidden=\"true\"", "")));
  assert.throws(() => assertCloneAccessibilityContract(marquee.replace("duplicate ? -1 : undefined", "undefined")));
  assert.throws(() => assertCloneAccessibilityContract(marquee.replace("`${item.key}-duplicate`", "item.key")));
});

test("rounded long-rail threshold and resize observation are exact", () => {
  assertMeasurementContract(marquee);
  assert.match(marquee, /const \[measurementReady, setMeasurementReady\] = useState\(false\)/);
  assert.match(marquee, /reducedMotion === null/);
  assert.match(marquee, /setCanLoop\([\s\S]*?setMeasurementReady\(true\)/);
  assert.match(marquee, /data-marquee-ready=\{measurementReady \? "true" : undefined\}/);
  assert.throws(() => assertMeasurementContract(marquee.replace("sequenceWidth - viewportWidth >= firstCardWidth", "sequenceWidth > viewportWidth")));
  assert.throws(() => assertMeasurementContract(marquee.replace("observer.observe(original)", "observer.observe(trackRef.current)")));
});

test("marquee distance, duration, geometry, and owned cleanup stay coupled", () => {
  assertTweenContract(marquee);
  assert.throws(() => assertTweenContract(marquee.replace("dimensions.sequenceWidth / 40", "12")));
  assert.throws(() => assertTweenContract(marquee.replace("xPercent: -50", "xPercent: -100")));
  assert.throws(() => assertTweenContract(marquee.replaceAll("clearProps: \"transform,willChange\"", "clearProps: \"transform\"")));
});

test("all interaction pause reasons remain independent", () => {
  assertPauseContract(marquee);
  assert.throws(() => assertPauseContract(marquee.replace("hovered || focusWithin || pointerDown || userPaused", "userPaused")));
  assert.throws(() => assertPauseContract(marquee.replace("currentTarget.contains(event.relatedTarget as Node | null)", "false")));
});

test("real valid dates get normalized machine values and invalid dates omit time", () => {
  assertDateContract(marquee);
  assert.throws(() => assertDateContract(marquee.replace("dateTime && formattedDate", "formattedDate")));
  assert.throws(() => assertDateContract(marquee.replace("item.dateFormat === \"yyyymmdd\"", "false")));
});

test("home runtime owns cancellable Lenis, ticker, context, triggers, and marker", () => {
  assertRuntimeContract(runtime);
  assert.match(runtime, /prefers-reduced-motion: reduce/);
  assert.match(runtime, /generation !== generationRef\.current/);
  assert.match(runtime, /mediaQuery\.addEventListener\("change", handleMotionPreference\)/);
  assert.match(runtime, /mediaQuery\.removeEventListener\("change", handleMotionPreference\)/);
  assert.throws(() => assertRuntimeContract(runtime.replace("time * 1000", "time")));
  assert.throws(() => assertRuntimeContract(runtime.replace("onLenisScroll)", "() => ScrollTrigger.update())")));
  assert.throws(() => assertRuntimeContract(runtime.replaceAll('document.documentElement.removeAttribute("data-home-motion");', "")));
  assert.throws(() => assertRuntimeContract(`${runtime}\nScrollTrigger.killAll();`));
});

test("official Lenis CSS and visible-by-default reveal hooks remain scoped", () => {
  assert.match(globals, /^@import "lenis\/dist\/lenis\.css";/);
  assert.doesNotMatch(globals, /\[data-home-motion\][^{]*\{[^}]*opacity:\s*0/);
  assert.match(page, /data-home-motion=/);
  assert.match(marquee, /data-marquee-viewport/);
  assert.match(marquee, /data-marquee-track/);
  assert.match(marquee, /data-marquee-sequence="original"/);
  assert.match(marquee, /data-marquee-sequence="duplicate"/);
});
