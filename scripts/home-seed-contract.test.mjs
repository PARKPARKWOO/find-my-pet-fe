import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadTypeScriptModule } from "./test-utils/load-typescript-module.mjs";

const homeSeedPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/lib/homeSeed.ts",
);

const DEFAULT_KEY = "lost:standard:page=1:size=5";

function decide(state, input) {
  const { decideHomeSeedRequest } = loadTypeScriptModule(homeSeedPath);
  return decideHomeSeedRequest(state, input);
}

test("matching server seed is consumed without a request, including StrictMode replay", () => {
  const state = { seededRequestKey: DEFAULT_KEY, previousRequestKey: DEFAULT_KEY };

  const first = decide(state, { requestKey: DEFAULT_KEY, retryRequested: false });
  const second = decide(first.state, { requestKey: DEFAULT_KEY, retryRequested: false });

  assert.equal(first.shouldFetch, false);
  assert.equal(second.shouldFetch, false);
  assert.equal(second.state.seededRequestKey, DEFAULT_KEY);
});

test("a missing seed always fetches", () => {
  const decision = decide(
    { seededRequestKey: null, previousRequestKey: DEFAULT_KEY },
    { requestKey: DEFAULT_KEY, retryRequested: false },
  );

  assert.equal(decision.shouldFetch, true);
  assert.equal(decision.state.seededRequestKey, null);
});

test("a retry permanently invalidates the server seed", () => {
  const decision = decide(
    { seededRequestKey: DEFAULT_KEY, previousRequestKey: DEFAULT_KEY },
    { requestKey: DEFAULT_KEY, retryRequested: true },
  );

  assert.equal(decision.shouldFetch, true);
  assert.equal(decision.state.seededRequestKey, null);
});

test("visiting another request key prevents returning to the original seed", () => {
  const state = { seededRequestKey: DEFAULT_KEY, previousRequestKey: DEFAULT_KEY };
  const differentKey = "lost:standard:page=2:size=5";

  const changed = decide(state, { requestKey: differentKey, retryRequested: false });
  const returned = decide(changed.state, { requestKey: DEFAULT_KEY, retryRequested: false });

  assert.equal(changed.shouldFetch, true);
  assert.equal(changed.state.seededRequestKey, null);
  assert.equal(returned.shouldFetch, true);
  assert.equal(returned.state.seededRequestKey, null);
});

test("a seed for a different request key fetches and is invalidated", () => {
  const decision = decide(
    { seededRequestKey: "lost:standard:page=2:size=5", previousRequestKey: DEFAULT_KEY },
    { requestKey: DEFAULT_KEY, retryRequested: false },
  );

  assert.equal(decision.shouldFetch, true);
  assert.equal(decision.state.seededRequestKey, null);
});
