import assert from "node:assert/strict";
import test from "node:test";

import nextConfig from "../next.config.mjs";

test("serves source images without the Vercel optimizer", () => {
  assert.equal(
    nextConfig.images?.unoptimized,
    true,
    "images must bypass /_next/image while the optimizer returns payment-required",
  );
});
