import { expect, test, type Page } from "@playwright/test";

import { sanitizeWebServerEnv } from "../../playwright.config";

const APP_ORIGIN = "http://127.0.0.1:4310";
const FIXTURE_ORIGIN = "http://127.0.0.1:4311";
const HOME_HEADING = "다시 만나는 길을, 동네와 함께.";
const CATEGORY_NAMES = [
  "집을 잃었어요",
  "보호소에서 가족을 기다려요",
  "우리집 근처 보호소",
  "반려동물을 입양하고 싶어요",
  "반려동물의 새 가족을 찾아요",
] as const;
const PLANNED_CATEGORY_NAMES = CATEGORY_NAMES.slice(2);
const NAVIGATION_NAMES = ["함께 찾기", "보호 동물", "보호소·입양", "이용 안내"] as const;

async function abortNonLoopback(page: Page) {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const allowed =
      url.hostname === "127.0.0.1" && (url.port === "4310" || url.port === "4311");
    if (allowed) await route.continue();
    else await route.abort("blockedbyclient");
  });
}

async function waitForScreenshotReadiness(page: Page) {
  await expect(page.getByRole("heading", { level: 1, name: HOME_HEADING })).toBeVisible();
  await expect(page.locator('[data-marquee-ready="true"]')).toBeVisible();
  await expect(page.getByText("지도 설정이 없어 목록으로 소식을 보여드려요.")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
}

test.beforeEach(async ({ page, request }) => {
  const response = await request.post(`${FIXTURE_ORIGIN}/__scenario`, {
    data: { scenario: "default" },
  });
  expect(response.ok()).toBeTruthy();
  await abortNonLoopback(page);
});

test("Next fixture environment removes every public integration variable", () => {
  expect(
    sanitizeWebServerEnv({
      PATH: "/synthetic/bin",
      FMP_E2E: "outer-value",
      NEXT_PUBLIC_KAKAO_JS_API_KEY: "synthetic-key",
      NEXT_PUBLIC_FUTURE_INTEGRATION_SECRET: "synthetic-future-key",
    }),
  ).toEqual({ PATH: "/synthetic/bin", FMP_E2E: "outer-value" });
});

test("home shell exposes the approved hierarchy and native search", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: HOME_HEADING })).toHaveCount(1);
  const categories = page.getByRole("navigation", { name: "찾아보기 목적" });
  for (const name of CATEGORY_NAMES) {
    await expect(categories.getByText(name, { exact: true })).toHaveCount(1);
  }
  await expect(categories.getByRole("listitem")).toHaveCount(5);
  for (const name of PLANNED_CATEGORY_NAMES) {
    const item = categories.getByRole("listitem").filter({ hasText: name });
    await expect(item).toHaveCount(1);
    await expect(item.getByRole("link")).toHaveCount(0);
  }

  const search = page.locator('form[role="search"]');
  await expect(search).toHaveAttribute("method", "get");
  await expect(search).toHaveAttribute("action", "/search");
  await expect(search.locator('input[type="search"]')).toHaveAttribute("name", "q");
  await expect(page.getByText("FAQ", { exact: true })).toHaveCount(0);
});

test("keyboard order starts with skip link, logo, and the four global groups", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "본문으로 바로가기" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Find My Pet" })).toBeFocused();
  for (const name of NAVIGATION_NAMES) {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name, exact: true })).toBeFocused();
  }
});

test("home remains useful without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: APP_ORIGIN,
    javaScriptEnabled: false,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    colorScheme: "light",
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  await abortNonLoopback(page);

  try {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: HOME_HEADING })).toBeVisible();
    const purposeLinks = page.getByRole("navigation", { name: "찾아보기 목적" });
    await expect(purposeLinks.getByRole("link")).toHaveCount(2);
    await expect(purposeLinks.getByRole("link", { name: "집을 잃었어요" })).toHaveAttribute(
      "href",
      "/lost",
    );
    await expect(
      purposeLinks.getByRole("link", { name: "보호소에서 가족을 기다려요" }),
    ).toHaveAttribute("href", "/abandonment");
    const guide = page.getByRole("region", { name: "상황별 반려동물 안내" });
    for (const [name, href] of [
      ["첫 수색 순서 보기", "/guide#수색"],
      ["반환 절차 보기", "/faq#shelter-return"],
      ["입양 과정 보기", "/faq#adoption-process"],
      ["예방 방법 보기", "/posts/dog-escape-while-walking"],
    ] as const) {
      await expect(guide.getByRole("link", { name })).toHaveAttribute("href", href);
    }

    const search = page.locator('form[role="search"]');
    await expect(search).toHaveAttribute("method", "get");
    await expect(search).toHaveAttribute("action", "/search");
    await expect(search.locator('input[type="search"]')).toHaveAttribute("name", "q");

    const original = page.locator('[data-marquee-sequence="original"]');
    await expect(original.getByRole("link")).toHaveCount(8);
    await expect(page.locator('[data-marquee-sequence="duplicate"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: /소식 자동 이동/ })).toHaveCount(0);

    const query = "서울 E2E";
    const searchInput = search.locator('input[type="search"]');
    await searchInput.fill(query);
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/search" && url.searchParams.get("q") === query),
      search.getByRole("button", { name: "검색", exact: true }).click(),
    ]);
    const navigated = new URL(page.url());
    expect(navigated.pathname).toBe("/search");
    expect(navigated.searchParams.get("q")).toBe(query);
    expect(page.url()).toContain("/search?q=%EC%84%9C%EC%9A%B8+E2E");
  } finally {
    await context.close();
  }
});

test("fixture rejects malformed control input and exposes exact CORS", async ({ request }) => {
  const preflight = await request.fetch(`${FIXTURE_ORIGIN}/api/v1/posts`, {
    method: "OPTIONS",
    headers: { Origin: APP_ORIGIN, "Access-Control-Request-Headers": "Content-Type" },
  });
  expect(preflight.status()).toBe(204);
  expect(preflight.headers()["access-control-allow-origin"]).toBe(APP_ORIGIN);
  expect(preflight.headers()["access-control-allow-credentials"]).toBe("true");
  expect(preflight.headers()["access-control-allow-methods"]).toBe("GET, POST, OPTIONS");
  expect(preflight.headers()["access-control-allow-headers"]).toBe("Content-Type");
  expect(preflight.headers().vary).toBe("Origin");
  expect(preflight.headers()["cache-control"]).toBe("no-store");

  const malformed = await request.post(`${FIXTURE_ORIGIN}/__scenario`, {
    headers: { "Content-Type": "application/json" },
    data: Buffer.from("{"),
  });
  expect(malformed.status()).toBe(400);
  const invalidScenario = await request.post(`${FIXTURE_ORIGIN}/__scenario`, {
    data: { scenario: "unknown" },
  });
  expect(invalidScenario.status()).toBe(422);
  const blankCoordinates = await request.get(
    `${FIXTURE_ORIGIN}/api/v1/posts/nearby?lat=&lng=&radiusKm=3&pageSize=20&pageOffset=0`,
  );
  expect(blankCoordinates.status()).toBe(400);
});

test("reviewed desktop screenshot", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForScreenshotReadiness(page);
  await expect(page).toHaveScreenshot("home-desktop.png", {
    fullPage: true,
  });
});

test("reviewed mobile screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForScreenshotReadiness(page);
  await expect(page).toHaveScreenshot("home-mobile.png", {
    fullPage: true,
  });
});
