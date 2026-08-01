# Find My Pet Guide Content Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정적 `/posts` 자료실을 `/guide` 안내 체계로 이전하고, 화면·FAQ·구조화 데이터·연결 안내·검색 노출이 검증된 한 가지 사실 기준을 사용하도록 만든다.

**Architecture:** 외부 의존성이 없는 `src/content` 레지스트리가 허브 카드, FAQ, 실종 대응 단계를 소유하고, 검증된 MDX frontmatter와 본문은 `src/guides`가 소유한다. `/guide`, `/guide/[slug]`, `/faq`, 홈 카드는 같은 레지스트리를 서버에서 렌더링하며 sitemap·IndexNow도 같은 guide 집합을 사용한다. 사용자 실종 소식용 백엔드 `/posts` API, `/lost` 화면, `/rss.xml` 계약은 정적 자료 이전과 분리한다.

**Tech Stack:** Next.js 14.2.13 App Router, React 18 Server Components, TypeScript 5, Tailwind CSS 3.4, `next-mdx-remote` 6, `gray-matter`, `zod` 3.23, Node test runner, Playwright 1.62, axe-core.

## Global Constraints

- 공개 사용자 용어는 `반려동물 안내`, `상황별 반려동물 안내`, `실종 소식`, `보호 공고`, `입양`을 사용한다.
- `/lost`와 백엔드 `/api/v1/posts`, `/posts/nearby`, `/rss.xml`의 사용자 실종 소식 계약은 변경하지 않는다.
- 정적 이전 redirect는 승인된 네 경로만 `permanent: true`로 만들고, 알 수 없는 `/posts/*`는 404로 둔다.
- `/guide#수색`과 `/guide#전단지` 공개 anchor를 모두 보존한다.
- 허브 CTA는 정확히 `/register`, `/abandonment/region`, `/flyer`를 사용한다.
- 법정 보호 공고 `7일 이상`과 `공고일부터 10일 후 소유자를 알 수 없을 때 지자체 소유권 취득 가능`을 합치지 않는다.
- FMP `실종 소식 등록`을 지자체·동물보호센터의 공식 유실 신고로 표현하지 않는다.
- 보호 공고 `CLOSED`를 반환·입양·보호 종료 같은 최종 상태로 해석하지 않는다.
- 수색그룹·팀·제품 내 채팅·통합 지도는 현재 제공 기능으로 소개하지 않는다.
- 카카오톡 공유는 공개 실종 소식·보호 공고 링크 공유까지만 설명하고 수색그룹 초대 링크로 표현하지 않는다.
- 현재 알림은 목격 제보, 즐겨찾기한 소식의 상태 변경, 관심 지역의 새 보호 공고 범위만 설명한다.
- 데이터 갱신은 `약 1시간 주기로 동기화하며 외부 데이터 상황에 따라 늦어질 수 있음`으로 설명한다.
- `FOUND`에는 경과 경고, 탐색 범위, 장기 수색 전략, AI 후보, 새 목격 제보, 전단지 관리, 오픈채팅 같은 활성 수색 행동을 노출하지 않는다.
- 안내 본문은 16px/1.6 이상, 약 720–760px 읽기 폭, H1 하나, 44px 이상 주요 행동, 명확한 focus-visible 상태를 사용한다.
- 중요한 본문·링크·공식 출처는 JavaScript 없이도 읽을 수 있어야 한다.
- 새 런타임 의존성은 추가하지 않고 기존 디자인 토큰 `canvas`, `paper`, `raised`, `ink`, `forest`, `clay`를 사용한다.
- `.superpowers/`와 관련 없는 기존 변경은 건드리거나 stage하지 않는다.
- `gradle.properties`는 수정하지 않는다.
- 운영 배포와 미리보기 배포는 구현·검증이 끝난 뒤 실행 직전에 사용자 확인을 다시 받는다.
- 외부 IndexNow 제출 명령은 검증 중 실행하지 않고 `--dry-run --core-only`만 사용한다.
- 콘텐츠는 `content-ops` 10인 패널의 모든 개별 점수와 가중 평균이 각각 90점 이상일 때만 구현 완료로 취급한다.

---

## File Responsibility Map

### New files

- `src/content/contentTypes.ts` — guide·FAQ가 공유하는 공개 타입.
- `src/content/guideCatalog.ts` — 허브 카드와 홈 노출 guide 집합.
- `src/content/faq.ts` — FAQ 그룹, 기존 10개 ID, 답변·출처의 단일 기준.
- `src/content/lostGuide.ts` — 허브·상세·HowTo가 공유하는 실종 대응 단계.
- `src/guides/*.mdx` — 다섯 상세 안내 본문과 검증 가능한 metadata.
- `src/lib/parseGuide.ts` — MDX frontmatter 검증, 재귀 수집, slug 중복 검증.
- `src/app/guide/layout.tsx` — `/guide` 한 단계 로컬 탐색.
- `src/app/guide/_components/GuideMDX.tsx` — 접근 가능한 MDX 요소 매핑.
- `src/app/guide/_components/GuideCard.tsx` — 허브 카드의 단일 interactive element.
- `src/app/guide/_components/LostGuideSteps.tsx` — `LOST_GUIDE_STEPS` 화면 렌더러.
- `src/app/guide/[slug]/page.tsx` — 상세 metadata, Article/HowTo JSON-LD, 실제 404.
- `scripts/guide-content-contract.test.mjs` — route·registry·metadata·금지 문구 계약.
- `scripts/guide-context-copy-contract.test.mjs` — SEARCHING/FOUND·탐색 범위·AI·전단지 문구 계약.
- `scripts/guide-discovery-contract.test.mjs` — sitemap·IndexNow·RSS 경계 계약.
- `tests/e2e/guide-content.spec.ts` — redirect·404·H1·overflow·JS-off·axe 검증.
- `tests/e2e/lost-detail-and-flyer.spec.ts` — SEARCHING·FOUND·전단지 저장·선택 용지 검증.
- `docs/superpowers/reviews/2026-08-01-fmp-guide-content-panel.md` — content-ops 라운드와 최종 점수 기록.

### Modified files

- `scripts/test-utils/load-typescript-module.mjs` — 외부 모듈을 사용하는 TS parser 테스트 지원.
- `src/app/guide/page.tsx` — 장문 하드코딩 대신 안내 허브.
- `src/app/faq/page.tsx` — 그룹화된 레지스트리와 같은 FAQPage JSON-LD.
- `src/app/_components/home/SituationGuide.tsx` — guide catalog 기반 홈 카드.
- `scripts/home-content-contract.test.mjs`, `scripts/abandonment-status-contract.test.mjs` — 새 SSOT 경로와 집합 계약.
- `src/app/_components/lost/SearchRadiusMap.tsx` — 참고용 추정·도로망 fallback 설명.
- `src/app/_components/lost/LongTermGuideBlock.tsx` — 근거 없는 AI 효과 주장 제거.
- `src/lib/searchRadius.ts` — 확률·효과를 단정하는 단계 label을 중립적인 확인 순서로 교체.
- `src/app/register/page.tsx` — 비활성 AI 매칭 홍보를 식별 가능한 사진 안내로 교체.
- `src/app/(route)/lost/[id]/LostDetailClient.tsx` — 기본 비활성 AI 후보를 제거하고 `FOUND`에서 활성 수색 UI 차단.
- `src/app/flyer/page.tsx`, `src/app/flyer/FlyerStandaloneClient.tsx`, `src/app/_components/lost/FlyerPrintDialog.tsx` — 실제 저장·필수값·용지·개인정보 안내 일치.
- `src/app/(route)/abandonment/page.tsx`, `src/app/(route)/abandonment/region/page.tsx`, `src/app/(route)/abandonment/region/[sido]/[sigungu]/page.tsx`, `src/app/terms/page.tsx`, `src/app/privacy/page.tsx` — 국가동물보호정보시스템 명칭, FAQ 노출명과 동기화 표현 통일.
- `next.config.mjs` — 네 개의 exact permanent redirect.
- `src/app/sitemap.ts` — guide metadata 기반 URL·lastModified.
- `scripts/indexnow.mjs` — `src/guides/**/*.mdx`와 같은 guide 범위.
- `public/llms.txt` — 새 경로와 검증된 법·제품 사실.
- `tests/e2e/home-shell.spec.ts` — 새 홈 guide 링크.

### Removed after migration is green

- `src/app/posts/page.tsx`
- `src/app/posts/[...slug]/page.tsx`
- `src/app/posts/[...slug]/layout.tsx`
- `src/posts/cat-escape-reasons-and-solutions.mdx`
- `src/posts/dog-escape-while-walking.mdx`
- `src/posts/dog-missing-guide.mdx`
- `src/lib/parsePost.ts`
- `src/app/_components/CustomMDX.tsx`
- `src/lib/featuredGuides.ts`
- `src/app/guide/FlyerButton.tsx`
- `src/app/_components/Blockquote.tsx`
- `src/app/_components/CustomImage.tsx`
- `src/app/_components/Highlight.tsx`
- `src/app/_components/Link.tsx`
- `src/app/_components/lost/SimilarCandidatesSection.tsx` — 현재 계약으로 기능 비활성 상태와 실제 비교 0건을 구분할 수 없어 요청과 UI를 함께 제거한다.
- `src/static/image/posts_banner.jpg` — 제거된 정적 `/posts` 목록에서만 사용한 배너.
- `src/static/image/guide_5.png` — 실제 연락처가 포함된 낡은 화면 자료이며 새 UI에서 사용하지 않는다.

---

### Task 1: Guide metadata parser and executable contracts

**Files:**
- Create: `src/content/contentTypes.ts`
- Create: `src/lib/parseGuide.ts`
- Create: `scripts/guide-content-contract.test.mjs`
- Modify: `scripts/test-utils/load-typescript-module.mjs`

**Interfaces:**
- Produces: `GuideSlug`, `SourceLink`, `GuideMetadata`, `GuideArticle`.
- Produces: `parseGuideSource(source: string, sourcePath: string): GuideArticle`.
- Produces: `getAllGuides(): GuideArticle[]`, `getGuideBySlug(slug: string): GuideArticle | undefined`.

- [ ] **Step 1: Extend the TS test loader, then write failing parser tests**

```js
// scripts/test-utils/load-typescript-module.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);

export function loadTypeScriptModule(file, { mocks = {} } = {}) {
  const source = fs.readFileSync(file, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (specifier) =>
    Object.prototype.hasOwnProperty.call(mocks, specifier)
      ? mocks[specifier]
      : nodeRequire(specifier);
  new Function("module", "exports", "require", "__filename", "__dirname", output)(
    module,
    module.exports,
    localRequire,
    file,
    path.dirname(file),
  );
  return module.exports;
}
```

```js
// scripts/guide-content-contract.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadTypeScriptModule } from "./test-utils/load-typescript-module.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parser = () => {
  const contentTypes = loadTypeScriptModule(path.join(root, "src/content/contentTypes.ts"));
  return loadTypeScriptModule(path.join(root, "src/lib/parseGuide.ts"), {
    mocks: { "server-only": {}, "@/content/contentTypes": contentTypes },
  });
};

const valid = `---
title: "반려견 실종 첫날"
subtitle: "먼저 확인할 순서"
description: "실종 직후 확인할 행동을 정리합니다."
publishedAt: "2025-02-06"
updatedAt: "2026-08-01"
reviewedAt: "2026-08-01"
slug: "lost-dog"
sourceLinks:
  - label: "농림축산식품부 반려동물 유실 시 대응요령"
    url: "https://mafra.go.kr/bbs/home/796/571806/artclView.do"
---
## 찾은 뒤 확인할 일
`;

test("guide frontmatter accepts the approved metadata contract", () => {
  const guide = parser().parseGuideSource(valid, "/tmp/lost-dog.mdx");
  assert.equal(guide.slug, "lost-dog");
  assert.equal(guide.updatedAt, "2026-08-01");
});

test("guide frontmatter rejects an invalid date and half-defined thumbnail", () => {
  assert.throws(() =>
    parser().parseGuideSource(
      valid.replace('reviewedAt: "2026-08-01"', 'reviewedAt: "08/01/2026"'),
      "/tmp/lost-dog.mdx",
    ),
  );
  assert.throws(() =>
    parser().parseGuideSource(
      valid.replace('slug: "lost-dog"', 'slug: "lost-dog"\nthumbnail: "/dog.jpg"'),
      "/tmp/lost-dog.mdx",
    ),
  );
});

test("guide frontmatter rejects a slug that differs from its filename", () => {
  assert.throws(() => parser().parseGuideSource(valid, "/tmp/found-animal.mdx"));
});

test("guide collection rejects duplicate slugs from different paths", () => {
  const contentTypes = loadTypeScriptModule(path.join(root, "src/content/contentTypes.ts"));
  const duplicateParser = loadTypeScriptModule(path.join(root, "src/lib/parseGuide.ts"), {
    mocks: {
      "server-only": {},
      "@/content/contentTypes": contentTypes,
      "node:fs": { readFileSync: () => valid },
      glob: {
        sync: () => ["/tmp/one/lost-dog.mdx", "/tmp/two/lost-dog.mdx"],
      },
    },
  });

  assert.throws(() => duplicateParser.getAllGuides(), /duplicate guide slug: lost-dog/);
});
```

- [ ] **Step 2: Run the parser contract and confirm RED**

Run: `node --test scripts/guide-content-contract.test.mjs`

Expected: FAIL because `src/lib/parseGuide.ts` does not exist.

- [ ] **Step 3: Implement strict metadata types and parsing**

```ts
// src/content/contentTypes.ts
export const GUIDE_SLUGS = [
  "lost-dog",
  "dog-walk-safety",
  "cat-escape-prevention",
  "found-animal",
  "shelter-adoption",
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

export interface SourceLink {
  label: string;
  url: string;
}

export interface GuideMetadata {
  title: string;
  subtitle: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  reviewedAt: string;
  sourceLinks: readonly SourceLink[];
  slug: GuideSlug;
  thumbnail?: string;
  thumbnailAlt?: string;
}

export interface GuideArticle extends GuideMetadata {
  content: string;
  sourcePath: string;
}
```

```ts
// src/lib/parseGuide.ts
import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { sync } from "glob";
import { z } from "zod";
import { GUIDE_SLUGS, type GuideArticle } from "@/content/contentTypes";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}, "invalid calendar date");

const sourceLink = z.object({
  label: z.string().trim().min(1),
  url: z.string().url(),
});

export const guideMatterSchema = z
  .object({
    title: z.string().trim().min(1),
    subtitle: z.string().trim().min(1),
    description: z.string().trim().min(1),
    publishedAt: date,
    updatedAt: date,
    reviewedAt: date,
    sourceLinks: z.array(sourceLink).min(1),
    slug: z.enum(GUIDE_SLUGS),
    thumbnail: z.string().trim().min(1).optional(),
    thumbnailAlt: z.string().trim().min(1).optional(),
  })
  .superRefine((value, context) => {
    if (Boolean(value.thumbnail) !== Boolean(value.thumbnailAlt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "thumbnail and thumbnailAlt must be provided together",
      });
    }
  });

const GUIDES_PATH = path.join(process.cwd(), "src", "guides");

export function parseGuideSource(source: string, sourcePath: string): GuideArticle {
  const { content, data } = matter(source);
  const metadata = guideMatterSchema.parse(data);
  const fileSlug = path.basename(sourcePath, path.extname(sourcePath));
  if (metadata.slug !== fileSlug) {
    throw new Error(`guide slug ${metadata.slug} does not match filename ${fileSlug}`);
  }
  return { ...metadata, content, sourcePath };
}

export function getAllGuides(): GuideArticle[] {
  const guides = sync(path.join(GUIDES_PATH, "**", "*.mdx")).map((sourcePath) =>
    parseGuideSource(fs.readFileSync(sourcePath, "utf8"), sourcePath),
  );
  const slugs = new Set<string>();
  for (const guide of guides) {
    if (slugs.has(guide.slug)) throw new Error(`duplicate guide slug: ${guide.slug}`);
    slugs.add(guide.slug);
  }
  return guides.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return getAllGuides().find((guide) => guide.slug === slug);
}
```

- [ ] **Step 4: Run focused contracts and typecheck**

Run: `node --test scripts/guide-content-contract.test.mjs && corepack yarn typecheck`

Expected: parser tests PASS; typecheck PASS.

- [ ] **Step 5: Commit the parser foundation**

```bash
git add scripts/test-utils/load-typescript-module.mjs scripts/guide-content-contract.test.mjs src/content/contentTypes.ts src/lib/parseGuide.ts
git commit -m "feat: add validated guide content parser"
```

### Task 2: Content registries and legacy compatibility contracts

**Files:**
- Create: `src/content/guideCatalog.ts`
- Create: `src/content/faq.ts`
- Create: `src/content/lostGuide.ts`
- Modify: `scripts/guide-content-contract.test.mjs`

**Interfaces:**
- Consumes: `GuideSlug`, `SourceLink` from Task 1.
- Produces: `GUIDE_CATALOG`, `HOME_GUIDE_IDS`, `HOME_GUIDES`.
- Produces: `FAQ_GROUPS`, `FAQ_ENTRIES`, `FAQ_BY_ID`.
- Produces: `GUIDE_PRIMARY_ACTIONS`, `LOST_GUIDE_STEPS`, including optional `legacyAnchor`.

- [ ] **Step 1: Add failing registry tests**

```js
const loadContent = (name) =>
  loadTypeScriptModule(path.join(root, `src/content/${name}.ts`));

test("guide catalog exposes the six approved situations and three exact CTAs", () => {
  const { GUIDE_CATALOG } = loadContent("guideCatalog");
  assert.deepEqual(
    GUIDE_CATALOG.map(({ id, href }) => [id, href]),
    [
      ["lost-first-steps", "/guide/lost-dog"],
      ["found-animal", "/guide/found-animal"],
      ["shelter-return", "/faq#shelter-return"],
      ["shelter-adoption", "/guide/shelter-adoption"],
      ["dog-walk-safety", "/guide/dog-walk-safety"],
      ["cat-escape-prevention", "/guide/cat-escape-prevention"],
    ],
  );
});

test("lost guide keeps both public anchors and exact action destinations", () => {
  const { GUIDE_PRIMARY_ACTIONS, LOST_GUIDE_STEPS } = loadContent("lostGuide");
  assert.deepEqual(
    LOST_GUIDE_STEPS.flatMap((step) => step.legacyAnchor ?? []),
    ["수색", "전단지"],
  );
  assert.deepEqual(GUIDE_PRIMARY_ACTIONS.map(({ href }) => href), [
    "/register", "/abandonment/region", "/flyer",
  ]);
});

test("FAQ preserves ten public ids while grouping by situation", () => {
  const { FAQ_ENTRIES, FAQ_GROUPS } = loadContent("faq");
  const expectedGroups = [
    {
      id: "lost-or-found",
      entryIds: ["shelter-check", "missing-report", "found-animal-report", "search-radius"],
    },
    {
      id: "shelter-return",
      entryIds: ["shelter-return", "notice-period", "after-notice"],
    },
    {
      id: "adoption-and-registration",
      entryIds: ["adoption-process", "animal-registration"],
    },
    { id: "product-data", entryIds: ["data-source"] },
  ];
  assert.deepEqual(
    FAQ_GROUPS.map(({ id, entryIds }) => ({ id, entryIds: [...entryIds] })),
    expectedGroups,
  );

  const flattenedIds = FAQ_GROUPS.flatMap(({ entryIds }) => entryIds);
  const entryIds = FAQ_ENTRIES.map(({ id }) => id);
  assert.equal(FAQ_ENTRIES.length, 10);
  assert.equal(new Set(flattenedIds).size, flattenedIds.length);
  assert.deepEqual(new Set(flattenedIds), new Set(entryIds));

  const expectedGroupByEntry = new Map(
    expectedGroups.flatMap(({ id, entryIds }) => entryIds.map((entryId) => [entryId, id])),
  );
  for (const entry of FAQ_ENTRIES) {
    assert.equal(entry.groupId, expectedGroupByEntry.get(entry.id));
  }
});

test("public copy rejects known unsafe or false claims", () => {
  const modules = ["guideCatalog", "faq", "lostGuide"].map(loadContent);
  const text = JSON.stringify(modules);
  for (const forbidden of [
    "공고 후 10일",
    "119에 신고",
    "반환 확률이 크게",
    "2주 이상 경과 시 사진 기반 자동 매칭",
  ]) assert.equal(text.includes(forbidden), false, forbidden);
});
```

- [ ] **Step 2: Run registry contracts and confirm RED**

Run: `node --test scripts/guide-content-contract.test.mjs`

Expected: FAIL because the three registry modules do not exist.

- [ ] **Step 3: Implement the guide catalog**

```ts
// src/content/guideCatalog.ts
import type { GuideSlug } from "./contentTypes";

export type GuideCardId =
  | "lost-first-steps"
  | "found-animal"
  | "shelter-return"
  | "shelter-adoption"
  | "dog-walk-safety"
  | "cat-escape-prevention";

export interface GuideCard {
  id: GuideCardId;
  title: string;
  description: string;
  href: `/guide/${GuideSlug}` | "/faq#shelter-return";
  linkLabel: string;
  reviewedAt: "2026-08-01";
}

export const GUIDE_CATALOG: readonly GuideCard[] = [
  { id: "lost-first-steps", title: "반려동물을 잃어버렸을 때", description: "주변 확인부터 공식 신고, 보호 공고 확인과 공유까지 먼저 할 일을 순서대로 봅니다.", href: "/guide/lost-dog", linkLabel: "첫 행동 순서 보기", reviewedAt: "2026-08-01" },
  { id: "found-animal", title: "길에서 헤매는 동물을 발견했을 때", description: "사람과 동물의 안전을 먼저 살피고 관할 지자체나 보호센터에 알리는 방법을 봅니다.", href: "/guide/found-animal", linkLabel: "신고·인계 순서 보기", reviewedAt: "2026-08-01" },
  { id: "shelter-return", title: "보호소에서 내 아이를 찾았을 때", description: "보호자 확인 자료와 반환 비용처럼 방문 전에 확인할 내용을 정리했습니다.", href: "/faq#shelter-return", linkLabel: "반환 절차 보기", reviewedAt: "2026-08-01" },
  { id: "shelter-adoption", title: "보호소 입양을 준비할 때", description: "입양 가능 여부 확인부터 상담·교육·돌봄 계획까지 일반적인 순서를 살펴봅니다.", href: "/guide/shelter-adoption", linkLabel: "입양 준비 순서 보기", reviewedAt: "2026-08-01" },
  { id: "dog-walk-safety", title: "산책 중 이탈을 예방할 때", description: "산책 전 장비, 주변 자극, 보호자 연락처를 차분히 점검합니다.", href: "/guide/dog-walk-safety", linkLabel: "산책 안전 점검 보기", reviewedAt: "2026-08-01" },
  { id: "cat-escape-prevention", title: "고양이의 탈출을 예방할 때", description: "문·창문과 이동장, 생활 환경을 확인하고 탈출 직후 가까운 곳부터 살펴봅니다.", href: "/guide/cat-escape-prevention", linkLabel: "생활 환경 점검 보기", reviewedAt: "2026-08-01" },
];

export const HOME_GUIDE_IDS: readonly GuideCardId[] = [
  "lost-first-steps",
  "shelter-return",
  "shelter-adoption",
  "dog-walk-safety",
];

export const HOME_GUIDES = HOME_GUIDE_IDS.map((id) => {
  const guide = GUIDE_CATALOG.find((item) => item.id === id);
  if (!guide) throw new Error(`missing home guide: ${id}`);
  return guide;
});
```

- [ ] **Step 4: Implement the shared lost-guide steps**

```ts
// src/content/lostGuide.ts
import type { SourceLink } from "./contentTypes";

export interface GuideAction { label: string; href: "/register" | "/abandonment/region" | "/flyer" }
export interface LostGuideStep {
  id: "search-nearby" | "official-report" | "check-notices" | "share-news" | "make-flyer" | "close-search";
  legacyAnchor?: "수색" | "전단지";
  title: string;
  summary: string;
  detail: string;
  actions: readonly GuideAction[];
  sourceLinks: readonly SourceLink[];
}

const MAFRA = { label: "농림축산식품부 반려동물 유실 시 대응요령", url: "https://mafra.go.kr/bbs/home/796/571806/artclView.do" } as const;
const PUBLIC = { label: "국가동물보호정보시스템 보호동물", url: "https://www.animal.go.kr/front/awtis/public/publicList.do?menuNo=1000000055" } as const;
const CENTERS = { label: "국가동물보호정보시스템 동물보호센터 안내", url: "https://www.animal.go.kr/front/awtis/institution/institutionList.do?menuNo=1000000059" } as const;
const DEPARTMENTS = { label: "국가동물보호정보시스템 지자체 담당부서 안내", url: "https://www.animal.go.kr/front/awtis/relevant/relevantList.do?menuNo=5000000014" } as const;

export const GUIDE_PRIMARY_ACTIONS: readonly GuideAction[] = [
  { label: "실종 소식 등록", href: "/register" },
  { label: "보호 공고 확인", href: "/abandonment/region" },
  { label: "전단지 만들기", href: "/flyer" },
];

export const LOST_GUIDE_STEPS: readonly LostGuideStep[] = [
  { id: "search-nearby", legacyAnchor: "수색", title: "마지막으로 본 곳 주변을 먼저 확인하세요", summary: "차량 아래, 건물 틈, 익숙한 산책길처럼 바로 숨거나 지나갈 수 있는 곳을 차분히 살펴봅니다.", detail: "여러 사람이 큰 소리로 뒤쫓기보다 마지막 목격 위치와 이동 방향을 기록하고, 안전한 거리에서 이름을 불러 반응을 확인하세요. 도로처럼 즉시 위험한 상황이면 사람의 안전을 해치지 않는 범위에서 관계 기관에 도움을 요청하세요.", actions: [], sourceLinks: [MAFRA] },
  { id: "official-report", title: "관할 지자체와 동물보호센터에 유실 사실을 알리세요", summary: "FMP 소식 등록과 별도로 공식 연락처에 유실 사실과 특징을 전달합니다.", detail: "실종 장소, 시간, 종·품종, 색과 특징, 동물등록번호, 연락 가능한 번호를 준비하세요. 지역 담당부서와 인근 보호센터 양쪽에 확인하면 인계 여부를 더 빠르게 대조할 수 있습니다.", actions: [], sourceLinks: [CENTERS, DEPARTMENTS] },
  { id: "check-notices", title: "보호 공고를 주변 지역까지 반복 확인하세요", summary: "실종 지역과 인접 시군구의 새 보호 공고를 사진과 특징으로 비교합니다.", detail: "공고 종료 표시는 반환이나 입양 같은 최종 상태를 뜻하지 않습니다. 닮은 동물을 찾으면 해당 보호소에 현재 상태와 확인 방법을 직접 문의하세요.", actions: [GUIDE_PRIMARY_ACTIONS[1]], sourceLinks: [PUBLIC] },
  { id: "share-news", title: "공개 실종 소식을 등록하고 링크를 공유하세요", summary: "최근 사진, 마지막 위치·시간, 눈에 띄는 특징과 안전한 연락 방법을 적습니다.", detail: "FMP 실종 소식은 이웃의 목격 제보를 받기 위한 공개 정보이며 공식 유실 신고를 대신하지 않습니다. 상세 주소나 불필요한 개인정보는 공개하지 마세요.", actions: [GUIDE_PRIMARY_ACTIONS[0]], sourceLinks: [] },
  { id: "make-flyer", legacyAnchor: "전단지", title: "필요한 정보만 담아 전단지를 준비하세요", summary: "식별하기 쉬운 사진, 실종 장소·시간, 특징, 연락 방법을 크게 보이게 적습니다.", detail: "부착 전 시설이나 관리자의 허가를 확인하고, 공개 연락처 범위를 정하세요. 인쇄할 때 선택한 용지와 배율을 다시 확인하세요.", actions: [GUIDE_PRIMARY_ACTIONS[2]], sourceLinks: [] },
  { id: "close-search", title: "다시 만났다면 소식을 종료하세요", summary: "진행 중 표시를 끝내고 도움을 준 사람에게 상황을 알립니다.", detail: "건강 상태나 행동 변화가 걱정되면 수의사에게 확인하고, 동물등록 연락처와 산책 장비·출입문 환경도 함께 점검하세요.", actions: [], sourceLinks: [] },
];
```

- [ ] **Step 5: Implement grouped FAQ data with all ten entries**

Create `src/content/faq.ts` as a dependency-free data module. Use these exact group memberships and fields:

```ts
import type { SourceLink } from "./contentTypes";

export type FaqId = "shelter-check" | "missing-report" | "found-animal-report" | "search-radius" | "shelter-return" | "notice-period" | "after-notice" | "adoption-process" | "animal-registration" | "data-source";
export type FaqGroupId = "lost-or-found" | "shelter-return" | "adoption-and-registration" | "product-data";
interface ActionLink { href: string; label: string }
export interface FaqEntry { id: FaqId; groupId: FaqGroupId; q: string; a: string; reviewedAt: "2026-08-01"; actionLinks: readonly ActionLink[]; sourceLinks: readonly SourceLink[] }

const PUBLIC = { label: "국가동물보호정보시스템 보호동물", url: "https://www.animal.go.kr/front/awtis/public/publicList.do?menuNo=1000000055" } as const;
const CENTERS = { label: "국가동물보호정보시스템 동물보호센터 안내", url: "https://www.animal.go.kr/front/awtis/institution/institutionList.do?menuNo=1000000059" } as const;
const DEPARTMENTS = { label: "국가동물보호정보시스템 지자체 담당부서 안내", url: "https://www.animal.go.kr/front/awtis/relevant/relevantList.do?menuNo=5000000014" } as const;
const LAW = { label: "국가법령정보센터 동물보호법", url: "https://www.law.go.kr/법령/동물보호법" } as const;

export const FAQ_ENTRIES: readonly FaqEntry[] = [
  { id: "shelter-check", groupId: "lost-or-found", q: "잃어버린 반려동물이 보호소에 있는지 어떻게 확인하나요?", a: "국가동물보호정보시스템과 FMP 지역별 보호 공고에서 실종 지역과 인접 시군구를 함께 확인하세요. 닮은 동물을 찾으면 공고 상태만으로 판단하지 말고 보호소에 직접 연락해 현재 상태와 확인 방법을 물어보세요.", reviewedAt: "2026-08-01", actionLinks: [{ href: "/abandonment/region", label: "지역별 보호 공고 확인" }, { href: "/guide/lost-dog", label: "실종 첫날 순서 보기" }], sourceLinks: [PUBLIC, CENTERS] },
  { id: "missing-report", groupId: "lost-or-found", q: "실종 사실은 어디에 알려야 하나요?", a: "관할 지자체 동물보호 담당부서와 인근 동물보호센터에 유실 사실을 알리세요. FMP 실종 소식 등록은 이웃의 목격 제보를 받는 공개 공유 기능이며 공식 유실 신고를 대신하지 않습니다.", reviewedAt: "2026-08-01", actionLinks: [{ href: "/register", label: "실종 소식 등록" }], sourceLinks: [CENTERS, DEPARTMENTS] },
  { id: "found-animal-report", groupId: "lost-or-found", q: "길에서 헤매는 동물을 발견하면 어떻게 해야 하나요?", a: "먼저 사람과 동물의 안전을 확인하고, 무리하게 붙잡지 말고 관할 지자체나 동물보호센터에 연락하세요. 목줄이나 인식표는 안전하게 확인할 수 있을 때만 살펴보고, 판매하거나 임의로 소유하지 마세요.", reviewedAt: "2026-08-01", actionLinks: [{ href: "/guide/found-animal", label: "발견 동물 신고·인계 순서 보기" }, { href: "/lost", label: "공개 실종 소식 확인" }], sourceLinks: [CENTERS, DEPARTMENTS] },
  { id: "search-radius", groupId: "lost-or-found", q: "탐색 범위 지도는 실제 위치를 보여주나요?", a: "아니요. 종·품종·경과시간을 바탕으로 확인 순서를 돕는 참고용 추정치입니다. 개는 도로망 도달 영역을 우선 계산하지만 실패하면 원형으로 표시할 수 있고, 고양이·기타는 원형 참고 범위를 사용합니다. 개체 성향, 지형, 목격 정보와 보호 공고를 함께 확인하세요.", reviewedAt: "2026-08-01", actionLinks: [{ href: "/guide#수색", label: "수색 순서 보기" }], sourceLinks: [] },
  { id: "shelter-return", groupId: "shelter-return", q: "보호소에서 내 반려동물을 찾았어요. 바로 데려올 수 있나요?", a: "소유자임을 확인한 뒤 반환받을 수 있습니다. 신분증과 동물등록 정보, 함께 찍은 사진, 특징 설명을 준비해 보호소에 먼저 연락하세요. 보호 비용은 지역 조례와 실제 보호 상황에 따라 청구될 수 있습니다.", reviewedAt: "2026-08-01", actionLinks: [], sourceLinks: [LAW, CENTERS] },
  { id: "notice-period", groupId: "shelter-return", q: "보호 공고 기간은 얼마나 되나요?", a: "법정 보호 공고는 7일 이상입니다. 이 기간과 소유권 기준은 다르며, 공고일부터 10일이 지나도 소유자등을 알 수 없을 때 지방자치단체가 소유권을 취득할 수 있습니다.", reviewedAt: "2026-08-01", actionLinks: [], sourceLinks: [LAW] },
  { id: "after-notice", groupId: "shelter-return", q: "보호 공고가 끝나면 곧바로 입양할 수 있나요?", a: "아니요. 공고 종료는 반환·입양·보호 종료 같은 최종 상태를 뜻하지 않습니다. 입양을 생각하고 있다면 보호소에 현재 상태, 지자체의 소유권 취득 여부, 신청 가능 시점을 직접 확인하세요.", reviewedAt: "2026-08-01", actionLinks: [{ href: "/guide/shelter-adoption", label: "보호소 입양 준비 보기" }], sourceLinks: [LAW, CENTERS] },
  { id: "adoption-process", groupId: "adoption-and-registration", q: "보호소 입양은 어떤 순서로 진행되나요?", a: "먼저 보호소에 현재 상태와 입양 신청 가능 시점을 확인하세요. 신청서, 상담, 교육, 방문과 지원 제도는 보호소와 지자체마다 다를 수 있으므로 필요한 서류와 일정을 해당 기관에 물어봐야 합니다. FMP는 입양 신청을 받지 않습니다.", reviewedAt: "2026-08-01", actionLinks: [{ href: "/guide/shelter-adoption", label: "입양 준비 순서 보기" }, { href: "/abandonment/region", label: "지역별 보호 공고 확인" }], sourceLinks: [CENTERS, DEPARTMENTS] },
  { id: "animal-registration", groupId: "adoption-and-registration", q: "동물등록은 의무인가요?", a: "주택·준주택 또는 그 밖의 장소에서 반려 목적으로 기르는 2개월령 이상 개는 등록 대상입니다. 소유자나 주소·연락처가 바뀌면 변경 신고도 확인하세요. 고양이를 같은 의무 대상으로 단정해서는 안 됩니다.", reviewedAt: "2026-08-01", actionLinks: [], sourceLinks: [LAW] },
  { id: "data-source", groupId: "product-data", q: "FMP의 보호 공고 데이터는 어디에서 오나요?", a: "국가동물보호정보시스템 공공데이터를 약 1시간 주기로 동기화하며 외부 데이터 상황에 따라 늦어질 수 있습니다. 목록은 진행 중인 공고를 기본으로 보여주고 종료 공고는 별도로 구분하지만, 공고 종료가 동물의 최종 상태를 뜻하지 않으므로 현재 상태는 보호소에 확인하세요.", reviewedAt: "2026-08-01", actionLinks: [{ href: "/abandonment/region", label: "지역별 보호 공고 확인" }], sourceLinks: [PUBLIC] },
];

export const FAQ_GROUPS = [
  { id: "lost-or-found", title: "잃어버렸거나 발견했어요", entryIds: ["shelter-check", "missing-report", "found-animal-report", "search-radius"] },
  { id: "shelter-return", title: "보호소에서 내 아이를 찾았어요", entryIds: ["shelter-return", "notice-period", "after-notice"] },
  { id: "adoption-and-registration", title: "입양·등록을 준비해요", entryIds: ["adoption-process", "animal-registration"] },
  { id: "product-data", title: "파인드마이펫 데이터가 궁금해요", entryIds: ["data-source"] },
] as const;

export const FAQ_BY_ID = Object.fromEntries(FAQ_ENTRIES.map((entry) => [entry.id, entry])) as Record<FaqId, FaqEntry>;
```

- [ ] **Step 6: Run registry contracts and typecheck**

Run: `node --test scripts/guide-content-contract.test.mjs && corepack yarn typecheck`

Expected: PASS.

- [ ] **Step 7: Commit the content registries**

```bash
git add src/content/guideCatalog.ts src/content/faq.ts src/content/lostGuide.ts scripts/guide-content-contract.test.mjs
git commit -m "feat: centralize guide and faq content"
```

### Task 3: Verified MDX drafts and source record

**Files:**
- Create: `src/guides/lost-dog.mdx`
- Create: `src/guides/dog-walk-safety.mdx`
- Create: `src/guides/cat-escape-prevention.mdx`
- Create: `src/guides/found-animal.mdx`
- Create: `src/guides/shelter-adoption.mdx`
- Create: `docs/superpowers/reviews/2026-08-01-fmp-guide-content-panel.md`
- Modify: `src/content/faq.ts`
- Modify: `src/content/lostGuide.ts`
- Modify: `scripts/guide-content-contract.test.mjs`

**Interfaces:**
- Consumes: parser and registries from Tasks 1–2.
- Produces: five build-valid `GuideArticle` records and an official-source verification record that the final full-package panel will consume.

- [ ] **Step 1: Re-open the five official sources before changing copy**

Verify only the official MAFRA, Animal.go.kr center/public/department pages, and current law.go.kr Animal Protection Act URLs listed in the design. Record the page title, URL, verified date `2026-08-01`, and any access failure in the review document. An access or factual verification failure holds publication even though runtime rendering does not depend on the source being online. Do not copy more than a short necessary phrase from any source.

- [ ] **Step 2: Add failing real-content metadata and body contracts**

```js
test("all five approved guide files parse and have visible article sections", () => {
  const { getAllGuides } = parser();
  const guides = getAllGuides();
  const requiredSections = {
    "lost-dog": ["수색할 때 함께 확인할 점", "다시 만난 뒤"],
    "dog-walk-safety": ["나가기 전 장비 점검", "산책 환경과 자극 살피기", "평소에 준비할 정보"],
    "cat-escape-prevention": ["문과 창문부터 점검하기", "이동과 방문 상황 준비하기", "밖으로 나갔다면 가까운 곳부터 확인하기"],
    "found-animal": ["먼저 안전을 확인하세요", "관할 기관에 알리세요", "보호자를 찾을 때 지킬 점"],
    "shelter-adoption": ["입양 가능 상태부터 확인하세요", "상담 전에 생활 계획을 세워보세요", "보호소별 절차를 확인하세요", "함께 살기 시작한 뒤"],
  };
  assert.deepEqual(new Set(guides.map(({ slug }) => slug)), new Set([
    "lost-dog", "dog-walk-safety", "cat-escape-prevention", "found-animal", "shelter-adoption",
  ]));
  for (const guide of guides) {
    assert.match(guide.content, /^##\s/m);
    assert.doesNotMatch(guide.content, /^#\s/m, `${guide.slug} body must not add another H1`);
    assert.ok(guide.sourceLinks.length > 0);
    for (const section of requiredSections[guide.slug]) {
      assert.match(guide.content, new RegExp(`^##\\s+${section}$`, "m"));
    }
  }
});

```

- [ ] **Step 3: Run the content contract and confirm RED**

Run: `node --test scripts/guide-content-contract.test.mjs`

Expected: FAIL because `src/guides` is not populated.

- [ ] **Step 4: Write the five MDX files with exact metadata and section contracts**

Use these metadata values:

| file | publishedAt | updatedAt | reviewedAt | required sections |
|---|---|---|---|---|
| `lost-dog.mdx` | `2025-02-06` | `2026-08-01` | `2026-08-01` | `수색할 때 함께 확인할 점`, `다시 만난 뒤` |
| `dog-walk-safety.mdx` | `2025-02-06` | `2026-08-01` | `2026-08-01` | `나가기 전 장비 점검`, `산책 환경과 자극 살피기`, `평소에 준비할 정보` |
| `cat-escape-prevention.mdx` | `2025-02-09` | `2026-08-01` | `2026-08-01` | `문과 창문부터 점검하기`, `이동과 방문 상황 준비하기`, `밖으로 나갔다면 가까운 곳부터 확인하기` |
| `found-animal.mdx` | `2026-08-01` | `2026-08-01` | `2026-08-01` | `먼저 안전을 확인하세요`, `관할 기관에 알리세요`, `보호자를 찾을 때 지킬 점` |
| `shelter-adoption.mdx` | `2026-08-01` | `2026-08-01` | `2026-08-01` | `입양 가능 상태부터 확인하세요`, `상담 전에 생활 계획을 세워보세요`, `보호소별 절차를 확인하세요`, `함께 살기 시작한 뒤` |

Use these complete frontmatter blocks; the panel may refine title/description wording without changing the slug, dates, meaning or source set:

```yaml
# lost-dog.mdx
title: "반려견을 잃어버린 첫날, 먼저 할 일"
subtitle: "주변 확인부터 공식 신고와 보호 공고 확인까지"
description: "반려견 실종 직후 주변을 확인하고 관할 기관에 알린 뒤 보호 공고와 공개 실종 소식을 함께 확인하는 순서입니다."
publishedAt: "2025-02-06"
updatedAt: "2026-08-01"
reviewedAt: "2026-08-01"
slug: "lost-dog"
sourceLinks:
  - label: "농림축산식품부 반려동물 유실 시 대응요령"
    url: "https://mafra.go.kr/bbs/home/796/571806/artclView.do"
  - label: "국가동물보호정보시스템 동물보호센터 안내"
    url: "https://www.animal.go.kr/front/awtis/institution/institutionList.do?menuNo=1000000059"

# dog-walk-safety.mdx
title: "반려견 산책 중 이탈을 예방하는 점검"
subtitle: "장비와 환경, 연락 정보를 나가기 전에 확인해요"
description: "반려견과 산책하기 전 하네스·리드줄과 주변 자극, 동물등록 연락처를 차분히 점검하는 방법입니다."
publishedAt: "2025-02-06"
updatedAt: "2026-08-01"
reviewedAt: "2026-08-01"
slug: "dog-walk-safety"
sourceLinks:
  - label: "국가법령정보센터 동물보호법"
    url: "https://www.law.go.kr/법령/동물보호법"

# cat-escape-prevention.mdx
title: "고양이 탈출을 예방하는 생활 환경 점검"
subtitle: "문·창문과 이동 상황을 살피고 가까운 곳부터 확인해요"
description: "고양이가 밖으로 나갈 수 있는 문과 창문, 이동장과 방문 상황을 점검하고 탈출 직후 확인할 순서를 정리합니다."
publishedAt: "2025-02-09"
updatedAt: "2026-08-01"
reviewedAt: "2026-08-01"
slug: "cat-escape-prevention"
sourceLinks:
  - label: "농림축산식품부 반려동물 유실 시 대응요령"
    url: "https://mafra.go.kr/bbs/home/796/571806/artclView.do"

# found-animal.mdx
title: "길에서 헤매는 동물을 발견했을 때"
subtitle: "안전을 먼저 살피고 관할 기관에 알리는 순서"
description: "길에서 헤매는 동물을 발견했을 때 무리한 접촉을 피하고 관할 지자체나 동물보호센터에 신고·인계하는 방법입니다."
publishedAt: "2026-08-01"
updatedAt: "2026-08-01"
reviewedAt: "2026-08-01"
slug: "found-animal"
sourceLinks:
  - label: "국가동물보호정보시스템 동물보호센터 안내"
    url: "https://www.animal.go.kr/front/awtis/institution/institutionList.do?menuNo=1000000059"
  - label: "국가동물보호정보시스템 지자체 담당부서 안내"
    url: "https://www.animal.go.kr/front/awtis/relevant/relevantList.do?menuNo=5000000014"

# shelter-adoption.mdx
title: "보호소 입양을 준비하는 방법과 일반 절차"
subtitle: "입양 가능 상태와 보호소별 상담·신청 절차를 확인해요"
description: "보호소 입양 전 현재 상태와 신청 가능 시점을 확인하고 가족·주거·비용·돌봄 계획을 준비하는 일반적인 순서입니다."
publishedAt: "2026-08-01"
updatedAt: "2026-08-01"
reviewedAt: "2026-08-01"
slug: "shelter-adoption"
sourceLinks:
  - label: "국가동물보호정보시스템 보호동물"
    url: "https://www.animal.go.kr/front/awtis/public/publicList.do?menuNo=1000000055"
  - label: "국가동물보호정보시스템 동물보호센터 안내"
    url: "https://www.animal.go.kr/front/awtis/institution/institutionList.do?menuNo=1000000059"
  - label: "국가법령정보센터 동물보호법"
    url: "https://www.law.go.kr/법령/동물보호법"
```

Wrap each block in `---` delimiters in its own file. Omit image fields because the existing assets have no recorded provenance, and end with a relevant FMP action link. The body must directly state these boundaries:

```md
- FMP의 실종 소식 등록은 관할 지자체·동물보호센터의 공식 유실 신고를 대신하지 않습니다.
- 보호 공고 종료만으로 반환·입양·보호 종료를 판단할 수 없습니다.
- 낯선 동물을 무리하게 붙잡지 말고 사람과 동물의 안전을 먼저 확인하세요.
- 보호소 입양 신청 가능 시점과 서류·상담·교육 절차는 기관마다 다를 수 있습니다.
- AirTag는 주변 기기 네트워크를 이용하는 보조 수단이며 GPS 위치 추적기와 같은 방식이 아닙니다.
```

- [ ] **Step 5: Record source verification and run content contracts**

Add a `Verified sources` section to `docs/superpowers/reviews/2026-08-01-fmp-guide-content-panel.md` containing each official page title, URL, `2026-08-01` verification date, and access result. State that the scored panel runs only after all connected copy is implemented in Task 11.

Run: `node --test scripts/guide-content-contract.test.mjs && corepack yarn typecheck && git diff --check`

Expected: PASS with five guide records and no unsafe phrase match.

- [ ] **Step 6: Commit the verified draft package**

```bash
git add src/content/faq.ts src/content/lostGuide.ts src/guides docs/superpowers/reviews/2026-08-01-fmp-guide-content-panel.md scripts/guide-content-contract.test.mjs
git commit -m "content: add verified pet guide drafts"
```

### Task 4: Guide hub and one-level navigation

**Files:**
- Create: `src/app/guide/layout.tsx`
- Create: `src/app/guide/_components/GuideCard.tsx`
- Create: `src/app/guide/_components/LostGuideSteps.tsx`
- Modify: `src/app/guide/page.tsx`
- Modify: `scripts/guide-content-contract.test.mjs`

**Interfaces:**
- Consumes: `GUIDE_CATALOG`, `GUIDE_PRIMARY_ACTIONS`, `LOST_GUIDE_STEPS`.
- Produces: server-rendered `/guide` and `CollectionPage.mainEntity` from the displayed cards.

- [ ] **Step 1: Add failing hub source contracts**

```js
test("guide hub renders catalog, shared steps, legacy anchors and CollectionPage", () => {
  const page = fs.readFileSync(path.join(root, "src/app/guide/page.tsx"), "utf8");
  const steps = fs.readFileSync(path.join(root, "src/app/guide/_components/LostGuideSteps.tsx"), "utf8");
  assert.match(page, /GUIDE_CATALOG\.map/);
  assert.match(page, /GUIDE_PRIMARY_ACTIONS\.map/);
  assert.match(page, /LostGuideSteps/);
  assert.match(steps, /LOST_GUIDE_STEPS\.map/);
  assert.match(page, /CollectionPage/);
  assert.match(page, /ItemList/);
  assert.match(page, /반려동물과 함께할 때 필요한 안내/);
  assert.match(steps, /id=\{step\.legacyAnchor\}/);
  assert.doesNotMatch(page, /guide_[234589]|guide\.jpg/);
});
```

- [ ] **Step 2: Run the focused contract and confirm RED**

Run: `node --test scripts/guide-content-contract.test.mjs`

Expected: FAIL because the old hardcoded guide does not consume either registry.

- [ ] **Step 3: Implement the one-level layout and reusable card**

```tsx
// src/app/guide/layout.tsx
import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/guide#lost-now", label: "잃어버렸을 때" },
  { href: "/faq", label: "상황별 질문" },
  { href: "/guide#guide-list", label: "안내 글 모아보기" },
] as const;

export default function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <nav aria-label="반려동물 안내" className="flex flex-wrap gap-2 border-b border-border pb-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
```

```tsx
// src/app/guide/_components/GuideCard.tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { GuideCard as GuideCardData } from "@/content/guideCatalog";

export function GuideCard({ guide }: { guide: GuideCardData }) {
  return (
    <li className="rounded-3xl bg-surface-paper p-6 shadow-raised">
      <h3 className="font-editorial text-xl font-semibold text-ink">{guide.title}</h3>
      <p className="mt-3 text-base leading-7 text-ink/70">{guide.description}</p>
      <Link href={guide.href} className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-forest underline decoration-forest/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
        {guide.linkLabel}<ArrowUpRight aria-hidden className="size-4" />
      </Link>
    </li>
  );
}
```

Implement this exact component interface so the hub and detail cannot invent a second step array:

```tsx
// src/app/guide/_components/LostGuideSteps.tsx
import Link from "next/link";
import { LOST_GUIDE_STEPS } from "@/content/lostGuide";

export function LostGuideSteps({ mode }: { mode: "summary" | "detail" }) {
  return (
    <ol className="space-y-4">
      {LOST_GUIDE_STEPS.map((step, index) => (
        <li id={step.id} key={step.id} className="relative scroll-mt-24 rounded-2xl border border-border bg-surface-raised p-5">
          {step.legacyAnchor && <span id={step.legacyAnchor} className="absolute -top-24" aria-hidden="true" />}
          <p className="text-sm font-semibold text-clay">{index + 1}</p>
          <h3 className="mt-1 text-lg font-semibold text-ink">{step.title}</h3>
          <p className="mt-2 text-base leading-7 text-content-secondary">
            {mode === "detail" ? step.detail : step.summary}
          </p>
          {step.actions.map((action) => (
            <Link key={action.href} href={action.href} className="mt-3 inline-flex min-h-11 items-center font-semibold text-forest underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary">
              {action.label}
            </Link>
          ))}
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Replace the old guide page with the approved hub**

The page must use exactly one H1, the approved intro, `GUIDE_PRIMARY_ACTIONS.map` for the three CTA paths, `<section id="lost-now"><LostGuideSteps mode="summary" /></section>`, `<section id="guide-list">` around all six catalog cards, official source links, and reviewed date. Generate JSON-LD with this same visible array:

```ts
const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "반려동물과 함께할 때 필요한 안내",
  description: GUIDE_DESCRIPTION,
  url: GUIDE_URL,
  inLanguage: "ko-KR",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: GUIDE_CATALOG.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: new URL(guide.href, GUIDE_URL).toString(),
    })),
  },
};
```

- [ ] **Step 5: Run hub contracts and typecheck**

Run: `node --test scripts/guide-content-contract.test.mjs && corepack yarn typecheck`

Expected: PASS.

- [ ] **Step 6: Commit the guide hub**

```bash
git add src/app/guide src/app/guide/page.tsx scripts/guide-content-contract.test.mjs
git commit -m "feat: build unified pet guide hub"
```

### Task 5: Guide detail route, accessible MDX and structured data

**Files:**
- Create: `src/app/guide/_components/GuideMDX.tsx`
- Create: `src/app/guide/[slug]/page.tsx`
- Modify: `scripts/guide-content-contract.test.mjs`

**Interfaces:**
- Consumes: `getAllGuides`, `getGuideBySlug`, `LOST_GUIDE_STEPS`.
- Produces: static params `{ slug: GuideSlug }[]`, Article JSON-LD for every detail, HowTo only for `lost-dog`.

- [ ] **Step 1: Add failing detail-route contracts**

```js
test("guide detail uses real 404, canonical Article metadata and shared HowTo steps", () => {
  const detail = fs.readFileSync(path.join(root, "src/app/guide/[slug]/page.tsx"), "utf8");
  assert.match(detail, /notFound\(\)/);
  assert.match(detail, /datePublished:\s*guide\.publishedAt/);
  assert.match(detail, /dateModified:\s*guide\.updatedAt/);
  assert.match(detail, /"@type":\s*"Article"/);
  assert.match(detail, /JSON\.stringify\(articleJsonLd\)/);
  assert.match(detail, /LOST_GUIDE_STEPS\.map/);
  assert.match(detail, /alternates:\s*\{\s*canonical/);
});
```

- [ ] **Step 2: Run contract and confirm RED**

Run: `node --test scripts/guide-content-contract.test.mjs`

Expected: FAIL because the detail route does not exist.

- [ ] **Step 3: Implement accessible server-rendered MDX components**

`GuideMDX.tsx` must remain a Server Component and use this typed server-rendered mapping; MDX bodies cannot contain H1:

```tsx
import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

function GuideLink({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) {
  const external = /^https?:\/\//.test(href);
  if (!external) {
    return <Link href={href} className="font-semibold text-forest underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary">{children}</Link>;
  }
  return <a {...props} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary">{children}</a>;
}

const components = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => <h2 {...props} className="mt-12 font-editorial text-2xl font-semibold text-ink" />,
  h3: (props: ComponentPropsWithoutRef<"h3">) => <h3 {...props} className="mt-8 text-xl font-semibold text-ink" />,
  p: (props: ComponentPropsWithoutRef<"p">) => <p {...props} className="mt-4 text-base leading-7 text-content-secondary" />,
  ul: (props: ComponentPropsWithoutRef<"ul">) => <ul {...props} className="mt-4 list-disc space-y-2 pl-6 text-base leading-7" />,
  ol: (props: ComponentPropsWithoutRef<"ol">) => <ol {...props} className="mt-4 list-decimal space-y-2 pl-6 text-base leading-7" />,
  li: (props: ComponentPropsWithoutRef<"li">) => <li {...props} />,
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => <blockquote {...props} className="mt-6 border-l-4 border-clay bg-surface-paper p-4 text-base leading-7" />,
  a: GuideLink,
};

export function GuideMDX({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeHighlight] } }} />;
}
```

- [ ] **Step 4: Implement the detail route**

```tsx
export function generateStaticParams() {
  return getAllGuides().map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = getGuideBySlug(params.slug);
  if (!guide) return {};
  const canonical = `${SITE_DOMAIN}/guide/${guide.slug}`;
  return {
    title: `${guide.title} | 파인드마이펫`,
    description: guide.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: guide.title,
      description: guide.description,
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      images: guide.thumbnail ? [{ url: guide.thumbnail, alt: guide.thumbnailAlt }] : undefined,
    },
  };
}
```

The page calls `notFound()` when absent, renders one H1 and the three dates, maps `sourceLinks`, renders `<LostGuideSteps mode="detail" />` before the `lost-dog` MDX supplement, and creates this Article object for every detail:

```ts
const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: guide.title,
  description: guide.description,
  url: canonical,
  mainEntityOfPage: canonical,
  inLanguage: "ko-KR",
  datePublished: guide.publishedAt,
  dateModified: guide.updatedAt,
  image: guide.thumbnail ? [new URL(guide.thumbnail, SITE_DOMAIN).toString()] : undefined,
};
```

Add HowTo only for `lost-dog`:

```ts
const howToJsonLd = guide.slug === "lost-dog" ? {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: guide.title,
  description: guide.description,
  inLanguage: "ko-KR",
  step: LOST_GUIDE_STEPS.map((step, index) => ({
    "@type": "HowToStep",
    position: index + 1,
    name: step.title,
    text: step.detail,
    url: `${canonical}#${step.id}`,
  })),
} : null;
```

Render `articleJsonLd` in one `application/ld+json` script and render the HowTo script only when `howToJsonLd` is non-null. Both objects must be serialized with `JSON.stringify`; do not merge Article and HowTo into a shape that is absent from the visible page.

- [ ] **Step 5: Run focused contracts, typecheck and build**

Run: `node --test scripts/guide-content-contract.test.mjs && corepack yarn typecheck && corepack yarn build`

Expected: PASS; all five detail paths appear in generated routes.

- [ ] **Step 6: Commit guide detail pages**

```bash
git add src/app/guide/_components/GuideMDX.tsx 'src/app/guide/[slug]/page.tsx' scripts/guide-content-contract.test.mjs
git commit -m "feat: add verified guide detail pages"
```

### Task 6: Grouped FAQ and catalog-driven home cards

**Files:**
- Modify: `src/app/faq/page.tsx`
- Modify: `src/app/_components/home/SituationGuide.tsx`
- Modify: `scripts/home-content-contract.test.mjs`
- Modify: `scripts/abandonment-status-contract.test.mjs`
- Modify: `tests/e2e/home-shell.spec.ts`

**Interfaces:**
- Consumes: `FAQ_GROUPS`, `FAQ_BY_ID`, `FAQ_ENTRIES`, `HOME_GUIDES`.
- Produces: FAQ display and FAQPage JSON-LD from the same entries.

- [ ] **Step 1: Update tests first for new module paths and set-based FAQ order**

In `home-content-contract.test.mjs`, change the import allowlist for `SituationGuide.tsx` to `@/content/guideCatalog`, load `src/content/guideCatalog.ts` and `src/content/faq.ts`, assert `HOME_GUIDES.map(({id,href}))`, and compare FAQ IDs as a set. In `abandonment-status-contract.test.mjs`, load `src/content/faq.ts`. In `home-shell.spec.ts`, expect `/guide/dog-walk-safety` rather than the old `/posts` URL.

- [ ] **Step 2: Run affected tests and confirm RED**

Run: `node --test scripts/home-content-contract.test.mjs scripts/abandonment-status-contract.test.mjs && corepack yarn test:e2e tests/e2e/home-shell.spec.ts`

Expected: FAIL while components still import `featuredGuides`.

- [ ] **Step 3: Render grouped FAQ and same-source JSON-LD**

```tsx
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "ko-KR",
  mainEntity: FAQ_ENTRIES.map((entry) => ({
    "@type": "Question",
    name: entry.q,
    acceptedAnswer: { "@type": "Answer", text: entry.a },
  })),
};
```

Map `FAQ_GROUPS`; inside each group map `entryIds` through `FAQ_BY_ID`. Preserve every entry `id`, show `reviewedAt`, render action links internally and source links externally with `rel="noopener noreferrer"`. The visible H1 remains `상황별 반려동물 안내`; `FAQ` may remain only in metadata and JSON-LD.

- [ ] **Step 4: Switch the home component to `HOME_GUIDES`**

Keep the current server-only component and its 44px link target; change only its import and mapped array.

- [ ] **Step 5: Run affected contracts and e2e**

Run: `node --test scripts/home-content-contract.test.mjs scripts/abandonment-status-contract.test.mjs scripts/guide-content-contract.test.mjs && corepack yarn test:e2e tests/e2e/home-shell.spec.ts`

Expected: PASS.

- [ ] **Step 6: Commit FAQ and home integration**

```bash
git add src/app/faq/page.tsx src/app/_components/home/SituationGuide.tsx scripts/home-content-contract.test.mjs scripts/abandonment-status-contract.test.mjs tests/e2e/home-shell.spec.ts
git commit -m "feat: connect faq and home to guide content"
```

### Task 7: Exact redirects and legacy page removal

**Files:**
- Modify: `next.config.mjs`
- Modify: `scripts/guide-content-contract.test.mjs`
- Remove: legacy `/posts` route files, `src/lib/featuredGuides.ts`, old MDX-only rendering components, `src/app/guide/FlyerButton.tsx`, `src/static/image/guide_5.png`

**Interfaces:**
- Produces: exact four-route redirect list; no catch-all redirect.
- Preserves: all API strings that refer to user posts.

- [ ] **Step 1: Add redirect and API-boundary tests**

```js
// Extend this test file's node:url import with pathToFileURL.
test("next redirects only the four approved static post paths", async () => {
  const config = (await import(pathToFileURL(path.join(root, "next.config.mjs")))).default;
  assert.deepEqual(await config.redirects(), [
    { source: "/posts", destination: "/guide", permanent: true },
    { source: "/posts/dog-missing-guide", destination: "/guide/lost-dog", permanent: true },
    { source: "/posts/dog-escape-while-walking", destination: "/guide/dog-walk-safety", permanent: true },
    { source: "/posts/cat-escape-reasons-and-solutions", destination: "/guide/cat-escape-prevention", permanent: true },
  ]);
});

test("user-post API routes remain untouched", () => {
  for (const file of [
    "src/app/rss.xml/route.ts",
    "src/lib/homeFeed.server.ts",
    "src/app/_components/main/LostList.tsx",
  ]) assert.match(fs.readFileSync(path.join(root, file), "utf8"), /\/posts/);
  assert.match(fs.readFileSync(path.join(root, "src/app/rss.xml/route.ts"), "utf8"), /\/lost\/\$\{p\.id\}/);
});
```

- [ ] **Step 2: Run redirect contract and confirm RED**

Run: `node --test scripts/guide-content-contract.test.mjs`

Expected: FAIL because `redirects()` is absent.

- [ ] **Step 3: Add exact redirects**

```js
async redirects() {
  return [
    { source: "/posts", destination: "/guide", permanent: true },
    { source: "/posts/dog-missing-guide", destination: "/guide/lost-dog", permanent: true },
    { source: "/posts/dog-escape-while-walking", destination: "/guide/dog-walk-safety", permanent: true },
    { source: "/posts/cat-escape-reasons-and-solutions", destination: "/guide/cat-escape-prevention", permanent: true },
  ];
},
```

- [ ] **Step 4: Confirm no consumers remain, then remove legacy static files**

Run: `rg -n "parsePost|CustomMDX|src/posts|/posts/dog-(missing|escape)|/posts/cat-escape" src scripts public`

Expected before removal: live route/home consumers are gone; `src/app/sitemap.ts`, `src/lib/parsePost.ts`, `src/posts`, and `scripts/indexnow.mjs` remain temporarily as the discovery source owned by Task 10. Remove only the page/rendering files listed in this task; do not modify backend `/posts` calls.

- [ ] **Step 5: Run contracts, typecheck and build**

Run: `node --test scripts/guide-content-contract.test.mjs scripts/home-content-contract.test.mjs && corepack yarn typecheck && corepack yarn build`

Expected: PASS; approved old paths are redirect routes and unknown old slugs are absent.

- [ ] **Step 6: Commit route migration**

```bash
git add next.config.mjs scripts/guide-content-contract.test.mjs src/app/posts src/lib/featuredGuides.ts src/app/guide/FlyerButton.tsx src/app/_components/CustomMDX.tsx src/app/_components/Blockquote.tsx src/app/_components/CustomImage.tsx src/app/_components/Highlight.tsx src/app/_components/Link.tsx src/static/image/guide_5.png
git commit -m "refactor: move static posts into guides"
```

### Task 8: Search-context truth and completed-state gating

**Files:**
- Create: `scripts/guide-context-copy-contract.test.mjs`
- Modify: `src/app/_components/lost/SearchRadiusMap.tsx`
- Modify: `src/app/_components/lost/LongTermGuideBlock.tsx`
- Modify: `src/lib/searchRadius.ts`
- Modify: `src/app/register/page.tsx`
- Modify: `src/app/(route)/lost/[id]/LostDetailClient.tsx`
- Remove: `src/app/_components/lost/SimilarCandidatesSection.tsx`

**Interfaces:**
- Produces: no AI-candidate request or claim while the backend has no enabled/disabled status contract.
- Produces: `const isActiveSearch = post.missingAnimalStatus !== "FOUND"` gate around every active-search action.

- [ ] **Step 1: Write failing context-copy tests**

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("search radius is explicitly reference-only and explains fallback", () => {
  const source = [
    read("src/app/(route)/lost/[id]/LostDetailClient.tsx"),
    read("src/app/_components/lost/SearchRadiusMap.tsx"),
  ].join("\n");
  assert.match(source, /참고용 추정/);
  assert.match(source, /도로망.*실패.*원형|원형.*fallback/);
  assert.doesNotMatch(source, /가장 확률 높음|대부분.*150m/);
});

test("disabled AI matching sends no request and makes no public claim", () => {
  const detail = read("src/app/(route)/lost/[id]/LostDetailClient.tsx");
  const register = read("src/app/register/page.tsx");
  assert.doesNotMatch(detail, /SimilarCandidatesSection|similar-candidates/);
  assert.doesNotMatch(register, /AI 유사도 매칭|AI 매칭/);
  assert.match(register, /목격자.*식별|식별.*목격자/);
});

test("FOUND gates every active search strategy", () => {
  const source = read("src/app/(route)/lost/[id]/LostDetailClient.tsx");
  assert.match(source, /const isActiveSearch = post\.missingAnimalStatus !== "FOUND"/);
  for (const component of ["TimePhaseBanner", "SearchRadiusMap", "LongTermGuideBlock", "SightingSection", "FlyerManagementSection"])
    assert.match(source, new RegExp(`isActiveSearch[\\s\\S]{0,6000}<${component}`));
  assert.match(source, /isActiveSearch[\s\S]{0,1200}오픈 채팅/);
});

test("long-term guidance does not invent an AI timing advantage", () => {
  assert.doesNotMatch(read("src/app/_components/lost/LongTermGuideBlock.tsx"), /2주.*AI.*효과|AI.*더 효과/);
  assert.doesNotMatch(read("src/lib/searchRadius.ts"), /더 효과적|가장 확률|골든타임/);
});
```

- [ ] **Step 2: Run the new test and confirm RED**

Run: `node --test scripts/guide-context-copy-contract.test.mjs`

Expected: FAIL on current claims and state handling.

- [ ] **Step 3: Correct map and long-term copy**

Add `이 범위는 실제 위치가 아니라 종·품종·경과시간으로 계산한 참고용 추정입니다.` in the lost-detail search container so it remains visible even when the post has no coordinate. In `SearchRadiusMap`, add `개의 도로망 계산이 실패하면 원형으로 표시될 수 있고, 고양이·기타는 원형 참고 범위를 사용합니다.` Rename legend labels to `먼저 확인`, `다음 확인`, `넓혀 확인`, and remove the categorical 150m cat claim. Remove the 14-day AI paragraph and replace absolute effectiveness wording with `목격 정보와 보호 공고를 반복 확인하고, 필요하면 지역과 시간을 넓혀 다시 공유하세요.`

- [ ] **Step 4: Neutralize time-stage labels without changing the radius algorithm**

Replace `STAGE_LABEL` values with `가까운 곳부터 확인하세요`, `탐색 범위와 보호 공고를 함께 확인하세요`, `목격 정보와 보호 공고 확인 범위를 넓혀보세요`, `탐색 범위는 참고하고 제보·보호 공고를 반복 확인하세요`, `탐색 범위는 참고용입니다. 새 목격 정보와 보호 공고를 확인하세요`. Do not change lookup tables, caps or radius calculations. Record the client CAT fallback versus backend behavior mismatch as technical debt in the final report rather than silently changing the algorithm in a content task.

- [ ] **Step 5: Remove disabled AI matching and correct registration copy**

Remove the `SimilarCandidatesSection` import, render and file so the frontend sends no request that cannot distinguish disabled matching from a real zero-result comparison. In registration, replace `AI 유사도 매칭에 가장 중요합니다` with `정면 얼굴과 전신 측면 사진은 목격자가 특징을 식별하는 데 도움이 됩니다.`

- [ ] **Step 6: Gate every active search action for FOUND**

Declare `isActiveSearch` after `post` exists. Use it for the open-chat link, owner flyer button, `TimePhaseBanner`, search-radius container, `LongTermGuideBlock`, `SightingSection`, and `FlyerManagementSection`. Keep the neutral completed notice, descriptive record, edit and delete controls visible.

- [ ] **Step 7: Run focused and existing contracts**

Run: `node --test scripts/guide-context-copy-contract.test.mjs scripts/abandonment-status-contract.test.mjs && corepack yarn typecheck`

Expected: PASS.

- [ ] **Step 8: Commit context truth fixes**

```bash
git add scripts/guide-context-copy-contract.test.mjs src/app/_components/lost/SearchRadiusMap.tsx src/app/_components/lost/LongTermGuideBlock.tsx src/lib/searchRadius.ts src/app/register/page.tsx src/app/_components/lost/SimilarCandidatesSection.tsx 'src/app/(route)/lost/[id]/LostDetailClient.tsx'
git commit -m "fix: align active search guidance with product state"
```

### Task 9: Flyer storage, optional photo, paper and privacy truth

**Files:**
- Modify: `scripts/guide-context-copy-contract.test.mjs`
- Modify: `src/app/flyer/page.tsx`
- Modify: `src/app/flyer/FlyerStandaloneClient.tsx`
- Modify: `src/app/_components/lost/FlyerPrintDialog.tsx`

**Interfaces:**
- Preserves: localStorage text draft and in-memory object URL photo behavior.
- Produces: visible copy matching those behaviors.

- [ ] **Step 1: Add failing flyer truth tests**

```js
test("flyer copy matches local storage, optional photo and selectable paper", () => {
  const standalone = read("src/app/flyer/FlyerStandaloneClient.tsx");
  const dialog = read("src/app/_components/lost/FlyerPrintDialog.tsx");
  const page = read("src/app/flyer/page.tsx");
  assert.match(standalone, /브라우저에 임시 저장될 수/);
  assert.match(standalone, /사진은 저장하지/);
  assert.match(standalone, /사진.*권장/);
  assert.match(standalone, /부착.*허가/);
  assert.doesNotMatch(standalone, /입력한 내용은 저장되지/);
  assert.doesNotMatch(dialog, /A4 한 장 전단지로 출력/);
  assert.doesNotMatch(page, /A4 로 출력/);
});
```

- [ ] **Step 2: Run the flyer test and confirm RED**

Run: `node --test scripts/guide-context-copy-contract.test.mjs`

Expected: FAIL on current storage, photo and A4 copy.

- [ ] **Step 3: Apply exact truthful copy**

Use this intro: `게시글을 올리지 않아도 바로 만들 수 있어요. 입력한 글은 이 기기의 브라우저에 임시 저장될 수 있으며 서버로 전송하지 않습니다. 사진은 저장하지 않습니다. 공용 기기에서는 사용 후 입력 내용을 지워주세요.` Change `꼭 필요한 것` description to `제목과 연락처를 먼저 입력하세요. 사진은 식별에 도움이 되므로 함께 넣는 것을 권장해요.` Change the photo label to `사진 (권장)` with no required star. Add: `공개 연락처 범위를 확인하고, 전단지를 붙이기 전 시설이나 관리자의 허가를 받아주세요.`

Change the print dialog sentence to `선택한 용지 크기와 인쇄 배율을 확인한 뒤 출력하세요. 아래 문구는 인쇄 전에 수정할 수 있어요.` Change flyer page metadata to avoid A4-only language.

- [ ] **Step 4: Run focused contracts and typecheck**

Run: `node --test scripts/guide-context-copy-contract.test.mjs && corepack yarn typecheck`

Expected: PASS.

- [ ] **Step 5: Commit flyer truth fixes**

```bash
git add scripts/guide-context-copy-contract.test.mjs src/app/flyer/page.tsx src/app/flyer/FlyerStandaloneClient.tsx src/app/_components/lost/FlyerPrintDialog.tsx
git commit -m "fix: make flyer privacy guidance truthful"
```

### Task 10: Discovery, regional links, llms.txt and RSS boundary

**Files:**
- Create: `scripts/guide-discovery-contract.test.mjs`
- Modify: `src/app/sitemap.ts`
- Modify: `scripts/indexnow.mjs`
- Modify: `public/llms.txt`
- Modify: `src/app/(route)/abandonment/region/page.tsx`
- Modify: `src/app/(route)/abandonment/region/[sido]/[sigungu]/page.tsx`
- Modify: `src/app/(route)/abandonment/page.tsx`
- Modify: `src/app/terms/page.tsx`
- Modify: `src/app/privacy/page.tsx`
- Remove: `src/lib/parsePost.ts`
- Remove: `src/posts/cat-escape-reasons-and-solutions.mdx`
- Remove: `src/posts/dog-escape-while-walking.mdx`
- Remove: `src/posts/dog-missing-guide.mdx`
- Remove: `src/static/image/posts_banner.jpg`

**Interfaces:**
- Consumes: `getAllGuides()` and `updatedAt` for sitemap.
- Produces: matching `/guide/*` sets in sitemap and IndexNow.
- Preserves: RSS fetch from API `/posts` and item links `/lost/${p.id}`.

- [ ] **Step 1: Write failing discovery contracts**

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("sitemap uses guide updatedAt and contains no public static posts", () => {
  const source = read("src/app/sitemap.ts");
  assert.match(source, /getAllGuides/);
  assert.match(source, /lastModified:\s*new Date\(guide\.updatedAt\)/);
  assert.doesNotMatch(source, /DOMAIN_URL}\/(?:posts|posts\/)/);
});

test("IndexNow core collects guide mdx recursively without static posts", () => {
  const source = read("scripts/indexnow.mjs");
  assert.match(source, /src["'],\s*["']guides/);
  assert.match(source, /globSync/);
  assert.doesNotMatch(source, /SITE}\/(?:posts|posts\/)/);
});

test("IndexNow core exposes the complete guide URL set", async () => {
  const source = read("scripts/indexnow.mjs");
  assert.match(source, /export function collectCoreUrls/);
  assert.match(source, /process\.argv\[1\][\s\S]{0,160}import\.meta\.url[\s\S]{0,160}pathToFileURL/);
  const module = await import(pathToFileURL(path.join(root, "scripts/indexnow.mjs")));
  const guideUrls = module.collectCoreUrls().filter((url) =>
    new URL(url).pathname.startsWith("/guide"),
  );
  assert.deepEqual(new Set(guideUrls), new Set([
    "https://findmypet.platformholder.site/guide",
    "https://findmypet.platformholder.site/guide/lost-dog",
    "https://findmypet.platformholder.site/guide/dog-walk-safety",
    "https://findmypet.platformholder.site/guide/cat-escape-prevention",
    "https://findmypet.platformholder.site/guide/found-animal",
    "https://findmypet.platformholder.site/guide/shelter-adoption",
  ]));
});

test("RSS remains a user lost-post feed", () => {
  const source = read("src/app/rss.xml/route.ts");
  assert.match(source, /BASE_URL}\/(?:posts)/);
  assert.match(source, /\/lost\/\$\{p\.id\}/);
  assert.doesNotMatch(source, /\/guide\/\$\{p\.id\}/);
});

test("llms and shelter pages use the approved public language", () => {
  const combined = [
    read("public/llms.txt"),
    read("src/app/(route)/abandonment/page.tsx"),
    read("src/app/(route)/abandonment/region/page.tsx"),
    read("src/app/(route)/abandonment/region/[sido]/[sigungu]/page.tsx"),
    read("src/app/terms/page.tsx"),
  ].join("\n");
  assert.match(combined, /상황별 반려동물 안내/);
  assert.doesNotMatch(combined, /공고 후 10일|매시간 갱신|실종 대응 아티클.*\/posts/);
  assert.doesNotMatch(combined, /동물보호관리시스템/);
  for (const file of [
    "src/app/(route)/abandonment/region/page.tsx",
    "src/app/(route)/abandonment/region/[sido]/[sigungu]/page.tsx",
    "src/app/terms/page.tsx",
    "src/app/privacy/page.tsx",
  ]) {
    const source = read(file);
    assert.match(source, /상황별 반려동물 안내/);
    assert.doesNotMatch(source, />\s*자주 묻는 질문\s*</);
  }
});
```

- [ ] **Step 2: Run discovery contracts and confirm RED**

Run: `node --test scripts/guide-discovery-contract.test.mjs`

Expected: FAIL on old parser, `/posts`, build-time lastModified, labels and timing claims.

- [ ] **Step 3: Switch sitemap to guide metadata**

Replace `getAllPosts`/`safeGetAllPosts` with `getAllGuides`/`safeGetAllGuides`. Map each guide to `${DOMAIN_URL}/guide/${guide.slug}` and `new Date(guide.updatedAt)`. Remove `/posts` from static pages. Set `/guide` and `/faq` `lastModified` to `new Date("2026-08-01")`, not build time. Do not change `fetchAllPosts()` or its `/lost/${p.id}` result.

- [ ] **Step 4: Make IndexNow use the same recursive guide scope**

Import `globSync` from `glob`, collect `src/guides/**/*.mdx`, convert filenames to `/guide/{basename}`, keep `/guide` and `/faq`, and remove `/posts`. Export `collectCoreUrls` for the URL-set contract. Import `pathToFileURL` and guard `main()` with `if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)` so importing the collector cannot submit or mutate state. Keep notice-status guards, blocked prefixes, region handling, batching and exit behavior unchanged.

- [ ] **Step 5: Correct connected labels and llms facts**

Change user-visible `/faq` link labels in both region pages, terms and privacy to `상황별 반려동물 안내`. Replace the old `동물보호관리시스템` user-facing name in the abandonment root, region root, sigungu page, terms and `llms.txt` with `국가동물보호정보시스템`. Change the sigungu page to `약 1시간 주기로 동기화하며 외부 데이터 상황에 따라 늦어질 수 있음`. In `public/llms.txt`, list `/guide` plus the five detail routes, keep `/lost` as user content, separate 7-day notice from 10-day ownership criteria, and remove any claim that CLOSED is a final state.

- [ ] **Step 6: Remove the superseded static source only after discovery migration**

Run: `rg -n "parsePost|src/posts|posts_banner" src/app src/lib scripts public`

Expected: no consumer outside `src/lib/parsePost.ts` itself. Confirm the exact tracked deletion set with:

```bash
git ls-files --error-unmatch src/lib/parsePost.ts src/posts/cat-escape-reasons-and-solutions.mdx src/posts/dog-escape-while-walking.mdx src/posts/dog-missing-guide.mdx src/static/image/posts_banner.jpg
```

Expected: all five paths print. Remove those exact files now; sitemap and IndexNow already use `src/guides`.

- [ ] **Step 7: Run discovery and dry-run checks**

Run: `node --test scripts/guide-discovery-contract.test.mjs scripts/category-contract.test.mjs scripts/abandonment-status-contract.test.mjs && node scripts/indexnow.mjs --dry-run --core-only && corepack yarn typecheck && corepack yarn build`

Expected: tests, typecheck and build PASS with the complete hub-plus-five-detail set; dry run lists no static `/posts` URL and performs no IndexNow submission.

- [ ] **Step 8: Commit discovery changes**

```bash
git add scripts/guide-discovery-contract.test.mjs src/app/sitemap.ts scripts/indexnow.mjs public/llms.txt 'src/app/(route)/abandonment/page.tsx' 'src/app/(route)/abandonment/region/page.tsx' 'src/app/(route)/abandonment/region/[sido]/[sigungu]/page.tsx' src/app/terms/page.tsx src/app/privacy/page.tsx src/lib/parsePost.ts src/posts src/static/image/posts_banner.jpg
git commit -m "fix: synchronize guide discovery and public facts"
```

### Task 11: Full-package content-ops quality gate

**Files:**
- Modify: `docs/superpowers/reviews/2026-08-01-fmp-guide-content-panel.md`
- Modify only when required by a scored finding: every user-visible copy file created or modified in Tasks 2–10.

**Interfaces:**
- Consumes: guide catalog, FAQ, lost steps, five MDX files, guide/FAQ/home labels, search-state copy, registration copy, flyer copy, regional links and `llms.txt` as one artifact package.
- Produces: one content-ops Winner, all expert scores, weighted aggregate and a maximum three-round scoring history.
- Gate: Task 12 cannot start unless every expert and the weighted aggregate are at least 90; after round three a lower result holds implementation completion.

- [ ] **Step 1: Assemble the exact review package**

Include these files in full: `src/content/guideCatalog.ts`, `src/content/faq.ts`, `src/content/lostGuide.ts`, `src/guides/*.mdx`, `src/app/guide/page.tsx`, `src/app/guide/[slug]/page.tsx`, `src/app/faq/page.tsx`, `src/app/_components/home/SituationGuide.tsx`, `src/app/_components/lost/SearchRadiusMap.tsx`, `src/app/_components/lost/LongTermGuideBlock.tsx`, `src/lib/searchRadius.ts`, `src/app/register/page.tsx`, `src/app/(route)/lost/[id]/LostDetailClient.tsx`, `src/app/flyer/page.tsx`, `src/app/flyer/FlyerStandaloneClient.tsx`, `src/app/_components/lost/FlyerPrintDialog.tsx`, the abandonment root and both region pages, `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`, and `public/llms.txt`.

Terms and privacy are read for consistency but may only change the affected `/faq` label or a directly evidenced feature-fact/link mismatch. Do not use this panel to generally rewrite legal-policy copy.

- [ ] **Step 2: Run the explicitly requested content-ops panel**

Use the `content-ops` skill and inspect its pattern file before each round. The ten roles are: emergency guidance editor, animal welfare/behavior reviewer, Korean animal-protection law/policy reviewer, shelter/adoption reviewer, plain-Korean UX/IA writer, accessibility reviewer, SEO/structured-data reviewer, privacy/flyer-safety reviewer, Brand Voice Match, and AI Writing Detector weighted 1.5×.

Score the whole package with: factual/safety 30, action clarity 20, natural voice 15, value 15, IA/accessibility 10, search/source trust 10. Run at most three total rounds. A round is capped below 90 for an unsupported legal/behavior claim, unshipped feature claim, CLOSED-final-state claim, FMP-as-official-report claim, privacy mismatch, or screen/JSON-LD mismatch.

- [ ] **Step 3: Apply each scored revision and preserve the audit trail**

For each round, record all ten expert scores, the weighted aggregate, top three weaknesses, exact changed files and revised copy in `docs/superpowers/reviews/2026-08-01-fmp-guide-content-panel.md`. The document begins with `Winner + Score`, then panel names, iteration count, full scoring history, verified sources and remaining risks. Do not erase earlier-round scores.

If any expert or the aggregate remains below 90 after round three, stop and report the best version plus unresolved risk. If the user later rejects a winner that passed 90, ask for the reason and record the preference, rejected pattern and scoring penalty in the content-ops pattern format before revising again.

- [ ] **Step 4: Re-run every copy-sensitive contract after the winner**

Run:

```bash
node --test scripts/guide-content-contract.test.mjs scripts/guide-context-copy-contract.test.mjs scripts/guide-discovery-contract.test.mjs scripts/home-content-contract.test.mjs scripts/abandonment-status-contract.test.mjs scripts/category-contract.test.mjs
corepack yarn typecheck
git diff --check
```

Expected: PASS and all individual/aggregate scores at least 90.

- [ ] **Step 5: Commit the full-package winner and scoring record**

Stage only the files actually changed by panel revisions plus the review document; inspect `git diff --cached --name-only` before committing.

```bash
git add docs/superpowers/reviews/2026-08-01-fmp-guide-content-panel.md
git commit -m "content: approve full guide copy package"
```

If the panel changed copy files, add those exact files to the same commit before running it.

### Task 12: Browser acceptance and full frontend gate

**Files:**
- Create: `tests/e2e/guide-content.spec.ts`
- Create: `tests/e2e/lost-detail-and-flyer.spec.ts`
- Modify: `scripts/fixtures/home-api-server.mjs`

**Interfaces:**
- Consumes: all frontend work and the approved copy package from Tasks 1–11.
- Produces: browser evidence for redirects, 404, headings, accessibility and responsive layout.

- [ ] **Step 1: Extend the local fixture with deterministic detail records**

Add tracked routes for both detail URLs and, for request-count assertions, each record's `/reachable`, `/sightings`, and `/similar-candidates` URL. Return the existing fixture record plus these exact detail-only fields:

```js
function detailRecord(summary) {
  return {
    ...summary,
    gender: "male",
    imageUrls: [],
    phoneNum: "010-0000-0000",
    isMine: summary.missingAnimalStatus === "FOUND",
    openChatUrl: summary.missingAnimalStatus === "FOUND" ? "https://open.kakao.com/o/e2e" : null,
    coordinate: summary.missingAnimalStatus === "FOUND"
      ? { lat: 37.5665, lng: 126.978 }
      : undefined,
  };
}

const detailMatch = pathname.match(/^\/api\/v1\/post\/([^/]+)$/);
if (request.method === "GET" && detailMatch) {
  const id = detailMatch[1];
  const post = lostPosts.find((item) => item.id === id);
  if (!post) return sendJson(response, 404, { success: false });
  recordRequest(pathname, url);
  return sendJson(response, 200, { success: true, data: detailRecord(post) });
}

if (request.method === "GET" && pathname.endsWith("/reachable")) {
  recordRequest(pathname, url);
  return sendJson(response, 200, {
    success: true,
    data: { method: "CIRCLE_FALLBACK", center: { lat: 37.5665, lng: 126.978 }, bands: { core: 200, likely: 600, possible: 1000 } },
  });
}
if (request.method === "GET" && pathname.endsWith("/sightings")) {
  recordRequest(pathname, url);
  return sendJson(response, 200, { success: true, data: [] });
}
if (request.method === "GET" && pathname.endsWith("/similar-candidates")) {
  recordRequest(pathname, url);
  return sendJson(response, 200, { success: true, data: [] });
}
```

- [ ] **Step 2: Write guide browser tests**

Test exact redirect status/location with `request.get(path, { maxRedirects: 0 })`, unknown `/posts/not-a-guide` and `/guide/not-a-guide` as 404, one H1 on `/guide`, `/faq` and all five details, canonical and Article date metadata, legacy anchors, home card URLs, and no horizontal overflow at 390, 768, 1440. Run axe on `/guide`, `/faq`, `/guide/lost-dog` and require serious/critical count zero.

Create a JavaScript-disabled browser context and assert `/guide`, `/faq`, `/guide/found-animal` still expose H1, body text, internal actions and official-source links.

- [ ] **Step 3: Write SEARCHING, FOUND and flyer browser tests**

In `lost-detail-and-flyer.spec.ts`, abort non-loopback requests as the home accessibility tests do. Assert the SEARCHING record shows `참고용 추정` and the active guidance, while the FOUND record shows its completion notice and none of `탐색 범위`, `여기서 봤어요`, `전단지 QR`, `오픈 채팅`; inspect `/__requests` and require zero `/reachable`, `/sightings` and `/similar-candidates` calls for FOUND.

For `/flyer`, enter title, phone and description, reload, and assert those strings restore. Inspect `fmp:flyer:draft:v1` and require exactly `title`, `place`, `time`, `phoneNum`, `gratuity`, `description`, with no image data. Assert no-photo title+phone enables printing, visible storage/photo/permission copy exists, and the dialog offers A3, B4, A4, B5, A5 and Letter without saying every output is A4.

- [ ] **Step 4: Run the new e2e and confirm failures before final fixes**

Run: `corepack yarn test:e2e tests/e2e/guide-content.spec.ts tests/e2e/lost-detail-and-flyer.spec.ts`

Expected: any missed redirect, metadata, overflow, focus or accessibility issue fails with its exact route.

- [ ] **Step 5: Make only evidence-driven UI fixes**

Restrict fixes to `next.config.mjs`, `SituationGuide.tsx`, the failing guide/FAQ components, or the exact Task 8/9 lost-detail, search-radius and flyer files exercised by `lost-detail-and-flyer.spec.ts`. Do not update screenshots unless a screenshot assertion is intentionally added. Re-run the single failing e2e plus its owning contract (`guide-content`, `guide-context-copy`, or `guide-discovery`) after each fix.

If an accessibility fix changes user-visible wording rather than markup or classes, return to Task 11 and rescore that revised full package before continuing.

- [ ] **Step 6: Run the complete frontend gate**

```bash
corepack yarn test:contracts
corepack yarn typecheck
corepack yarn lint
corepack yarn test:e2e
corepack yarn build
git diff --check
```

Expected: all commands PASS. For lint, record the known five pre-existing warnings separately and require zero new warnings.

- [ ] **Step 7: Inspect scope and commit browser coverage**

Run: `git status --short && git diff --stat && git diff --check`

Expected: only task-owned files; `.superpowers/` remains untracked and unstaged.

```bash
git add tests/e2e/guide-content.spec.ts tests/e2e/lost-detail-and-flyer.spec.ts scripts/fixtures/home-api-server.mjs next.config.mjs src/app/_components/home/SituationGuide.tsx src/app/guide src/app/faq/page.tsx src/app/_components/lost/SearchRadiusMap.tsx src/app/_components/lost/LongTermGuideBlock.tsx src/lib/searchRadius.ts src/app/register/page.tsx 'src/app/(route)/lost/[id]/LostDetailClient.tsx' src/app/flyer/page.tsx src/app/flyer/FlyerStandaloneClient.tsx src/app/_components/lost/FlyerPrintDialog.tsx
git commit -m "test: cover guide migration in browser"
```

### Task 13: PRD and marketing truth synchronization

**Files in separate repositories:**
- Modify as required: `/Users/park/Desktop/project/prd/find-my-pet/requirements.md`
- Modify as required: `/Users/park/Desktop/project/prd/find-my-pet/api-spec.md`
- Modify as required: `/Users/park/Desktop/project/prd/find-my-pet/search-radius-and-flyer.md`
- Modify: `/Users/park/Desktop/project/marketing/services/find-my-pet/feature-truth.md`
- Create or update: `/Users/park/Desktop/project/marketing/reports/qc/find-my-pet-drift-20260801.md`

**Interfaces:**
- Consumes: verified frontend commit range and actual route/content behavior.
- Produces: product requirements and marketing truth that distinguish shipped guide work from unshipped group/team work.

- [ ] **Step 1: Run the required `source-command-prd-sync` skill**

Read the current dirty status in the `prd` repository first and preserve all unrelated edits. Update only the Find-My-Pet sections affected by the implemented routes, redirects, FAQ grouping, search-radius wording, AI states, FOUND visibility, flyer storage truth and RSS boundary. Do not mark group/team/chat/map functionality shipped. Since the PRD repository already contains user changes, do not commit or rewrite overlapping sections without first comparing the exact diff.

- [ ] **Step 2: Verify PRD truth against code**

Run:

```bash
git -C /Users/park/Desktop/project/prd diff --check -- find-my-pet/requirements.md find-my-pet/api-spec.md find-my-pet/search-radius-and-flyer.md
rg -n "/guide|/posts|7일|10일|약 1시간|FOUND|전단지|수색그룹" /Users/park/Desktop/project/prd/find-my-pet
```

Expected: guide routes and exact redirect policy documented; API `/posts` and `/lost` distinction retained; unshipped group/team work not labeled complete.

- [ ] **Step 3: Run the required `source-command-marketing-prd-sync` skill**

Use `service=find-my-pet`, `mode=full`. Refresh `feature-truth.md`, then scan all published Find-My-Pet marketing content for old `/posts` guide URLs, old system naming, timing claims, 7/10-day conflation and unshipped group/team claims. Preserve unrelated dirty marketing files and do not publish anything externally.

- [ ] **Step 4: Verify marketing sync without overwriting existing work**

Run:

```bash
git -C /Users/park/Desktop/project/marketing diff --check -- services/find-my-pet/feature-truth.md reports/qc/find-my-pet-drift-20260801.md
rg -n "/posts|공고 후 10일|매시간|수색그룹|팀|채팅|통합 지도" /Users/park/Desktop/project/marketing/services/find-my-pet /Users/park/Desktop/project/marketing/content
```

Expected: every remaining match is either an internal API reference, an explicitly unshipped item, or a drift finding with a corrective recommendation.

- [ ] **Step 5: Report synchronization scope**

Report the changed PRD files, changed marketing truth sections, drift FAIL/WARN/PASS counts, and any pre-existing dirty files left untouched. Do not create commits in the dirty PRD or marketing repositories unless the user separately asks for those commits.

### Task 14: Preview deployment gate

**Files:**
- No local file changes.

**Interfaces:**
- Consumes: clean frontend verification evidence and synchronized product truth.
- Produces: a user decision, not an automatic deployment.

- [ ] **Step 1: Prepare deployment evidence without deploying**

Record the frontend commit SHA, full gate results, content-ops winner score, PRD/marketing sync status, and the intended non-production Vercel target. Confirm production aliases are not in the target command.

- [ ] **Step 2: Ask for immediate deployment confirmation**

State that preview deployment changes external state and ask the user to approve that exact non-production Vercel deployment. Do not execute `vercel`, change an alias, or submit IndexNow before that answer.

- [ ] **Step 3: If approved, use the hosting workflow and verify the returned preview URL**

Deploy only to a preview target, open `/guide`, `/faq`, one detail route and one old redirect on the returned URL, and report the URL. Production remains unchanged.

---

## Final Self-Review Checklist

- Every design requirement maps to Tasks 1–14: registry and metadata (1–3), guide UI/JSON-LD (4–5), FAQ/home (6), redirects (7), connected product truth (8–9), discovery/RSS (10), full-package content-ops (11), browser/full gates (12), PRD/marketing (13), preview confirmation (14).
- Public `/posts` migration is exact while user-post APIs and RSS remain unchanged.
- `GuideSlug`, metadata field names, `FAQ_ENTRIES`, `FAQ_GROUPS`, `LOST_GUIDE_STEPS`, and `HOME_GUIDES` are spelled consistently across tasks.
- No task relies on an undefined route, type or content source.
- No new dependency, production deploy, external publication or IndexNow submission is implied.
- Dirty `.superpowers/`, PRD and marketing worktrees are explicitly preserved.
