import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const FIXTURE_ORIGIN = "http://127.0.0.1:4311";
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function formatContrastNodes(result: Awaited<ReturnType<AxeBuilder["analyze"]>>) {
  return result.violations.flatMap((violation) =>
    violation.nodes.map((node) => {
      const data = node.any.find((check) => check.id === "color-contrast")?.data as
        | {
            fgColor?: string;
            bgColor?: string;
            contrastRatio?: number;
            expectedContrastRatio?: string;
          }
        | undefined;
      return {
        target: node.target.join(" "),
        foreground: data?.fgColor,
        background: data?.bgColor,
        ratio: data?.contrastRatio,
        expected: data?.expectedContrastRatio,
      };
    }),
  );
}

async function expectNoContrastViolations(page: Page, label: string) {
  const result = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  const serious = result.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(
    serious.length,
    `${label} contrast nodes:\n${JSON.stringify(formatContrastNodes(result), null, 2)}`,
  ).toBe(0);
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

async function expectNoHighImpactViolations(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('[data-marquee-ready="true"]')).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const violations = result.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

test.beforeEach(async ({ page, request }) => {
  const response = await request.post(`${FIXTURE_ORIGIN}/__scenario`, {
    data: { scenario: "default" },
  });
  expect(response.ok()).toBeTruthy();
  await abortNonLoopback(page);
});

test("desktop has no serious or critical WCAG 2/2.1 A/AA axe violations", async ({ page }) => {
  await expectNoHighImpactViolations(page);
});

test("390px mobile has no serious or critical WCAG 2/2.1 A/AA axe violations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHighImpactViolations(page);
});

test("home text colors meet WCAG AA at desktop and mobile", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 1200 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoContrastViolations(page, `${viewport.width}px`);
  }
});

test("active nearby filter remains readable", async ({ context, page }) => {
  await context.grantPermissions(["geolocation"], { origin: "http://127.0.0.1:4310" });
  await context.setGeolocation({ latitude: 37.5665, longitude: 126.978 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const activeRadius = page.getByRole("button", { name: "3km", exact: true });
  await activeRadius.click();
  await expect(activeRadius).toBeEnabled();
  await page.getByRole("button", { name: "내 위치로 가까운 소식 보기" }).click();
  await expect(page.getByRole("list", { name: "가까운 공개 위치 소식" })).toBeVisible();
  await expectNoContrastViolations(page, "active nearby filter");
});

test("home feed error retries remain readable", async ({ page, request }) => {
  const response = await request.post(`${FIXTURE_ORIGIN}/__scenario`, {
    data: { scenario: "all-fail" },
  });
  expect(response.ok()).toBeTruthy();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "다시 시도" })).toHaveCount(2);
  await expectNoContrastViolations(page, "home feed error retries");
});
