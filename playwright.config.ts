import { defineConfig, devices } from "@playwright/test";

const APP_ORIGIN = "http://127.0.0.1:4310";
const FIXTURE_ORIGIN = "http://127.0.0.1:4311";

export function sanitizeWebServerEnv(
  env: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && !entry[0].startsWith("NEXT_PUBLIC_"),
    ),
  );
}

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/playwright",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.001,
    },
  },
  use: {
    baseURL: APP_ORIGIN,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    colorScheme: "light",
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1200 },
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: [
    {
      command: "node scripts/fixtures/home-api-server.mjs",
      url: `${FIXTURE_ORIGIN}/__health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "corepack yarn next dev --hostname 127.0.0.1 --port 4310",
      url: APP_ORIGIN,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...sanitizeWebServerEnv(process.env),
        FMP_E2E: "1",
        NEXT_PUBLIC_API_BASE_URL: `${FIXTURE_ORIGIN}/api/v1`,
        NEXT_PUBLIC_ADFIT_UNIT_FEED: "",
        NEXT_PUBLIC_ADFIT_UNIT_FOOTER_MOBILE: "",
        NEXT_PUBLIC_ADFIT_UNIT_FOOTER_MOBILE_SIZE: "",
        NEXT_PUBLIC_ADFIT_UNIT_FOOTER_PC: "",
        NEXT_PUBLIC_ADFIT_UNIT_FOOTER_PC_SIZE: "",
        NEXT_PUBLIC_ADSENSE_CLIENT: "",
        NEXT_PUBLIC_ADSENSE_CLIENT_ID: "",
        NEXT_PUBLIC_ADSENSE_SLOT_FEED: "",
        NEXT_PUBLIC_AUTH_URL: "",
        NEXT_PUBLIC_GOOGLE_ANALYTICS: "",
        NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: "",
        NEXT_PUBLIC_KAKAO_JS_API_KEY: "",
        NEXT_PUBLIC_KAKAO_REST_API_KEY: "",
        NEXT_PUBLIC_NAVER_SITE_VERIFICATION: "",
        NEXT_PUBLIC_REDIRECT_URI: "",
      },
    },
  ],
});
