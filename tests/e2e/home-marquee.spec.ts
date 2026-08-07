import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";

const FIXTURE_ORIGIN = "http://127.0.0.1:4311";

type RequestSnapshot = {
  scenario: string;
  counts: Record<string, number>;
  queries: Record<string, Array<Record<string, string>>>;
};

async function setScenario(request: APIRequestContext, scenario: string) {
  const response = await request.post(`${FIXTURE_ORIGIN}/__scenario`, {
    data: { scenario },
  });
  expect(response.ok()).toBeTruthy();
}

async function getRequests(request: APIRequestContext): Promise<RequestSnapshot> {
  const response = await request.get(`${FIXTURE_ORIGIN}/__requests`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function abortNonLoopback(page: Page) {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const allowed =
      url.hostname === "127.0.0.1" && (url.port === "4310" || url.port === "4311");
    if (allowed) await route.continue();
    else await route.abort("blockedbyclient");
  });
}

async function afterTwoFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

async function translationX(track: Locator) {
  return track.evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return matrix.m41;
  });
}

async function expectMoving(page: Page, track: Locator) {
  await expect.poll(() => track.evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
  const first = await translationX(track);
  await page.waitForTimeout(250);
  const second = await translationX(track);
  expect(Math.abs(second - first)).toBeGreaterThan(2);
}

async function expectStoppedAfterSettling(page: Page, track: Locator) {
  await afterTwoFrames(page);
  const first = await translationX(track);
  await afterTwoFrames(page);
  const second = await translationX(track);
  expect(Math.abs(second - first)).toBeLessThanOrEqual(0.5);
}

test.beforeEach(async ({ page, request }) => {
  await setScenario(request, "default");
  await abortNonLoopback(page);
});

test("overflowing marquee clones only presentation and honors every stop reason", async ({ page }) => {
  await page.goto("/");

  const viewport = page.locator("[data-marquee-viewport]");
  const track = page.locator("[data-marquee-track]");
  const original = page.locator('[data-marquee-sequence="original"]');
  const duplicate = page.locator('[data-marquee-sequence="duplicate"]');
  const pause = page.getByRole("button", { name: /소식 자동 이동 (?:멈추기|다시 재생)/ });
  await expect(viewport).toHaveAttribute("data-marquee-ready", "true");
  await expect(original).toHaveCount(1);
  await expect(duplicate).toHaveCount(1);
  await expect(duplicate).toHaveAttribute("aria-hidden", "true");
  const originalLinks = original.getByRole("link");
  const duplicateLinks = duplicate.locator("a");
  await expect(originalLinks).toHaveCount(8);
  await expect(duplicateLinks).toHaveCount(8);
  for (const link of await duplicateLinks.all()) await expect(link).toHaveAttribute("tabindex", "-1");

  // 리뉴얼로 검색이 히어로로 이동 — 레일 자체의 키보드 순서 불변식만 검증한다:
  // 원본 링크들이 순서대로 탭되고(중복은 tabindex=-1로 건너뜀) 마지막에 정지 버튼이 온다.
  await originalLinks.first().focus();
  await expect(originalLinks.first()).toBeFocused();
  for (let index = 1; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    await expect(originalLinks.nth(index)).toBeFocused();
  }
  await page.keyboard.press("Tab");
  await expect(pause).toBeFocused();

  await page.getByRole("heading", { level: 1 }).hover();
  await expectMoving(page, track);
  await viewport.hover();
  await expectStoppedAfterSettling(page, track);
  await page.getByRole("heading", { level: 1 }).hover();
  await expectMoving(page, track);

  await viewport.evaluate((element) => {
    const originalSetPointerCapture = element.setPointerCapture;
    element.setPointerCapture = () => undefined;
    element.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, pointerId: 77, pointerType: "touch" }),
    );
    element.setPointerCapture = originalSetPointerCapture;
  });
  await afterTwoFrames(page);
  await expectStoppedAfterSettling(page, track);
  await viewport.dispatchEvent("pointercancel", { pointerId: 77, pointerType: "touch" });
  await expectMoving(page, track);

  await originalLinks.first().focus();
  await expectStoppedAfterSettling(page, track);
  await pause.focus();
  await expectMoving(page, track);

  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await expect(pause).toHaveAccessibleName("소식 자동 이동 다시 재생");
  await expectStoppedAfterSettling(page, track);
  await viewport.hover();
  await page.getByRole("heading", { level: 1 }).hover();
  await expectStoppedAfterSettling(page, track);
  await originalLinks.first().focus();
  await pause.focus();
  await expectStoppedAfterSettling(page, track);
  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  await expect(pause).toHaveAccessibleName("소식 자동 이동 멈추기");
  await expectMoving(page, track);
});

test("short data stays a single static original", async ({ page, request }) => {
  await setScenario(request, "short");
  await page.goto("/");

  const viewport = page.locator("[data-marquee-viewport]");
  await expect(viewport).toHaveAttribute("data-marquee-ready", "true");
  await expect(page.locator('[data-marquee-sequence="original"] a')).toHaveCount(1);
  await expect(page.locator('[data-marquee-sequence="duplicate"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: /소식 자동 이동/ })).toHaveCount(0);
});

test("one failed source preserves four abandonment links", async ({ page, request }) => {
  await setScenario(request, "one-source-fails");
  await page.goto("/");

  const original = page.locator('[data-marquee-sequence="original"]');
  await expect(page.locator("[data-marquee-viewport]")).toHaveAttribute("data-marquee-ready", "true");
  await expect(original.getByRole("link")).toHaveCount(4);
  for (const link of await original.getByRole("link").all()) {
    await expect(link).toHaveAttribute("href", /\/abandonment\//);
  }
});

test("all failed home sources omit the latest-news region", async ({ page, request }) => {
  await setScenario(request, "all-fail");
  await page.goto("/");

  await expect(page.getByRole("region", { name: "새로 이어지는 소식" })).toHaveCount(0);
  await expect(page.locator("[data-marquee-viewport]")).toHaveCount(0);
});

test("location lookup makes one exact request and renders only public statuses", async ({
  context,
  page,
  request,
}) => {
  await context.grantPermissions(["geolocation"], { origin: "http://127.0.0.1:4310" });
  await context.setGeolocation({ latitude: 37.5665, longitude: 126.978 });
  await page.goto("/");

  const before = await getRequests(request);
  expect(before.counts["/api/v1/posts/nearby"]).toBe(0);
  await page.getByRole("button", { name: "내 위치로 가까운 소식 보기" }).click();
  const list = page.getByRole("list", { name: "가까운 공개 위치 소식" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("link")).toHaveCount(2);
  await expect(list.getByText("E2E 가까운 실종 강아지", { exact: true })).toBeVisible();
  await expect(list.getByText("E2E 가까운 목격 고양이", { exact: true })).toBeVisible();
  await expect(list.getByText("E2E 제외된 발견 강아지", { exact: true })).toHaveCount(0);
  await expect(list.getByText("찾는 중", { exact: true })).toHaveCount(1);
  await expect(list.getByText("목격", { exact: true })).toHaveCount(1);
  await expect(page.getByText("지도 설정이 없어 목록으로 소식을 보여드려요.")).toBeVisible();
  await expect(page.getByRole("img", { name: /보조 지도/ })).toHaveCount(0);

  await expect
    .poll(async () => (await getRequests(request)).counts["/api/v1/posts/nearby"])
    .toBe(1);
  const after = await getRequests(request);
  expect(after.queries["/api/v1/posts/nearby"]).toEqual([
    {
      lat: "37.5665",
      lng: "126.978",
      radiusKm: "3",
      pageSize: "20",
      pageOffset: "0",
    },
  ]);
});

test("denied geolocation stays local and sends no nearby request", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "내 위치로 가까운 소식 보기" }).click();

  await expect(
    page.getByText(
      "위치 권한이 허용되지 않았어요. 브라우저 설정을 확인한 뒤 다시 시도해 주세요.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByRole("list", { name: "가까운 공개 위치 소식" })).toHaveCount(0);
  await expect(page.getByRole("img", { name: /보조 지도/ })).toHaveCount(0);
  const requests = await getRequests(request);
  expect(requests.counts["/api/v1/posts/nearby"]).toBe(0);
});

test("reduced motion keeps the rail and home runtime static", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const viewport = page.locator("[data-marquee-viewport]");
  const track = page.locator("[data-marquee-track]");
  await expect(viewport).toHaveAttribute("data-marquee-ready", "true");
  await expect(page.locator('[data-marquee-sequence="original"]')).toHaveCount(1);
  await expect(page.locator('[data-marquee-sequence="duplicate"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: /소식 자동 이동/ })).toHaveCount(0);
  await expectStoppedAfterSettling(page, track);
  await expect(page.locator("html")).not.toHaveAttribute("data-home-motion", "active");
  expect(await page.locator("html").evaluate((element) => element.classList.contains("lenis"))).toBeFalsy();
});
