# Find My Pet Design Foundation and Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 따뜻한 디자인 시스템을 호환 계층으로 도입하고, 전역 셸과 홈을 실제 데이터·정적 fallback·접근 가능한 모션을 갖춘 첫 번째 독립 배포 단위로 완성한다.

**Architecture:** 홈 페이지를 다시 Server Component로 만들고, 정적 Hero·안내 콘텐츠와 서버에서 병렬 수집한 공개 피드 snapshot을 렌더한다. 로그인 CTA·필터·기존 목록·marquee 측정처럼 상호작용이 필요한 부분만 작은 Client Component로 남긴다. 기존 shadcn 변수와 legacy primitive 경로는 제거하지 않고 semantic token과 adapter를 덧대어 후속 화면을 단계적으로 이전한다.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript 5, Tailwind CSS 3, node:test, GSAP 3, Lenis, Playwright, axe-core

**Primary implementation references:** [GSAP context cleanup](https://gsap.com/docs/v3/GSAP/gsap.context%28%29/), [Lenis setup and GSAP integration](https://github.com/darkroomengineering/lenis), [Playwright web server configuration](https://playwright.dev/docs/test-webserver), [axe-core Playwright integration](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)

## Global Constraints

- 기준 설계는 `docs/superpowers/specs/2026-07-30-fmp-full-site-design-system-design.md`다.
- 이 계획은 Stage 0~2만 다룬다. 목록·상세·폼·자료실 전체 시각 이전은 후속 계획, 마이페이지·수색그룹·팀·알림·채팅은 별도 후속 계획으로 진행한다.
- 현재 dirty worktree를 보존한다. 특히 `package.json`, `src/app/page.tsx`, `src/app/faq/page.tsx`, 두 목록 파일, 카테고리 registry와 카테고리 컴포넌트의 기존 변경을 먼저 diff로 읽고 그 위에 최소 hunk만 적용한다.
- `gradle.properties`는 읽거나 수정하지 않는다.
- 제품 코드에 시안용 이름·지역·시간·참여자 수·성공률을 넣지 않는다. Home marquee는 공개 API 응답 필드만 사용한다.
- `/posts`에는 상태 filter가 없다. 첫 페이지에서 `SEARCHING | SEEN`만 고르며, 뒤 페이지까지 활성 항목이 있음을 보장한다고 표현하지 않는다.
- `OPEN` 보호 공고는 공고 진행 상태이지 동물의 현재 상태 확정이 아니다. 사용자 label은 `보호소 공고`로 쓴다.
- 전체 공개 목격 제보를 한 번에 모으는 aggregate API는 없으므로 가짜 pin이나 N+1 조회를 만들지 않는다. 이 slice의 실제 지도는 사용자가 위치 사용을 누른 뒤 `GET /posts/nearby`가 반환한 공개 `SEARCHING | SEEN` 좌표만 표시한다. 팀/그룹 통합 지도는 `준비 중`으로 분리한다.
- Stage 2의 no-JS 승인 범위는 새 Hero·목적 링크·상황별 안내·검색 form·marquee 원본 sequence다. 기존 client-fetched 전체 목록의 server fallback은 Stage 3에서 다룬다.
- 새 아이콘이 꼭 필요한 경우에만 Iconify Solar를 추가한다. 이번 slice의 모바일 메뉴와 marquee 제어는 명시적 텍스트 버튼으로 구현하므로 `@iconify/react`를 선제 설치하지 않는다.
- 폰트 파일을 새로 내려받지 않는다. `font-editorial`은 `"Noto Serif KR"`, `"Noto Serif CJK KR"`, `Georgia`, `serif` fallback stack으로 시작한다.
- 자동 커밋 전에 `git diff -- <paths>`로 pre-existing hunk가 섞이지 않았는지 확인한다. 이미 dirty였던 파일의 기존 변경을 분리할 수 없으면 해당 파일은 커밋하지 않고 최종 보고에 남긴다.
- 패키지 명령은 저장소 선언과 맞춰 `corepack yarn`을 사용한다. 이 Codex 셸에서는 plain `yarn`이 PATH에 없지만 `corepack yarn --version`은 `1.22.22`로 동작한다.

## Verified Baseline Before Implementation

- `corepack yarn test:category`: 9 passed, 0 failed.
- `corepack yarn tsc --noEmit`: passed.
- `corepack yarn lint`: exit 0, 기존 warning 5건.
  - `LostDetailClient.tsx`: effect dependency warning 1건.
  - `FlyerManagementSection.tsx`: effect dependency warning 1건.
  - `SightingSection.tsx`: effect dependency warning 1건.
  - `SimilarCandidatesSection.tsx`: raw `<img>` warning 1건.
  - `register/page.tsx`: raw `<img>` warning 1건.
- `corepack yarn build`: exit 0. 정적 생성 중 sandbox DNS로 `fmp.platformholder.site` fetch가 실패했지만 기존 catch/fallback으로 21개 정적 페이지 생성과 build는 완료됐다.
- 홈의 현재 First Load JS는 build 표 기준 142 kB다. Stage 2 완료 뒤 같은 표를 다시 기록하되 감소 수치를 미리 약속하지 않는다.

---

## Task 1: Freeze the Stage 0 Baseline

**Files:**

- Create: `docs/superpowers/baselines/2026-07-30-fmp-stage0.md`
- Create: `docs/superpowers/baselines/2026-07-30-fmp-stage0/desktop/home.png`
- Create: `docs/superpowers/baselines/2026-07-30-fmp-stage0/desktop/lost.png`
- Create: `docs/superpowers/baselines/2026-07-30-fmp-stage0/desktop/abandonment.png`
- Create: `docs/superpowers/baselines/2026-07-30-fmp-stage0/desktop/register.png`
- Create: `docs/superpowers/baselines/2026-07-30-fmp-stage0/desktop/profile.png`
- Create: `docs/superpowers/baselines/2026-07-30-fmp-stage0/mobile/home.png`
- Create: `docs/superpowers/baselines/2026-07-30-fmp-stage0/mobile/lost.png`
- Create: `docs/superpowers/baselines/2026-07-30-fmp-stage0/mobile/abandonment.png`
- Create: `docs/superpowers/baselines/2026-07-30-fmp-stage0/mobile/register.png`
- Create: `docs/superpowers/baselines/2026-07-30-fmp-stage0/mobile/profile.png`
- Reference: `docs/superpowers/specs/2026-07-30-fmp-full-site-design-system-design.md`

- [ ] **Step 1: Record the dirty-worktree boundary**

Run:

```bash
git status --short
git diff -- package.json src/app/page.tsx src/app/faq/page.tsx src/app/_components/main/LostList.tsx src/app/_components/main/AbandonmentList.tsx
```

Write the list of pre-existing modified/untracked paths into the baseline document. Do not describe those changes as implemented by this plan.

- [ ] **Step 2: Record executable baseline results**

Run:

```bash
corepack yarn test:category
corepack yarn tsc --noEmit
corepack yarn lint
corepack yarn build
```

Expected: all four commands exit 0; lint/build retain only the five warnings listed above. DNS fetch messages during static generation are an environment limitation, not a build failure.

- [ ] **Step 3: Capture the current home at two widths**

Start the app with the existing local API configuration and capture `/`, `/lost`, `/abandonment`, `/register`, and `/profile` at 1440×1200 and 390×844. If a real public detail ID is available, additionally record the current lost/protection detail appearance in the baseline document; do not store a private or fabricated ID. If the API or authentication is unavailable, capture the honest error/login state and mark it `API or auth unavailable`; do not substitute mock content in the baseline.

- [ ] **Step 4: Commit only the new baseline artifacts**

```bash
git add docs/superpowers/baselines/2026-07-30-fmp-stage0.md docs/superpowers/baselines/2026-07-30-fmp-stage0/desktop docs/superpowers/baselines/2026-07-30-fmp-stage0/mobile
git commit -m "docs: capture fmp design baseline"
```

- [ ] **Step 5: Create a reproducible prerequisite checkpoint**

The current category/status/account work predates this design slice and includes untracked modules used by every later task. Review it as its own coherent change before adding design code:

```bash
git diff --check
corepack yarn test:category
corepack yarn node --test scripts/abandonment-status-contract.test.mjs
corepack yarn typecheck
corepack yarn lint
```

Inspect every currently modified/untracked path. If the changes match the already approved category/status/account work, stage this exact pre-plan set as one prerequisite checkpoint:

```bash
git add -- package.json public/llms.txt scripts/indexnow.mjs scripts/abandonment-status-contract.test.mjs scripts/category-contract.test.mjs scripts/test-utils "src/app/(route)/abandonment/[detail]/page.tsx" "src/app/(route)/abandonment/page.tsx" "src/app/(route)/lost/page.tsx" "src/app/(route)/profile/page.tsx" src/app/_components/AbandonmentCard.tsx src/app/_components/AbandonmentPagination.tsx src/app/_components/LostPagination.tsx src/app/_components/abandonment/ClosedNoticeBanner.tsx src/app/_components/category src/app/_components/main/AbandonmentList.tsx src/app/_components/main/LostList.tsx src/app/_components/profile/WithdrawSection.tsx src/app/_components/ui/pagination.tsx src/app/faq/page.tsx src/app/page.tsx src/app/privacy/page.tsx src/app/search/page.tsx src/app/sitemap.ts src/app/terms/page.tsx src/lib/abandonment.ts src/lib/auth.ts src/lib/pagination.ts src/lib/purposeCategories.ts src/lib/region.ts
```

Do not stage `.superpowers/` or `docs/superpowers/plans/` in this prerequisite commit. Verify the staged snapshot itself:

```bash
git diff --cached --check
git diff --cached --stat
corepack yarn test:category
corepack yarn typecheck
git commit -m "feat: checkpoint fmp category and account updates"
```

If any path cannot be attributed to the approved earlier work, do not stage it. Stop before Task 2 and report the exact path instead of building commits that depend on untracked prerequisites. Every later task assumes this checkpoint or an equivalent user-owned commit exists.

---

## Task 2: Add Semantic Tokens and Safe Primitive Adapters

**Files:**

- Create: `scripts/design-system-contract.test.mjs`
- Create: `src/components/layout/Container.tsx`
- Create: `src/components/layout/PageShell.tsx`
- Create: `src/components/typography/SectionHeading.tsx`
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/app/_components/ui/button.tsx`
- Modify: `src/app/_components/ui/input.tsx`
- Modify: `src/app/_components/ui/label.tsx`
- Modify: `package.json`

- [ ] **Step 1: Write the failing design-system contract**

Create a node:test suite that reads the CSS, Tailwind config, canonical Button, legacy adapter, and three new primitives. Its core assertions must be:

```js
test("승인된 색을 semantic token으로 제공한다", () => {
  const css = fs.readFileSync(globalsPath, "utf8");
  assert.match(css, /--fmp-canvas:\s*233 230 223;\s*\/\* #E9E6DF \*\//);
  assert.match(css, /--fmp-paper:\s*245 240 232;\s*\/\* #F5F0E8 \*\//);
  assert.match(css, /--fmp-raised:\s*255 253 248;\s*\/\* #FFFDF8 \*\//);
  assert.match(css, /--fmp-ink:\s*32 42 38;\s*\/\* #202A26 \*\//);
  assert.match(css, /--fmp-forest:\s*47 90 73;\s*\/\* #2F5A49 \*\//);
  assert.match(css, /--fmp-clay:\s*214 111 84;\s*\/\* #D66F54 \*\//);
  assert.match(css, /--fmp-wine:\s*112 69 65;\s*\/\* #704541 \*\//);
  assert.match(css, /--fmp-sighting:\s*75 127 163;\s*\/\* #4B7FA3 \*\//);
  assert.match(css, /--fmp-waiting:\s*185 137 59;\s*\/\* #B9893B \*\//);
  assert.match(css, /--fmp-text-secondary:/);
  assert.match(css, /--fmp-text-muted:/);
  assert.match(css, /--fmp-text-inverse:/);
  assert.match(css, /--fmp-action-primary:/);
  assert.match(css, /--fmp-action-secondary:/);
  assert.match(css, /--fmp-action-destructive:/);
  assert.match(css, /--fmp-action-brand:/);
  assert.match(css, /--fmp-state-searching:/);
  assert.match(css, /--fmp-state-sighting:/);
  assert.match(css, /--fmp-state-found:/);
  assert.match(css, /--fmp-state-protected:/);
  assert.match(css, /--fmp-state-waiting:/);
  assert.match(css, /--fmp-state-archived:/);
  assert.match(css, /--fmp-map-missing-pin:/);
  assert.match(css, /--fmp-map-sighting-pin:/);
  assert.match(css, /--fmp-map-radius:/);
  assert.match(css, /--fmp-map-selected:/);
  assert.match(css, /--background:\s*37 39% 94%/);
  assert.match(css, /--foreground:\s*156 14% 15%/);
});

test("기존 xs breakpoint와 primitive 호환 경로를 보존한다", () => {
  const tailwind = fs.readFileSync(tailwindPath, "utf8");
  const adapter = fs.readFileSync(legacyButtonPath, "utf8");
  assert.match(tailwind, /['"]xs['"]:\s*['"]480px['"]/);
  assert.match(adapter, /CanonicalButton/);
  assert.match(adapter, /defaultVariants:[\s\S]*?size:\s*["']sm["']/);
});
```

Run:

```bash
corepack yarn node --test scripts/design-system-contract.test.mjs
```

Expected: FAIL because the semantic tokens and primitive files do not exist yet.

- [ ] **Step 2: Add tokens without deleting shadcn compatibility variables**

Add these RGB triplet tokens to `:root` in `globals.css`:

```css
--fmp-canvas: 233 230 223; /* #E9E6DF */
--fmp-paper: 245 240 232; /* #F5F0E8 */
--fmp-raised: 255 253 248; /* #FFFDF8 */
--fmp-ink: 32 42 38; /* #202A26 */
--fmp-forest: 47 90 73; /* #2F5A49 */
--fmp-clay: 214 111 84; /* #D66F54 */
--fmp-wine: 112 69 65; /* #704541 */
--fmp-sighting: 75 127 163; /* #4B7FA3 */
--fmp-waiting: 185 137 59; /* #B9893B */
--fmp-kakao: 254 229 0; /* #FEE500 */
--fmp-text-primary: var(--fmp-ink);
--fmp-text-secondary: 68 79 73;
--fmp-text-muted: 105 112 107;
--fmp-text-inverse: var(--fmp-raised);
--fmp-action-primary: var(--fmp-forest);
--fmp-action-secondary: var(--fmp-wine);
--fmp-action-destructive: 181 68 56;
--fmp-action-brand: var(--fmp-kakao);
--fmp-state-searching: var(--fmp-clay);
--fmp-state-sighting: var(--fmp-sighting);
--fmp-state-found: var(--fmp-forest);
--fmp-state-protected: var(--fmp-wine);
--fmp-state-waiting: var(--fmp-waiting);
--fmp-state-archived: var(--fmp-text-muted);
--fmp-map-missing-pin: var(--fmp-clay);
--fmp-map-sighting-pin: var(--fmp-sighting);
--fmp-map-radius: 214 111 84;
--fmp-map-selected: var(--fmp-ink);
--fmp-radius-sm: 0.625rem;
--fmp-radius-md: 0.75rem;
--fmp-radius-lg: 1rem;
--fmp-radius-xl: 1.25rem;
--fmp-shadow-raised: 0 12px 30px rgb(32 42 38 / 0.08);
```

Keep the existing `--background`, `--foreground`, `--card`, `--primary`, and related variables, but map their light values to the warm system. At minimum use `--background: 37 39% 94%`, `--foreground: 156 14% 15%`, `--card: 43 100% 99%`, and `--primary: 156 31% 27%`. Do not activate or advertise dark mode in this slice.

Set the actual body font to the existing Geist variable and add global focus/reduced-motion rules:

```css
body {
  color: rgb(var(--fmp-ink));
  background: rgb(var(--fmp-canvas));
  font-family: var(--font-geist-sans), "Noto Sans KR", system-ui, sans-serif;
}

:focus-visible {
  outline: 2px solid rgb(var(--fmp-forest));
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  html:focus-within {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Map semantic tokens in Tailwind**

Preserve `xs: 480px` and add:

```ts
colors: {
  surface: {
    canvas: "rgb(var(--fmp-canvas) / <alpha-value>)",
    paper: "rgb(var(--fmp-paper) / <alpha-value>)",
    raised: "rgb(var(--fmp-raised) / <alpha-value>)",
    inverse: "rgb(var(--fmp-ink) / <alpha-value>)",
  },
  ink: "rgb(var(--fmp-ink) / <alpha-value>)",
  forest: "rgb(var(--fmp-forest) / <alpha-value>)",
  clay: "rgb(var(--fmp-clay) / <alpha-value>)",
  wine: "rgb(var(--fmp-wine) / <alpha-value>)",
  sighting: "rgb(var(--fmp-sighting) / <alpha-value>)",
  waiting: "rgb(var(--fmp-waiting) / <alpha-value>)",
  kakao: "rgb(var(--fmp-kakao) / <alpha-value>)",
  content: {
    primary: "rgb(var(--fmp-text-primary) / <alpha-value>)",
    secondary: "rgb(var(--fmp-text-secondary) / <alpha-value>)",
    muted: "rgb(var(--fmp-text-muted) / <alpha-value>)",
    inverse: "rgb(var(--fmp-text-inverse) / <alpha-value>)",
  },
  action: {
    primary: "rgb(var(--fmp-action-primary) / <alpha-value>)",
    secondary: "rgb(var(--fmp-action-secondary) / <alpha-value>)",
    destructive: "rgb(var(--fmp-action-destructive) / <alpha-value>)",
    brand: "rgb(var(--fmp-action-brand) / <alpha-value>)",
  },
  state: {
    searching: "rgb(var(--fmp-state-searching) / <alpha-value>)",
    sighting: "rgb(var(--fmp-state-sighting) / <alpha-value>)",
    found: "rgb(var(--fmp-state-found) / <alpha-value>)",
    protected: "rgb(var(--fmp-state-protected) / <alpha-value>)",
    waiting: "rgb(var(--fmp-state-waiting) / <alpha-value>)",
    archived: "rgb(var(--fmp-state-archived) / <alpha-value>)",
  },
  map: {
    missing: "rgb(var(--fmp-map-missing-pin) / <alpha-value>)",
    sighting: "rgb(var(--fmp-map-sighting-pin) / <alpha-value>)",
    radius: "rgb(var(--fmp-map-radius) / <alpha-value>)",
    selected: "rgb(var(--fmp-map-selected) / <alpha-value>)",
  },
},
fontFamily: {
  sans: ["var(--font-geist-sans)", "Noto Sans KR", "system-ui", "sans-serif"],
  editorial: ["Noto Serif KR", "Noto Serif CJK KR", "Georgia", "serif"],
},
maxWidth: {
  page: "80rem",
  reading: "48rem",
},
boxShadow: {
  raised: "var(--fmp-shadow-raised)",
},
```

Merge these entries into the current `extend` object rather than replacing the shadcn colors.

- [ ] **Step 4: Add canonical primitives and preserve legacy Button behavior**

Create these public interfaces:

```ts
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "page" | "reading";
}

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: "paper" | "raised" | "transparent";
}

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}
```

`Container` maps `page` to `max-w-page` and `reading` to `max-w-reading`. `PageShell` maps only the three declared surfaces. `SectionHeading` renders a semantic heading supplied through `title` and does not hardcode page-specific copy.

Add `action`, `signal`, and `brand` variants to the canonical Button without changing the existing default variant:

```ts
action: "bg-forest text-white hover:bg-forest/90",
signal: "bg-clay text-white hover:bg-clay/90",
brand: "bg-kakao text-[#191919] hover:bg-kakao/90",
```

Implement the legacy Button as a wrapper around `CanonicalButton`. Preserve the legacy `buttonVariants` export, `default` and `secondary` colors, and legacy default `size="sm"`; pagination imports depend on that callable export. Re-export canonical Input and Label from the legacy paths.

- [ ] **Step 5: Add stable project scripts**

Merge these scripts into the existing modified `package.json`:

```json
{
  "typecheck": "tsc --noEmit",
  "test:contracts": "node --test scripts/*.test.mjs"
}
```

Do not remove `test:category` or any IndexNow script.

- [ ] **Step 6: Run focused and global gates**

```bash
corepack yarn node --test scripts/design-system-contract.test.mjs
corepack yarn test:contracts
corepack yarn typecheck
corepack yarn lint
```

Expected: PASS; no warning beyond the five recorded baseline warnings.

- [ ] **Step 7: Commit only separable Task 2 changes**

```bash
git diff -- scripts/design-system-contract.test.mjs src/app/globals.css tailwind.config.ts src/components/ui/button.tsx src/app/_components/ui/button.tsx src/app/_components/ui/input.tsx src/app/_components/ui/label.tsx src/components/layout src/components/typography package.json
git add scripts/design-system-contract.test.mjs src/app/globals.css tailwind.config.ts src/components/ui/button.tsx src/app/_components/ui/button.tsx src/app/_components/ui/input.tsx src/app/_components/ui/label.tsx src/components/layout src/components/typography
git commit -m "feat: add fmp semantic design foundation"
```

Leave `package.json` unstaged if its pre-existing hunk cannot be separated safely.

---

## Task 3: Centralize Guide Links and Make Search Progressive

**Files:**

- Create: `src/lib/featuredGuides.ts`
- Create: `scripts/home-content-contract.test.mjs`
- Modify: `src/app/faq/page.tsx`
- Modify: `src/app/_components/layout/SearchBar.tsx`

- [ ] **Step 1: Write the failing content registry contract**

Use `scripts/test-utils/load-typescript-module.mjs` to load `featuredGuides.ts` and assert:

```js
assert.deepEqual(
  FEATURED_GUIDES.map(({ id, href }) => ({ id, href })),
  [
    { id: "lost-first-steps", href: "/guide#수색" },
    { id: "shelter-return", href: "/faq#shelter-return" },
    { id: "adoption-process", href: "/faq#adoption-process" },
    { id: "missing-prevention", href: "/posts/dog-escape-while-walking" },
  ],
);
assert.equal(new Set(FAQ_ENTRIES.map(({ id }) => id)).size, FAQ_ENTRIES.length);
assert.ok(FAQ_ENTRIES.some(({ id }) => id === "shelter-return"));
assert.ok(FAQ_ENTRIES.some(({ id }) => id === "adoption-process"));
```

Read `SearchBar.tsx` and assert it has `action="/search"`, `method="get"`, `name="q"`, and no `preventDefault` or `router.push`.

Run:

```bash
corepack yarn node --test scripts/home-content-contract.test.mjs
```

Expected: FAIL because the registry does not exist and SearchBar is client-only.

- [ ] **Step 2: Create the stable featured guide registry**

The public registry is:

```ts
export interface FeaturedGuide {
  id: "lost-first-steps" | "shelter-return" | "adoption-process" | "missing-prevention";
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}

export const FEATURED_GUIDES: readonly FeaturedGuide[] = [
  {
    id: "lost-first-steps",
    title: "반려동물을 잃어버렸을 때",
    description: "주변 수색부터 신고와 전단지까지, 먼저 할 일을 순서대로 확인해요.",
    href: "/guide#수색",
    linkLabel: "첫 수색 순서 보기",
  },
  {
    id: "shelter-return",
    title: "보호소에서 내 아이를 찾았을 때",
    description: "확인 자료를 준비하고 보호소에 연락한 뒤 안전하게 데려오는 방법을 알아봐요.",
    href: "/faq#shelter-return",
    linkLabel: "반환 절차 보기",
  },
  {
    id: "adoption-process",
    title: "보호소에서 입양을 준비할 때",
    description: "상담, 교육, 신청처럼 지역마다 달라질 수 있는 과정을 미리 살펴봐요.",
    href: "/faq#adoption-process",
    linkLabel: "입양 과정 보기",
  },
  {
    id: "missing-prevention",
    title: "산책과 생활에서 실종을 예방할 때",
    description: "갑자기 달아나는 이유와 산책 전에 확인할 생활 습관을 정리했어요.",
    href: "/posts/dog-escape-while-walking",
    linkLabel: "예방 방법 보기",
  },
];
```

Move the existing ten FAQ objects into `FAQ_ENTRIES` without rewriting their answers. Add IDs in current order:

```text
shelter-check
notice-period
shelter-return
animal-registration
found-animal-report
after-notice
adoption-process
missing-report
data-source
search-radius
```

- [ ] **Step 3: Preserve SEO while adding stable FAQ anchors**

Import `FAQ_ENTRIES` in `/faq`, keep the `/faq` canonical, metadata, and FAQPage JSON-LD. Render every entry wrapper with `id={entry.id}` and `scroll-mt-24`. Change the visible H1 to `상황별 반려동물 안내`; metadata may retain the search term `FAQ`.

- [ ] **Step 4: Convert SearchBar to a native GET form**

Remove `"use client"`, state, router, and submit interception. Preserve the existing props and visual variants:

```tsx
export default function SearchBar({ variant = "compact", defaultQ = "" }: Props) {
  return (
    <form action="/search" method="get" role="search" className="w-full">
      <label className="sr-only" htmlFor={`site-search-${variant}`}>
        실종 또는 보호 동물 검색
      </label>
      <input
        id={`site-search-${variant}`}
        name="q"
        type="search"
        defaultValue={defaultQ}
        required
      />
      <button type="submit">검색</button>
    </form>
  );
}
```

Keep the current input hint copy and responsive widths in the final implementation. An empty submission is blocked by native `required`; `/search?q=` still retains its existing explicit empty state for direct URLs.

- [ ] **Step 5: Run the contracts and type gate**

```bash
corepack yarn node --test scripts/home-content-contract.test.mjs
corepack yarn test:contracts
corepack yarn typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit separable registry and search changes**

```bash
git diff -- src/lib/featuredGuides.ts scripts/home-content-contract.test.mjs src/app/faq/page.tsx src/app/_components/layout/SearchBar.tsx
git add src/lib/featuredGuides.ts scripts/home-content-contract.test.mjs src/app/_components/layout/SearchBar.tsx
git commit -m "feat: add stable pet guidance links"
```

Add `src/app/faq/page.tsx` only if its pre-existing changes are fully understood and still within this approved feature.

---

## Task 4: Rebuild the Global Shell Without Changing Its Product Contracts

**Files:**

- Create: `src/lib/siteNavigation.ts`
- Modify: `scripts/design-system-contract.test.mjs`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/_components/layout/Navigation.tsx`
- Modify: `src/app/_components/layout/Footer.tsx`

- [ ] **Step 1: Extend the failing shell contract**

Add assertions for:

```js
assert.match(navigation, /<Link[^>]+href="\/"/);
assert.doesNotMatch(navigation, /<div[^>]+onClick=\{\(\) => router\.push\("\/"\)\}/);
assert.doesNotMatch(navigation, /<Button[^>]*>\s*<Link/);
assert.match(navigation, /NotificationBell/);
assert.match(navigation, /requestLogout/);
assert.match(footer, /<FooterAd\s*\/>/);
assert.match(footer, /href="\/terms"/);
assert.match(footer, /href="\/privacy"/);
assert.doesNotMatch(layout, /<main[\s>]/);
assert.doesNotMatch(layout, /from ["']lenis["']/);
assert.doesNotMatch(layout, /from ["']gsap["']/);
```

Run the test and confirm it fails on the clickable logo and nested interactive markup.

- [ ] **Step 2: Add a navigation registry**

```ts
export const SITE_NAVIGATION = [
  { label: "함께 찾기", href: "/lost" },
  { label: "보호 동물", href: "/abandonment" },
  { label: "보호소·입양", href: "/abandonment/region" },
  { label: "이용 안내", href: "/guide" },
] as const;
```

These are global group labels and do not replace the five exact purpose category names.

- [ ] **Step 3: Refactor Navigation semantics and responsive behavior**

- Keep the desktop nav at the existing 64px one-line height.
- Make the logo a real `<Link href="/">Find My Pet</Link>`.
- Render the four registry links in the center on desktop with `text-ink/80`, `hover:text-forest`, and `focus-visible` state. Do not enlarge the header structure.
- Add a 44px text button labelled `메뉴` on mobile. Its controlled panel exposes the same four links plus `상황별 반려동물 안내` in one level.
- Preserve `NotificationBell`, the avatar popover, HttpOnly-cookie logout through `requestLogout`, `setLogout`, and redirect to `/`.
- Replace every Button/Link nesting with `Button asChild` or a styled single Link.
- Use the canonical PopoverContent import instead of importing the Radix primitive directly.
- Use `소식 등록` for the header CTA and route it to `/register`; keep login gating in the existing dialog/store flow.

- [ ] **Step 4: Restyle Footer and RootLayout through tokens**

Keep JSON-LD, GA, AdSense, AdFit, Kakao Map SDK, `AuthQueryCapture`, `FooterAd`, legal links, contact, and Toaster unchanged. Add a keyboard skip link and a focusable `#main-content` wrapper while preserving the 1280px content cap:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  본문으로 바로가기
</a>
<Navigation />
<div
  id="main-content"
  tabIndex={-1}
  className="flex flex-grow justify-center px-4 py-6 md:px-6"
>
  <div className="w-full max-w-page">{children}</div>
</div>
<Footer />
```

Use a focusable `<div>` rather than a global `<main>` because existing route pages already own their main landmark; nested main landmarks are invalid.

Use `surface-canvas`, `surface-paper`, `ink`, and `forest` tokens; do not change FooterAd placement.

- [ ] **Step 5: Run focused verification**

```bash
corepack yarn node --test scripts/design-system-contract.test.mjs
corepack yarn typecheck
corepack yarn lint
```

Expected: PASS with baseline warnings only.

- [ ] **Step 6: Commit clean shell paths**

```bash
git diff -- src/lib/siteNavigation.ts scripts/design-system-contract.test.mjs src/app/layout.tsx src/app/_components/layout/Navigation.tsx src/app/_components/layout/Footer.tsx
git add src/lib/siteNavigation.ts scripts/design-system-contract.test.mjs src/app/layout.tsx src/app/_components/layout/Navigation.tsx src/app/_components/layout/Footer.tsx
git commit -m "feat: refresh fmp global shell"
```

---

## Task 5: Build the Public Home Snapshot and Pure Marquee Model

**Files:**

- Create: `src/lib/homeFeed.ts`
- Create: `src/lib/homeFeed.server.ts`
- Create: `scripts/home-feed-contract.test.mjs`
- Reference: `src/app/constant/api.ts`
- Reference: `src/app/rss.xml/route.ts`
- Reference: `../prd/find-my-pet/api-spec.md`

- [ ] **Step 1: Write failing pure-data tests**

Use the TypeScript module loader to test these cases:

```js
test("실종·목격과 진행 중 보호 공고만 실제 필드로 변환한다", () => {
  const items = toMarqueeItems({
    lost: {
      status: "success",
      data: {
        contents: [
          { id: "lost-1", title: "갈색 강아지를 찾습니다", place: "망원동", time: "2026-07-30T10:00:00+09:00", thumbnail: null, missingAnimalStatus: "SEARCHING" },
          { id: "seen-1", title: "공원에서 봤어요", place: "연남동", time: "2026-07-30T09:00:00+09:00", thumbnail: "https://img.example/seen.jpg", missingAnimalStatus: "SEEN" },
          { id: "found-1", title: "가족을 만났어요", place: "합정동", time: "2026-07-30T08:00:00+09:00", thumbnail: null, missingAnimalStatus: "FOUND" },
        ],
        totalCount: 3,
        hasNextPage: false,
      },
    },
    abandonment: {
      status: "success",
      data: {
        contents: [
          { desertionNo: "a-1", kindCd: "[개] 말티즈", happenPlace: "마포구", happenDt: "20260729", popfile: null, noticeClosed: false },
          { desertionNo: "a-2", kindCd: "[고양이] 한국 고양이", happenPlace: "서대문구", happenDt: "20260728", popfile: null, noticeClosed: true },
        ],
        totalCount: 2,
        hasNextPage: false,
      },
    },
  });

  assert.deepEqual(items.map(({ key, kind, href }) => ({ key, kind, href })), [
    { key: "lost:lost-1", kind: "SEARCHING", href: "/lost/lost-1" },
    { key: "abandoned:a-1", kind: "PROTECTED", href: "/abandonment/a-1" },
    { key: "lost:seen-1", kind: "SEEN", href: "/lost/seen-1" },
  ]);
});

test("한 소스가 실패해도 성공한 소스를 유지하고 둘 다 비면 빈 배열이다", () => {
  assert.equal(toMarqueeItems({ lost: { status: "error" }, abandonment: protectedSource }).length, 1);
  assert.deepEqual(toMarqueeItems({ lost: { status: "error" }, abandonment: { status: "error" } }), []);
});

test("목록 request key는 기본 seed와 모든 필터 변경을 구분한다", () => {
  assert.equal(
    getLostRequestKey({ currentPage: 1, pageSize: 5, nearby: { enabled: false } }),
    HOME_LOST_REQUEST_KEY,
  );
  assert.notEqual(
    getLostRequestKey({
      currentPage: 1,
      pageSize: 5,
      nearby: { enabled: true, lat: 37.5, lng: 127, radiusKm: 3 },
    }),
    HOME_LOST_REQUEST_KEY,
  );
  assert.equal(
    getAbandonmentRequestKey({
      noticeStatus: "OPEN",
      animalType: "ALL",
      uprCd: "",
      orgCd: "",
      currentPage: 1,
      pageSize: 20,
    }),
    HOME_ABANDONMENT_REQUEST_KEY,
  );
  assert.notEqual(
    getAbandonmentRequestKey({
      noticeStatus: "OPEN",
      animalType: "DOG",
      uprCd: "6110000",
      orgCd: "",
      currentPage: 1,
      pageSize: 20,
    }),
    HOME_ABANDONMENT_REQUEST_KEY,
  );
});
```

Run:

```bash
corepack yarn node --test scripts/home-feed-contract.test.mjs
```

Expected: FAIL because `homeFeed.ts` does not exist.

- [ ] **Step 2: Implement the serializable model and deterministic interleave**

Expose these types from `homeFeed.ts`:

```ts
export type MissingAnimalStatus = "SEARCHING" | "FOUND" | "SEEN";
export type MarqueeKind = "SEARCHING" | "SEEN" | "PROTECTED";

export interface LostPetSummary {
  author: string;
  gratuity: number;
  id: string;
  place: string;
  thumbnail: string;
  time: string;
  title: string;
  description: string;
  missingAnimalStatus: MissingAnimalStatus;
  distanceKm?: number;
}

export interface NearbyLostPetSummary extends LostPetSummary {
  lat: number;
  lng: number;
  distanceKm: number;
}

export interface AbandonedAnimalSummary {
  desertionNo: string;
  filename: string;
  happenDt: string;
  happenPlace: string;
  kindCd: string;
  colorCd?: string;
  age: string;
  weight: string;
  noticeNo: string;
  noticeSdt: string;
  noticeEdt: string;
  effectiveNoticeEdt?: string | null;
  popfile: string;
  processState: string;
  sexCd: string;
  neuterYn?: string;
  specialMark: string;
  careNm: string;
  careTel: string;
  careAddr: string;
  orgNm?: string;
  chargeNm?: string;
  officetel?: string;
  animalType?: "DOG" | "CAT" | "OTHER";
  noticeClosed?: boolean | null;
  noticeClosedAt?: string | null;
}

export interface PagePayload<T> {
  contents: T[];
  totalCount: number;
  hasNextPage: boolean;
}

export type FeedSource<T> =
  | { status: "success"; data: PagePayload<T> }
  | { status: "error" };

export interface HomeFeedSnapshot {
  lost: FeedSource<LostPetSummary>;
  abandonment: FeedSource<AbandonedAnimalSummary>;
}

export interface MarqueeItem {
  key: `lost:${string}` | `abandoned:${string}`;
  kind: MarqueeKind;
  href: `/lost/${string}` | `/abandonment/${string}`;
  title: string;
  place: string | null;
  occurredAt: string | null;
  dateFormat: "iso" | "yyyymmdd";
  thumbnail: string | null;
}

export interface HomeListSeed<T> {
  requestKey: string;
  data: PagePayload<T>;
}

export const HOME_LOST_REQUEST_KEY = "lost:standard:page=1:size=5";
export const HOME_ABANDONMENT_REQUEST_KEY =
  "abandonment:status=OPEN:type=ALL:sido=:sigungu=:page=1:size=20";

export type NearbyRequestKey =
  | { enabled: false }
  | { enabled: true; lat: number; lng: number; radiusKm: number };

export interface AbandonmentRequestKeyInput {
  noticeStatus: "OPEN" | "CLOSED" | "ALL";
  animalType: "DOG" | "CAT" | "OTHER" | "ALL";
  uprCd: string;
  orgCd: string;
  currentPage: number;
  pageSize: number;
}
```

`toMarqueeItems(snapshot, limit = 8)` must:

- filter `FOUND` and `noticeClosed === true`;
- drop records without an ID or actual non-empty title/kind;
- preserve each endpoint's order;
- interleave lost and abandonment starting with lost;
- stop at `limit`;
- preserve null location, time, and thumbnail instead of inventing fallback facts.

Export `formatMarqueeDate` that returns stable absolute `YYYY.MM.DD` text for ISO and `YYYYMMDD` inputs; do not render relative time that can hydrate differently.

Also export seed adapters with no casting:

```ts
export function toLostSeed(
  source: FeedSource<LostPetSummary>,
): HomeListSeed<LostPetSummary> | undefined {
  return source.status === "success"
    ? { requestKey: HOME_LOST_REQUEST_KEY, data: source.data }
    : undefined;
}

export function toAbandonmentSeed(
  source: FeedSource<AbandonedAnimalSummary>,
): HomeListSeed<AbandonedAnimalSummary> | undefined {
  return source.status === "success"
    ? { requestKey: HOME_ABANDONMENT_REQUEST_KEY, data: source.data }
    : undefined;
}
```

The shared summaries deliberately preserve the current list/card TypeScript contract in this slice. The marquee normalizer must still treat API values defensively at runtime before trimming strings. Full backend-nullability migration belongs to Stage 3.

Implement and export pure request-key builders:

```ts
export function getLostRequestKey(input: {
  currentPage: number;
  pageSize: number;
  nearby: NearbyRequestKey;
}): string {
  if (!input.nearby.enabled) {
    return `lost:standard:page=${input.currentPage}:size=${input.pageSize}`;
  }
  return [
    "lost:nearby",
    `lat=${input.nearby.lat}`,
    `lng=${input.nearby.lng}`,
    `radius=${input.nearby.radiusKm}`,
    `page=${input.currentPage}`,
    `size=${input.pageSize}`,
  ].join(":");
}

export function getAbandonmentRequestKey(input: AbandonmentRequestKeyInput): string {
  return [
    "abandonment",
    `status=${input.noticeStatus}`,
    `type=${input.animalType}`,
    `sido=${input.uprCd}`,
    `sigungu=${input.orgCd}`,
    `page=${input.currentPage}`,
    `size=${input.pageSize}`,
  ].join(":");
}
```

- [ ] **Step 3: Implement independent server-only fetches**

`homeFeed.server.ts` starts with `import "server-only"` and uses native Next `fetch`, not browser-oriented `apiClient`:

```ts
const LOST_PAGE_SIZE = 5;
const ABANDONMENT_PAGE_SIZE = 20;

async function fetchPage<T>(url: string, revalidate: number): Promise<PagePayload<T>> {
  const response = await fetch(
    url,
    process.env.FMP_E2E === "1" ? { cache: "no-store" } : { next: { revalidate } },
  );
  if (!response.ok) throw new Error(`Home feed request failed: ${response.status}`);
  const body = await response.json();
  return {
    contents: Array.isArray(body?.data?.contents) ? body.data.contents : [],
    totalCount: Number(body?.data?.totalCount ?? 0),
    hasNextPage: Boolean(body?.data?.hasNextPage),
  };
}

export async function getHomeFeedSnapshot(): Promise<HomeFeedSnapshot> {
  const lostUrl = `${BASE_URL}/posts?pageSize=${LOST_PAGE_SIZE}&pageOffset=0&orderBy=CREATED_AT_DESC`;
  const abandonmentUrl = `${BASE_URL}/abandoned-animals?pageNo=1&numOfRows=${ABANDONMENT_PAGE_SIZE}&noticeStatus=OPEN`;
  const [lost, abandonment] = await Promise.allSettled([
    fetchPage<LostPetSummary>(lostUrl, 30),
    fetchPage<AbandonedAnimalSummary>(abandonmentUrl, 1800),
  ]);

  return {
    lost: lost.status === "fulfilled" ? { status: "success", data: lost.value } : { status: "error" },
    abandonment:
      abandonment.status === "fulfilled"
        ? { status: "success", data: abandonment.value }
        : { status: "error" },
  };
}
```

Do not log response bodies or identifiers on failure.

- [ ] **Step 4: Run pure contracts and typecheck**

```bash
corepack yarn node --test scripts/home-feed-contract.test.mjs
corepack yarn test:contracts
corepack yarn typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit the isolated data layer**

```bash
git add src/lib/homeFeed.ts src/lib/homeFeed.server.ts scripts/home-feed-contract.test.mjs
git commit -m "feat: add resilient public home feed"
```

---

## Task 6: Reuse the Server Snapshot in Existing Home Lists

**Files:**

- Create: `src/app/_components/home/HomeFeed.client.tsx`
- Modify: `src/app/_components/main/LostList.tsx`
- Modify: `src/app/_components/main/AbandonmentList.tsx`
- Modify: `scripts/category-contract.test.mjs`
- Modify: `scripts/home-content-contract.test.mjs`

- [ ] **Step 1: Add failing source contracts for seed reuse**

Assert both lists accept an optional `initialPage`, compare a stable request key, and retain AbortController fetch for later filter/page changes. Replace the brittle category assertion that requires the exact string `useState(true)` with behavior-level assertions for loading, error, retry, abort, and seed matching.

The list prop and constants come from `src/lib/homeFeed.ts`:

```ts
export interface LostListProps {
  initialPage?: HomeListSeed<LostPetSummary>;
}

export interface AbandonmentListProps {
  initialPage?: HomeListSeed<AbandonedAnimalSummary>;
}
```

Run the focused tests and confirm failure before implementation.

- [ ] **Step 2: Seed LostList without breaking StrictMode or refresh**

Add `initialPage?: HomeListSeed<LostPetSummary>` and initialize visible data, total, and loading state from it. Use a request-key ref that remains valid across StrictMode effect replay but is cleared when the request key actually changes:

```ts
const seededRequestKeyRef = useRef(initialPage?.requestKey ?? null);
const previousRequestKeyRef = useRef(HOME_LOST_REQUEST_KEY);

useEffect(() => {
  const requestKey = getLostRequestKey({ currentPage, pageSize: ITEM_PER_PAGE, nearby });
  if (previousRequestKeyRef.current !== requestKey || reloadToken > 0) {
    seededRequestKeyRef.current = null;
    previousRequestKeyRef.current = requestKey;
  }
  if (seededRequestKeyRef.current === requestKey) {
    setIsLoading(false);
    return;
  }

  const controller = new AbortController();
  void fetchLostPage(controller.signal);
  return () => controller.abort();
}, [currentPage, nearby, reloadToken, initialPage]);
```

Extract the current two request branches into `fetchLostPage(signal: AbortSignal): Promise<void>` without changing their URL, params, page clamping, error/retry behavior, or state transitions. Passing the controller signal is mandatory.

- [ ] **Step 3: Seed only the canonical AbandonmentList request**

Compute the key with `getAbandonmentRequestKey({ noticeStatus, animalType: filter, uprCd, orgCd, currentPage, pageSize: PAGE_SIZE })`. The server seed matches only `OPEN`, `ALL`, nationwide, page 1. If the URL has any other filter, run the existing client request. Preserve URL query SSOT, canonical page replacement, subscriptions, region lookup, and AbortController cleanup.

- [ ] **Step 4: Move current feed interaction into one client island**

`HomeFeed.client.tsx` owns only:

- `FeedView = "all" | "lost" | "abandonment"`;
- login store and registration toast;
- existing three filter chips;
- `LostList` and Suspense-wrapped `AbandonmentList`;
- current pagination/filter behavior.

Its props are:

```ts
export interface HomeFeedProps {
  lostSeed?: HomeListSeed<LostPetSummary>;
  abandonmentSeed?: HomeListSeed<AbandonedAnimalSummary>;
}
```

Add `data-native-scroll` to the feed wrapper so Lenis can yield to native interaction over list controls.

- [ ] **Step 5: Verify one request per successful default source**

Run contracts and typecheck:

```bash
corepack yarn test:contracts
corepack yarn typecheck
corepack yarn lint
```

In browser network inspection, a default home load with successful server data must not immediately issue a duplicate `/posts` or `/abandoned-animals` list request. Region and auth helper requests may still occur. Changing page/filter must issue the correct client request.

- [ ] **Step 6: Commit only understood list hunks**

```bash
git diff -- src/app/_components/home/HomeFeed.client.tsx src/app/_components/main/LostList.tsx src/app/_components/main/AbandonmentList.tsx scripts/category-contract.test.mjs scripts/home-content-contract.test.mjs
git add src/app/_components/home/HomeFeed.client.tsx scripts/home-content-contract.test.mjs
```

Stage the two existing dirty list files and category test only after confirming their earlier fixes remain intact. Then commit with:

```bash
git commit -m "perf: seed fmp home lists from server"
```

---

## Task 7: Compose the Approved Hero and Truthful Discovery Flow

**Files:**

- Create: `src/app/_components/home/HomeHero.tsx`
- Create: `src/app/_components/home/SituationGuide.tsx`
- Create: `src/app/_components/home/NearbyDiscovery.tsx`
- Create: `src/app/_components/home/HomeNearbyMap.client.tsx`
- Create: `src/app/_components/home/LatestPetMarquee.tsx`
- Modify: `src/app/_components/category/PurposeCategoryNav.tsx`
- Modify: `scripts/home-content-contract.test.mjs`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Extend the failing home composition contract**

Assert the source contains the approved heading, exact category registry usage, natural guide label, and no old banner or duplicated standalone category section:

```js
assert.match(hero, /다시 만나는 길을,\s*동네와 함께\./);
assert.match(guide, /상황별 반려동물 안내/);
assert.doesNotMatch(guide, />\s*FAQ\s*</);
assert.doesNotMatch(homePage, /banner\.jpg/);
assert.doesNotMatch(homePage, /무엇을 도와드릴까요/);
assert.match(purposeNav, /availability === "available"/);
assert.match(purposeNav, /준비 중/);
assert.match(nearbyMap, /navigator\.geolocation\.getCurrentPosition/);
assert.match(nearbyMap, /\/posts\/nearby/);
assert.doesNotMatch(nearbyMap, /useEffect\([\s\S]{0,400}getCurrentPosition/);
```

Run and confirm failure.

- [ ] **Step 2: Render two active purposes and three compact planned purposes**

Use `PURPOSE_CATEGORIES` as SSOT. Select IDs so Hero order is `lost` then `abandonment` without reordering the registry itself. The available two are large Links. The three planned categories are non-link list items with exact names and visible `준비 중` text.

Required exact labels:

```text
집을 잃었어요
보호소에서 가족을 기다려요
우리집 근처 보호소
반려동물을 입양하고 싶어요
반려동물의 새 가족을 찾아요
```

- [ ] **Step 3: Build Hero and the situation guide**

`HomeHero` renders a two-column layout:

- left: eyebrow, `다시 만나는 길을, 동네와 함께.`, a short supportive sentence, and `PurposeCategoryNav`;
- right: `SituationGuide` using all four `FEATURED_GUIDES` records;
- every guide is a real Link to an existing route or stable anchor;
- no `FAQ` label is visible;
- cards use semantic tokens and 44px interactive targets.

- [ ] **Step 4: Add an opt-in public nearby map and separate future team status**

`NearbyDiscovery` contains `가까운 곳부터 함께 살펴봐요`, the client map, a real `/abandonment/region` link, and a non-link `수색그룹과 팀 지도 · 준비 중` status. `HomeNearbyMap.client.tsx` must:

- start in an idle state with a 44px `내 위치로 가까운 소식 보기` button;
- request browser geolocation only from that button handler, never on mount;
- explain that the coordinate is used for this lookup and is not stored by the frontend;
- let the user choose 1, 3, 5, or 10km, defaulting to 3km;
- call `GET /posts/nearby` with `lat`, `lng`, `radiusKm`, `pageSize=20`, and `pageOffset=0`;
- discard `FOUND` and any record without finite `lat`/`lng`;
- render real `SEARCHING` coordinates with `map-missing` and real `SEEN` coordinates with `map-sighting`;
- render a parallel semantic result list with public Links to `/lost/{id}` because the map canvas alone is not keyboard-readable;
- distinguish permission denied, request failure, and zero nearby results;
- abort the request on a new lookup or unmount;
- never show team members, private sightings, current-location text copied from the design mock, or fabricated marker counts.

Use the already installed `react-kakao-maps-sdk` and global `KakaoMapScript`. A concrete map body is:

```tsx
<div className="h-[360px] w-full overflow-hidden rounded-2xl">
  <KakaoMap center={center} level={7} style={{ width: "100%", height: "100%" }}>
    <Circle
      center={center}
      radius={radiusKm * 1000}
      strokeColor="#D66F54"
      fillColor="#D66F54"
      fillOpacity={0.08}
    />
    {items.map((item) => (
      <CustomOverlayMap key={item.id} position={{ lat: item.lat, lng: item.lng }}>
        <span
          aria-hidden="true"
          className={
            item.missingAnimalStatus === "SEEN"
              ? "block size-4 rounded-full border-2 border-white bg-map-sighting shadow"
              : "block size-4 rounded-full border-2 border-white bg-map-missing shadow"
          }
        />
      </CustomOverlayMap>
    ))}
  </KakaoMap>
</div>
```

The contract test must prove `getCurrentPosition` occurs in the explicit click flow and that the nearby endpoint is absent before that action.

- [ ] **Step 5: Convert the home page to a Server Component**

First create `LatestPetMarquee` as a static Server Component. It returns `null` for zero items and otherwise renders the section heading plus one horizontally scrollable semantic list. Task 8 enhances this same component with `MarqueeRail` while preserving the server-rendered sequence.

Remove `"use client"`, banner imports, local feed state, router, toast, and store from `page.tsx`. Compose:

```tsx
export default async function Home() {
  const snapshot = await getHomeFeedSnapshot();
  const marqueeItems = toMarqueeItems(snapshot);

  return (
    <PageShell surface="paper">
      <HomeHero />
      <section aria-label="통합 검색" data-native-scroll>
        <SearchBar variant="hero" />
      </section>
      <LatestPetMarquee items={marqueeItems} />
      <NearbyDiscovery />
      <HomeFeed
        lostSeed={toLostSeed(snapshot.lost)}
        abandonmentSeed={toAbandonmentSeed(snapshot.abandonment)}
      />
    </PageShell>
  );
}
```

- [ ] **Step 6: Run content and category contracts**

```bash
corepack yarn node --test scripts/home-content-contract.test.mjs
corepack yarn test:category
corepack yarn typecheck
```

Expected: PASS with the static marquee; Task 8 adds motion without changing the data/content contract.

---

## Task 8: Add the Accessible GSAP Marquee and Home-Only Lenis Runtime

**Files:**

- Create: `src/components/patterns/MarqueeRail.client.tsx`
- Modify: `src/app/_components/home/LatestPetMarquee.tsx`
- Create: `src/app/_components/home/HomeMotionRuntime.client.tsx`
- Create: `scripts/motion-contract.test.mjs`
- Modify: `src/app/page.tsx`
- Modify: `package.json`
- Modify: `yarn.lock`

- [ ] **Step 1: Install only the runtime dependencies used in this slice**

```bash
corepack yarn add gsap lenis
```

Inspect `package.json` and `yarn.lock`; do not remove or reorder unrelated user changes.

- [ ] **Step 2: Write the failing source-level motion contract**

Assert:

```js
assert.match(marquee, /aria-hidden="true"/);
assert.match(marquee, /tabIndex=\{-1\}/);
assert.match(marquee, /aria-pressed=\{userPaused\}/);
assert.match(marquee, /ResizeObserver/);
assert.match(marquee, /prefers-reduced-motion: reduce/);
assert.match(marquee, /xPercent:\s*-50/);
assert.match(marquee, /repeat:\s*-1/);
assert.match(marquee, /gap-0/);
assert.match(marquee, /flex-none/);
assert.match(runtime, /lenis\.raf\(time \* 1000\)/);
assert.match(runtime, /ScrollTrigger\.update/);
assert.match(runtime, /lenis\.destroy\(\)/);
assert.doesNotMatch(rootLayout, /lenis|ScrollTrigger|from ["']gsap["']/);
```

Run and confirm failure.

- [ ] **Step 3: Render a no-JS-safe original sequence**

`LatestPetMarquee` returns `null` for zero items. Otherwise it renders:

```tsx
<section aria-labelledby="latest-pet-news-title">
  <h2 id="latest-pet-news-title">새로 이어지는 소식</h2>
  <p>찾고 있는 소식과 보호소 공고를 한눈에 살펴보세요.</p>
  <MarqueeRail items={items} />
</section>
```

`MarqueeRail` is a Client Component but its initial server and hydration render contains one semantic `<ul>` with `<li><Link /></li>` items and an overflow-x auto viewport. Do not use `dynamic(componentLoader, { ssr: false })`. Each item uses a stable absolute `<time dateTime>` only when a real time exists.

- [ ] **Step 4: Enhance only when the sequence is long enough**

After mount, measure viewport and original sequence with `ResizeObserver`. Set `canLoop` only when reduced motion is false and the original is at least one card wider than the viewport. When `canLoop` is true:

- render exactly one duplicate `<ul aria-hidden="true">`;
- set every duplicate Link to `tabIndex={-1}`;
- make the track `flex w-max gap-0` and both sequences identically `w-max flex-none gap-4 pr-4`, so each sequence occupies exactly half of the track including its trailing inter-sequence gap;
- create a GSAP tween with `xPercent: -50`, `ease: "none"`, `repeat: -1`;
- calculate `duration = sequenceWidth / 40` seconds;
- rebuild after a material resize and kill the old tween;
- apply `will-change: transform` only while running.

Load GSAP with `import("gsap")` inside the enhancement effect. Keep the tween in a ref and call `kill()` in every rebuild and unmount cleanup.

If the sequence becomes too short, kill the tween and remove the duplicate and pause control.

- [ ] **Step 5: Implement all stop conditions**

Pause on pointer hover, `focus-within`, and explicit user pause. The text button must be at least 44px, expose `aria-pressed`, and switch accessible text between `소식 자동 이동 멈추기` and `소식 자동 이동 다시 재생`. Pointer leave or focus exit resumes only if `userPaused` is false. Do not use `aria-live` for the moving rail.

- [ ] **Step 6: Add the home-only motion runtime**

Mount `HomeMotionRuntime` only from `src/app/page.tsx`. On `prefers-reduced-motion: reduce`, do not construct Lenis, ScrollTrigger, or reveal animations. Load `lenis`, `gsap`, and `gsap/ScrollTrigger` with dynamic imports inside the effect so no browser-only module is evaluated by the Server Component. Register ScrollTrigger, then create:

```ts
const lenis = new Lenis({
  autoRaf: false,
  anchors: true,
  prevent: (node) =>
    node instanceof HTMLElement && node.closest("[data-native-scroll]") !== null,
});
lenis.on("scroll", ScrollTrigger.update);
const update = (time: number) => lenis.raf(time * 1000);
gsap.ticker.add(update);
```

Use `gsap.context` for short 12–20px Hero/section reveals. CSS and SSR must render final visible content before enhancement; never set core content to opacity 0 in the stylesheet. A media-query change to reduced motion must run the same cleanup immediately. Cleanup must call `gsap.ticker.remove(update)`, `lenis.off("scroll", ScrollTrigger.update)`, context `revert()`, kill owned ScrollTriggers, remove diagnostic DOM attributes, and call `lenis.destroy()`.

- [ ] **Step 7: Run contracts, typecheck, and build**

```bash
corepack yarn node --test scripts/motion-contract.test.mjs
corepack yarn test:contracts
corepack yarn typecheck
corepack yarn lint
corepack yarn build
```

Expected: all commands exit 0; baseline warnings may remain, new warnings are not accepted.

- [ ] **Step 8: Commit Tasks 7–8 together if the home page was already dirty**

```bash
git diff -- src/app/page.tsx src/app/_components/home src/app/_components/category/PurposeCategoryNav.tsx src/components/patterns/MarqueeRail.client.tsx scripts/home-content-contract.test.mjs scripts/motion-contract.test.mjs package.json yarn.lock
git add src/app/_components/home src/components/patterns/MarqueeRail.client.tsx scripts/home-content-contract.test.mjs scripts/motion-contract.test.mjs yarn.lock
```

Stage `src/app/page.tsx`, `PurposeCategoryNav.tsx`, and `package.json` only after verifying their pre-existing changes. Commit the coherent slice with:

```bash
git commit -m "feat: redesign fmp home discovery flow"
```

---

## Task 9: Add Deterministic Browser, Accessibility, and No-JS Coverage

**Files:**

- Create: `playwright.config.ts`
- Create: `scripts/fixtures/home-api-server.mjs`
- Create: `tests/e2e/home-shell.spec.ts`
- Create: `tests/e2e/home-marquee.spec.ts`
- Create: `tests/e2e/home-accessibility.spec.ts`
- Create: `tests/e2e/__screenshots__/home-desktop.png`
- Create: `tests/e2e/__screenshots__/home-mobile.png`
- Modify: `package.json`
- Modify: `yarn.lock`

- [ ] **Step 1: Add the minimum browser test dependencies**

```bash
corepack yarn add --dev @playwright/test @axe-core/playwright
corepack yarn playwright install chromium
```

The Chromium download requires network access; request sandbox escalation at execution time rather than hiding a failed install.

- [ ] **Step 2: Create a deterministic public API fixture**

Run a local Node HTTP server on `127.0.0.1:4311`. It must provide:

- `GET /api/v1/posts` with SEARCHING, SEEN, and FOUND fixtures;
- `GET /api/v1/posts/nearby` with finite `lat`, `lng`, and `distanceKm` for SEARCHING and SEEN fixtures;
- `GET /api/v1/abandoned-animals` with OPEN records;
- `GET /api/v1/abandoned-animals/sido` with an empty data array;
- `GET /api/v1/user/me` with 401;
- `POST /__scenario` accepting only `default`, `one-source-fails`, `all-fail`, and `short`;
- no real credentials, hosts, or user identifiers.

Configure Playwright with one worker so scenario state cannot race. Start Next with:

```text
FMP_E2E=1 NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4311/api/v1
```

and app port `4310`.

In `homeFeed.server.ts`, use `cache: "no-store"` only when `process.env.FMP_E2E === "1"`; production keeps the 30-second and 1800-second revalidation settings. This prevents a scenario response from leaking into the next single-worker test through the Next fetch cache.

Use two `webServer` entries: one starts `node scripts/fixtures/home-api-server.mjs` on port 4311 and the second starts the env-configured Next server on port 4310. Every test file must reset the fixture with `POST /__scenario` to `default` in `beforeEach`, even when the test immediately selects another scenario.

- [ ] **Step 3: Write shell and progressive-enhancement tests first**

Tests must assert:

- the approved Hero heading and exact five category names;
- planned categories have no anchor;
- nav logo and four group links are keyboard reachable;
- search is a native GET form with `q`;
- the visible home/navigation copy does not contain the standalone label `FAQ`;
- with JavaScript disabled, Hero links, guide links, search form, and original marquee links remain present.

Run and confirm any missing contract fails before adjusting production code.

- [ ] **Step 4: Test marquee motion and stop behavior**

For an overflowing default fixture:

- one original and one `aria-hidden` duplicate exist after enhancement;
- duplicate links have `tabindex="-1"`;
- keyboard Tab reaches only original links and the pause control;
- transform changes while running;
- transform remains stable during hover, focus-within, and explicit pause;
- explicit resume restarts movement.

For `short`, assert no clone and no pause button. For `one-source-fails`, assert the successful source remains. For `all-fail`, assert the entire `새로 이어지는 소식` section is absent.

Grant geolocation only in the nearby-map test, set a deterministic coordinate, and assert no `/posts/nearby` request happens before the explicit location button click. After the click, assert SEARCHING and SEEN results appear in the parallel list, FOUND is absent, and denial in a separate context yields the permission error without a map.

- [ ] **Step 5: Test reduced motion and axe**

Use a reduced-motion context and assert one sequence, no changing transform, and no active Lenis marker. Run `AxeBuilder` on desktop and 390px mobile home and fail on serious or critical violations.

- [ ] **Step 6: Establish reviewed screenshots**

Set Playwright's `snapshotPathTemplate` to `{testDir}/__screenshots__/{arg}{ext}` so the approved files are platform-neutral.

```bash
corepack yarn playwright test tests/e2e/home-shell.spec.ts --update-snapshots
```

Inspect both PNGs before accepting them. Then run without update:

```bash
corepack yarn playwright test
```

Expected: PASS.

- [ ] **Step 7: Add scripts and commit the harness**

Merge into `package.json`:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:update": "playwright test --update-snapshots"
}
```

Then, if package hunks are separable:

```bash
git add playwright.config.ts scripts/fixtures/home-api-server.mjs tests/e2e package.json yarn.lock
git commit -m "test: cover fmp home accessibility and motion"
```

---

## Task 10: Final Verification, Design Status, and Product-Truth Sync

**Files:**

- Modify: `docs/superpowers/specs/2026-07-30-fmp-full-site-design-system-design.md`
- Modify only if required by sync: `../prd/find-my-pet/requirements.md`
- Modify only if required by sync: `../prd/find-my-pet/api-spec.md`
- Modify only if required by marketing sync: `../marketing/services/find-my-pet/feature-truth.md`
- Modify only in marketing full mode: `../marketing/reports/qc/find-my-pet-drift-20260730.md`

- [ ] **Step 1: Run the complete local gate**

```bash
corepack yarn test:contracts
corepack yarn typecheck
corepack yarn lint
corepack yarn test:e2e
corepack yarn build
```

Expected:

- all commands exit 0;
- category contract still reports 9 passing tests unless new tests were intentionally added to that file;
- no new lint warning beyond the five baseline warnings;
- build completes even when public API fetches fall back;
- no real API data is embedded in fixture or snapshot files.

- [ ] **Step 2: Perform manual browser review**

Review at 1440px, 1024px, 768px, and 390px:

- one-line desktop nav height is unchanged;
- mobile menu is one level deep and all targets are at least 44px;
- active category cards and planned items use exact copy;
- `상황별 반려동물 안내` links reach the intended anchor/article;
- marquee pauses on hover, focus, and button;
- keyboard-only order is logical;
- reduced motion is static;
- JS disabled retains the scoped static content;
- default home does not duplicate successful list API requests;
- FooterAd, legal links, auth actions, NotificationBell, filters, pagination, and registration gating still work.

- [ ] **Step 3: Compare build output and capture the implemented home**

Add post-implementation desktop/mobile captures beside the baseline or in a dated `after` directory. Record actual route size from the build output without claiming an improvement unless measured.

- [ ] **Step 4: Update the design spec status truthfully**

Update the stages independently. Mark Stage 1–2 implemented only after all code gates pass. Mark Stage 0 complete only if the full home/list/detail/register/MyPage desktop/mobile baseline exists; otherwise keep Stage 0 partial and name the unavailable route. Record the shipped map narrowly as an opt-in `/posts/nearby` map of public `SEARCHING | SEEN` posts. Leave the aggregate sighting/group/team map and Stage 3–6 pending.

- [ ] **Step 5: Run required PRD sync skills once**

Invoke `source-command-prd-sync` for this completed code work, using the project-level Find-My-Pet mapping even though the skill's older service table omits it. Because the homepage category presentation and guide hub alter public marketing feature presentation, immediately follow with `source-command-marketing-prd-sync` using `service=find-my-pet` and `mode=full`. Accept only facts supported by the code, and do not invent rollout or deployment status.

- [ ] **Step 6: Review the final diff and commit only owned changes**

```bash
git status --short
git diff --check
git diff --stat
git diff -- docs/superpowers/specs/2026-07-30-fmp-full-site-design-system-design.md
git -C ../prd status --short
git -C ../prd diff --check
git -C ../prd diff -- find-my-pet/requirements.md find-my-pet/api-spec.md
git -C ../marketing status --short
git -C ../marketing diff --check
git -C ../marketing diff -- services/find-my-pet/feature-truth.md reports/qc/find-my-pet-drift-20260730.md
```

These are three separate repositories. Commit verified changes in the repository that owns each file; do not attempt one cross-repository commit:

```bash
git add docs/superpowers/specs/2026-07-30-fmp-full-site-design-system-design.md
git commit -m "docs: sync fmp home design truth"
git -C ../prd add find-my-pet/requirements.md find-my-pet/api-spec.md
git -C ../prd commit -m "docs: sync find-my-pet home requirements"
git -C ../marketing add services/find-my-pet/feature-truth.md reports/qc/find-my-pet-drift-20260730.md
git -C ../marketing commit -m "docs: sync find-my-pet marketing truth"
```

- [ ] **Step 7: Report remaining work without overclaiming**

The completion report must separate:

- implemented Stage 0–2 code;
- five pre-existing lint warnings, if still present;
- any environment-only DNS warning;
- deferred Stage 3 list/detail/form migration;
- deferred MyPage collaboration UI;
- deferred authorized aggregate map and Phase 3 chat;
- any dirty user-owned paths left uncommitted.
