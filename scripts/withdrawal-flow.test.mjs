import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadTypeScriptModule } from "./test-utils/load-typescript-module.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flowPath = path.join(projectRoot, "src/lib/withdrawalFlow.ts");

function getFlow() {
  assert.ok(fs.existsSync(flowPath), "withdrawal flow module must exist");
  return loadTypeScriptModule(flowPath);
}

function createDependencies({ destroyData, withdrawAccount, isUnauthorizedError = () => false }) {
  return { destroyData, withdrawAccount, isUnauthorizedError };
}

test("destroys service data before withdrawing the account", async () => {
  const { runWithdrawalFlow } = getFlow();
  const calls = [];
  const result = await runWithdrawalFlow(
    { dataDestroyed: false },
    createDependencies({
      destroyData: async () => calls.push("destroy"),
      withdrawAccount: async () => calls.push("withdraw"),
    }),
  );

  assert.deepEqual(calls, ["destroy", "withdraw"]);
  assert.deepEqual(result, { kind: "completed", dataDestroyed: true });
});

test("blocks account withdrawal when data destruction fails", async () => {
  const { runWithdrawalFlow } = getFlow();
  const calls = [];
  const destroyError = new Error("destroy failed");
  const result = await runWithdrawalFlow(
    { dataDestroyed: false },
    createDependencies({
      destroyData: async () => {
        calls.push("destroy");
        throw destroyError;
      },
      withdrawAccount: async () => calls.push("withdraw"),
    }),
  );

  assert.deepEqual(calls, ["destroy"]);
  assert.deepEqual(result, {
    kind: "failed",
    phase: "data-destruction",
    dataDestroyed: false,
    unauthorized: false,
  });
});

test("reports an account-withdrawal failure after data destruction", async () => {
  const { runWithdrawalFlow } = getFlow();
  const withdrawalError = new Error("withdraw failed");
  const result = await runWithdrawalFlow(
    { dataDestroyed: false },
    createDependencies({
      destroyData: async () => undefined,
      withdrawAccount: async () => {
        throw withdrawalError;
      },
    }),
  );

  assert.deepEqual(result, {
    kind: "failed",
    phase: "account-withdrawal",
    dataDestroyed: true,
    unauthorized: false,
  });
});

test("retries only account withdrawal after data destruction completed", async () => {
  const { runWithdrawalFlow } = getFlow();
  const calls = [];
  const firstAttempt = await runWithdrawalFlow(
    { dataDestroyed: false },
    createDependencies({
      destroyData: async () => calls.push("destroy"),
      withdrawAccount: async () => {
        calls.push("withdraw:first");
        throw new Error("temporary failure");
      },
    }),
  );
  const retry = await runWithdrawalFlow(
    { dataDestroyed: firstAttempt.dataDestroyed },
    createDependencies({
      destroyData: async () => calls.push("destroy:retry"),
      withdrawAccount: async () => calls.push("withdraw:retry"),
    }),
  );

  assert.deepEqual(calls, ["destroy", "withdraw:first", "withdraw:retry"]);
  assert.deepEqual(retry, { kind: "completed", dataDestroyed: true });
});

test("classifies unauthorized failures for both phases", async () => {
  const { runWithdrawalFlow } = getFlow();
  const dataError = new Error("data unauthorized");
  const accountError = new Error("account unauthorized");
  const dependencies = (destroyData, withdrawAccount) =>
    createDependencies({
      destroyData,
      withdrawAccount,
      isUnauthorizedError: (error) => error === dataError || error === accountError,
    });

  const dataFailure = await runWithdrawalFlow(
    { dataDestroyed: false },
    dependencies(
      async () => {
        throw dataError;
      },
      async () => undefined,
    ),
  );
  const accountFailure = await runWithdrawalFlow(
    { dataDestroyed: false },
    dependencies(
      async () => undefined,
      async () => {
        throw accountError;
      },
    ),
  );

  assert.deepEqual(dataFailure, {
    kind: "failed",
    phase: "data-destruction",
    dataDestroyed: false,
    unauthorized: true,
  });
  assert.deepEqual(accountFailure, {
    kind: "failed",
    phase: "account-withdrawal",
    dataDestroyed: true,
    unauthorized: true,
  });
});
