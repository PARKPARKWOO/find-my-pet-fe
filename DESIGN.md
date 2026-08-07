---
name: 파인드마이펫 (Find My Pet)
description: 경황 중인 보호자가 3초 안에 다음 행동을 아는 밝은 동네 서비스 — 흰 바탕, 웜 그린, 상태색이 정보를 끌고 간다.
colors:
  forest: "#0D8348"
  forest-strong: "#0A6B3B"
  forest-tint: "#E8F7EF"
  ink: "#1A1C1A"
  paper: "#FFFFFF"
  canvas: "#F7F7F5"
  clay: "#E5484D"
  accent-readable: "#C83035"
  wine: "#B05222"
  sighting: "#2563BF"
  waiting: "#9A5D00"
  archived: "#797E7A"
  destructive: "#CD2B31"
  kakao: "#FEE500"
  text-secondary: "#464C47"
  text-muted: "#6C726D"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "2rem (sm 이상 3rem)"
    fontWeight: 800
    lineHeight: 1.18
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "1.25rem (sm 이상 1.5rem)"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
spacing:
  gutter: "1rem"
  gutter-md: "1.5rem"
  card: "1rem"
  card-lg: "1.5rem"
  section: "3rem"
  section-lg: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.forest-strong}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
  button-signal:
    backgroundColor: "{colors.clay}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    height: "44px"
  button-kakao:
    backgroundColor: "{colors.kakao}"
    textColor: "#191919"
    rounded: "{rounded.md}"
    height: "44px"
  chip-status:
    backgroundColor: "{colors.accent-readable}"
    textColor: "#FFFFFF"
    rounded: "9999px"
    padding: "4px 10px"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
  search-hero:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    height: "56px"
---

# Design System: 파인드마이펫

## Overview

**Creative North Star: "밝은 동네 서비스"**

경황 중인 보호자가 3초 안에 다음 행동을 아는 것이 이 시스템의 존재 이유다. 어두운 감성 연출 대신 익숙한 한국 로컬 앱 문법(당근·토스·에어비앤비 옆에 놓여도 어색하지 않을 완성도)을 흠 없이 집행한다. 흰 바탕과 웜 라이트 그레이 섹션 위에서 동물 사진이 항상 주인공이고, UI는 받침이다. 정보의 위계는 색보다 먼저 사진과 상태색이 끌고 간다.

세계는 하나의 웜 그린(#0D8348)과 다섯 가지 상태색, Pretendard 단일 서체의 무게 위계로 이루어진다. 실험적 비주얼 대신 익숙함의 크래프트 — 장식은 없고, 모든 색·그림자·라운드가 기능을 가진다. (방향 계약 seed key `09b74aa6`, 2026-08-07 전면 리뉴얼.)

토큰 값은 `scripts/design-system-contract.test.mjs` 계약 테스트가 hex 단위로 고정하고 있고, WCAG AA는 Playwright axe e2e 게이트로 회귀가 막혀 있다. 토큰 값을 바꾸면 계약 테스트를 함께 갱신해야 한다.

**Key Characteristics:**
- 흰 페이지(#FFFFFF) + 웜 그레이 섹션(#F7F7F5)의 교차 리듬
- 사진 우선 카드 — 4:3 사진 위 상태 배지가 정보의 첫 줄
- 단일 액센트 웜 그린 + 기능적 상태색 5종 (장식색 없음)
- Pretendard 하나로 무게(400–800)만으로 위계를 만든다
- 16px 라운드 카드와 낮은 앰비언트 그림자, 하드 섀도 없음
- 브라우저 서피스까지 팔레트를 입는다 (::selection, 캐럿, 포커스 링)

## Colors

밝은 중성 바탕 위에 기능색만 놓는 절제된 팔레트 — 모든 유채색은 상태이거나 행동이다.

### Primary
- **웜 포레스트 그린** (#0D8348): 유일한 브랜드 액센트. 주 행동 버튼, 로고 마크, 포커스 링, 캐럿, 링크. 흰 글자 대비 4.8:1.
- **포레스트 스트롱** (#0A6B3B): hover/pressed 상태, 그리고 그린 틴트 위에 놓이는 그린 텍스트.
- **포레스트 틴트** (#E8F7EF): 그린 계열의 옅은 배경 (보호 중 칩 등은 `forest/10` 알파 틴트로도 구현).

### Secondary
- **클레이 코랄** (#E5484D): 긴급·"찾는 중" 계열의 시그널 색. 지도 실종 핀, 카드 hover 보더(`clay/60`), signal 버튼.
- **리더블 코랄** (#C83035): 라이트 서피스에서 텍스트·배지로 읽히는 코랄. "찾는 중" 상태 배지의 실제 값.
- **와인** (#B05222): 사례금 등 보조 웜 액센트. `wine/10` 틴트 배경 + wine 텍스트 조합.

### Tertiary (상태색·브랜드 고정색)
- **목격 블루** (#2563BF): "목격" 상태와 목격 핀 전용.
- **대기 앰버** (#9A5D00): 대기 상태 (흰 바탕 대비 5.3:1).
- **아카이브 그레이** (#797E7A): "공고 종료"·완결 상태.
- **디스트럭티브** (#CD2B31): 파괴적 행동 전용.
- **카카오 옐로** (#FEE500): 카카오 로그인·공유 버튼 전용, 변경 불가 (브랜드 커미트먼트, PRODUCT.md).

### Neutral
- **웜 잉크** (#1A1C1A): 기본 텍스트, 지도 선택 핀, 인버스 서피스.
- **세컨더리 텍스트** (#464C47) / **뮤트 텍스트** (#6C726D): 보조 문장 / 메타 정보.
- **페이퍼** (#FFFFFF): 페이지·카드 기본 서피스 (paper = raised, 카드는 보더·그림자로 구분).
- **캔버스** (#F7F7F5): 섹션 그라운드, 썸네일 플레이스홀더, hover 배경.
- **보더**: `hsl(120 4% 91%)` — 카드·입력·구분선의 기본 헤어라인.

### Named Rules
**상태색 즉독 규칙.** 찾는 중(#C83035 코랄) / 목격(#2563BF 블루) / 보호 중·완료(#0D8348 그린) / 종료(#797E7A 그레이) / 대기(#9A5D00 앰버)는 언제나 색만으로 즉시 구분돼야 한다. 새 상태 표현은 이 다섯 매핑 밖의 색을 쓰지 않는다.

**카카오 격리 규칙.** #FEE500은 카카오 버튼(`variant="brand"`, 텍스트 #191919)에만 존재한다. 다른 어떤 강조·장식에도 노랑을 쓰지 않는다.

**틴트 위 포레스트 강화 규칙.** 그린 틴트 배경(`forest/10`, forest-tint) 위의 그린 텍스트는 반드시 forest-strong(#0A6B3B)이다. #0D8348은 틴트 위에서 대비가 부족하다.

**변수 이름 보존 규칙.** 세만틱 변수(`--fmp-*`)의 이름은 유지하고 값만 바꾼다. 상태색은 `state-*`, 행동색은 `action-*` 세만틱 토큰을 거쳐 쓴다 — raw 색 토큰 직접 참조는 서피스·시그니처 컴포넌트에만.

## Typography

**Display/Body Font:** Pretendard Variable (로컬 woff2, weight 45–920, `system-ui` 폴백)
**제2서체 없음** — 리뉴얼로 세리프 디스플레이는 은퇴했고 `font-editorial` 별칭도 Pretendard로 수렴한다.

**Character:** 단일 산세리프가 무게와 자간만으로 위계를 만든다. 본문 전역 자간 -0.01em, 제목은 -0.03em까지 조인다. 한국어 제목은 `break-keep` + `text-balance`로 어절 단위 줄바꿈.

### Hierarchy
- **Display** (800, 2rem→3rem, lh 1.18→1.15, -0.03em): 홈 히어로 h1 전용.
- **Headline** (700, 1.25rem→1.5rem, tracking-tight): 섹션 제목 h2. 바로 아래 0.875rem 세컨더리 문장이 따라붙는 2줄 패턴.
- **Title** (600–800, 1rem–1.875rem): 카드 제목은 1rem/600, 상세 페이지 h1은 1.5rem→1.875rem/800.
- **Body** (400, 1rem, lh 1.75): 히어로 서브텍스트·본문. 카드 본문은 0.875rem/lh 1.5.
- **Label** (600–700, 0.75rem–0.875rem): 상태 배지·칩·메타. 배지는 700, 메타는 500–600.

### Named Rules
**단일 서체 규칙.** 서체는 Pretendard 하나. 위계가 부족하면 무게(400→600→700→800)와 색(primary→secondary→muted)으로 만든다. 세리프·디스플레이 서체 도입 금지.

**숫자 정렬 규칙.** `time` 요소와 `[data-numeric]`에는 `tabular-nums`가 전역 적용된다. 날짜·거리·건수 등 숫자 열은 이 경로를 태운다.

## Layout

- **페이지 컨테이너**: `max-w-page`(80rem) 중앙 정렬, 거터 `px-4 md:px-6`. 읽기 폭은 `max-w-reading`(48rem).
- **전역 셸**: 고정 헤더(h-16, sticky z-40) → 본문(`py-6`) → 푸터. 스킵 링크(`본문으로 바로가기`)가 첫 포커스.
- **섹션 리듬**: 풀블리드 섹션이 페이퍼(흰색)와 캔버스(#F7F7F5)를 교대로 깔고, 수직 패딩은 `py-12 lg:py-16`(48→64px). 섹션 내부 컨테이너가 다시 max-w-page를 잡는다.
- **히어로 그리드**: `lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]` — 좌 텍스트+검색, 우 목적 카드. 모바일은 세로 스택.
- **브레이크포인트**: 표준 스케일에 `xs: 480px` 추가 (카드 그리드 2열 전환점).
- **터치 타깃**: 인터랙티브 요소는 최소 44px(`min-h-11 min-w-11`, h-11 버튼) 확보.

## Elevation & Depth

깊이는 낮은 앰비언트 그림자와 1px 헤어라인 보더의 조합으로만 표현한다. 하드 오프셋 섀도, 컬러 글로우는 없다. 카드는 rest에서 `shadow-raised`(또는 보더만), hover에서 `-translate-y-0.5~-1` 리프트와 함께 한 단계 위 그림자로 응답한다. 헤더는 `bg-surface-raised/90` + `backdrop-blur-md`로 떠 있다.

### Shadow Vocabulary
- **raised** (`0 1px 2px rgb(26 28 26 / 0.04), 0 8px 24px rgb(26 28 26 / 0.06)`): 카드·검색바의 기본 부양.
- **lifted** (`0 2px 4px rgb(26 28 26 / 0.05), 0 16px 40px rgb(26 28 26 / 0.1)`): hover 응답 전용.

### Named Rules
**호버 리프트 규칙.** 클릭 가능한 카드의 hover는 항상 같은 문법이다: `-translate-y-0.5`(피드 카드는 `-1`) + 그림자 한 단계 상승 + (사진이 있으면) 이미지 `scale(1.03~1.05)`, duration 200ms/300ms. 새 카드도 이 문법을 그대로 쓴다.

## Shapes

라운드 스케일은 8/12/16/20px 토큰(`--fmp-radius-sm~xl`) 위에 있고, 실제 사용은 세 단계로 수렴한다: **버튼·썸네일 = 12px(rounded-xl)**, **카드 = 16px(rounded-2xl)**, **칩·배지·일시정지 버튼 = full(알약)**. 큰 섹션 컨테이너(상황별 안내)만 24px(rounded-3xl)로 한 단계 크다. 보더는 1px 헤어라인이 기본이고, "준비 중" 기능은 점선 보더(`border-dashed`) 알약이 고정 문법이다. 사선·클리핑·비대칭 실루엣은 쓰지 않는다.

## Components

### Buttons (`src/components/ui/button.tsx`이 캐논)
- **Shape:** 12px 라운드(rounded-xl), h-11 px-5 기본, sm은 h-9/8px, lg는 h-12 px-8.
- **Primary(default/action):** forest 배경 + 흰 semibold 14px, hover는 forest-strong.
- **Signal:** clay 배경 + 흰 글자 — 긴급 행동 전용.
- **Brand:** 카카오 노랑 + #191919 글자, hover는 `brightness-95`. 카카오 버튼에만.
- **Outline:** 헤어라인 보더, hover 시 `border-forest/40` + 그린 텍스트.
- **상태 문법:** `active:scale-[0.98]`, 150ms 전환, `focus-visible:ring-2 ring-ring offset-2`, disabled는 opacity 50.

### Status Chips / Badges
- **사진 위 배지:** 상태색 솔리드 배경 + 흰 12px bold, 알약, 사진 좌상단(`left-3 top-3`).
- **리스트 칩:** 상태색 10% 틴트 배경 + 상태색 텍스트(`bg-state-searching/10 text-state-searching`). 보호 중만 `bg-forest/10 text-forest-strong`(틴트 위 포레스트 강화 규칙).
- **속성 칩:** 캔버스 배경 + 세컨더리 텍스트 (성별·나이·체중).
- **사례금 배지:** `wine/10` 틴트 + wine 텍스트.
- **시간 단계 배너(STAGE_TONE):** 골든타임 그린 틴트 → 앰버 → 와인 → 디스트럭티브 → 뉴트럴로, 경과 시간에 따라 안내에서 경고로 옮겨가는 고정 5단계 톤.

### Cards (LostCard / AbandonmentCard)
- **Corner:** 16px. **구성:** 4:3 사진(캔버스 플레이스홀더) 위 상태 배지 → p-4 본문(제목 1줄 → 아이콘+장소/날짜 메타 → 설명 2줄 클램프).
- **Hover:** `-translate-y-1` + `border-clay/60` + shadow-raised + 이미지 scale 1.03.
- **빈 사진:** PawPrint 아이콘 + "등록된 사진이 없어요" — 빈 상태도 문장으로 말한다.

### Purpose Cards (홈 히어로 시그니처)
- "집을 잃었어요" 카드는 이 세계의 유일한 솔리드 forest 서피스(흰 글자, hover는 forest-strong). "가족을 기다려요" 카드는 흰 서피스 + 보더. 두 카드 모두 실데이터 썸네일 3장(12px 라운드, 정방형, 썸네일 dedupe)을 하단 스트립으로 깔아 사진이 카피를 증명한다. 그린 카드 위 썸네일은 `ring-1 ring-white/25`로 경계를 잡는다.

### Search
- **히어로 검색바:** h-14, 16px 라운드, shadow-raised, 좌측 돋보기 아이콘, 우측에 내장된 h-10 forest 제출 버튼(12px 라운드).
- **컴팩트(헤더):** h-9 상당, rounded-md, w-44→lg:w-64.

### Navigation
- 스티키 헤더: `bg-surface-raised/90 backdrop-blur-md` + 하단 헤어라인. 로고는 forest 정사각(8×8, 12px 라운드) 안 흰 PawPrint + extrabold 워드마크.
- 링크: 15px medium 세컨더리 텍스트, hover 시 캔버스 배경 + 프라이머리 텍스트. 모바일은 헤더 아래 풀폭 시트.

### MarqueeRail (자동 흐름 레일)
- GSAP 무한 루프(40px/s, linear), hover/포커스/포인터다운/일시정지 버튼(44px, `aria-pressed`)에서 정지. `prefers-reduced-motion`이거나 카드가 뷰포트를 못 채우면 네이티브 가로 스크롤로 강등. 복제 시퀀스는 `aria-hidden` + `tabIndex=-1`.

### 브라우저 서피스
- `::selection`은 forest 18% 틴트, 입력 캐럿은 forest, 전역 `:focus-visible`은 forest 2px 아웃라인(offset 2). 시스템 기본색이 새는 지점이 없어야 한다.

## Do's and Don'ts

### Do:
- **Do** 섹션 그라운드를 페이퍼(#FFFFFF)와 캔버스(#F7F7F5)로 교대시켜 리듬을 만든다.
- **Do** 카드형 정보는 사진(4:3) + 상태 배지 + 메타의 고정 위계로 조립한다 — 사진이 정보다.
- **Do** 인터랙티브 요소에 44px 터치 타깃과 forest 포커스 링을 보장한다 (axe AA 게이트 회귀 금지).
- **Do** 한국어 제목에 `break-keep`(+ 히어로는 `text-balance`)을 적용한다.
- **Do** 자동 모션에는 일시정지 컨트롤과 reduced-motion 강등 경로를 함께 만든다.
- **Do** 준비 중 기능은 점선 보더 알약 + "준비 중" 라벨로 정직하게 표기한다.
- **Do** 토큰 값을 바꾸면 `scripts/design-system-contract.test.mjs`를 같은 커밋에서 갱신한다.

### Don't:
- **Don't** 제목 위에 아이브로·키커(작은 라벨 줄)를 얹지 않는다 — 제목+세컨더리 문장 2줄 패턴이 유일한 섹션 헤더다.
- **Don't** 색 있는 좌측 보더 탭(`border-l-4`)을 상태 표현에 쓰지 않는다 — 상태는 배지·칩·틴트 배경으로 말한다.
- **Don't** 카카오 노랑(#FEE500)을 카카오 버튼 밖에서 쓰지 않는다.
- **Don't** 그린 틴트 위에 #0D8348 텍스트를 놓지 않는다 — forest-strong(#0A6B3B)만 허용.
- **Don't** 제2서체(세리프·디스플레이)나 글리프 장식을 도입하지 않는다.
- **Don't** 상태색 5종 매핑 밖의 색으로 상태를 발명하지 않는다.
- **Don't** 어두운 배경 섹션을 만들지 않는다 — 유일한 유채 솔리드 서피스는 히어로의 forest 목적 카드다.
