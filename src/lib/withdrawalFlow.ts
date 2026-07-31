/** Dependencies are injected so the irreversible order is independently testable. */
export interface WithdrawalFlowDependencies {
  destroyData: () => Promise<void>;
  withdrawAccount: () => Promise<void>;
  isUnauthorizedError: (error: unknown) => boolean;
}

export interface WithdrawalFlowState {
  /** True only after the Find My Pet data-destruction request has succeeded. */
  dataDestroyed: boolean;
}

export type WithdrawalFlowResult =
  | { kind: "completed"; dataDestroyed: true }
  | {
      kind: "failed";
      phase: "data-destruction" | "account-withdrawal";
      dataDestroyed: boolean;
      unauthorized: boolean;
    };

/**
 * Runs the irreversible withdrawal steps in their only safe order.
 *
 * A failed account withdrawal returns `dataDestroyed: true`, allowing a retry to
 * finish only that remaining step without attempting to destroy data again.
 */
export async function runWithdrawalFlow(
  state: WithdrawalFlowState,
  dependencies: WithdrawalFlowDependencies,
): Promise<WithdrawalFlowResult> {
  if (!state.dataDestroyed) {
    try {
      await dependencies.destroyData();
    } catch (error) {
      return {
        kind: "failed",
        phase: "data-destruction",
        dataDestroyed: false,
        unauthorized: dependencies.isUnauthorizedError(error),
      };
    }
  }

  try {
    await dependencies.withdrawAccount();
  } catch (error) {
    return {
      kind: "failed",
      phase: "account-withdrawal",
      dataDestroyed: true,
      unauthorized: dependencies.isUnauthorizedError(error),
    };
  }

  return { kind: "completed", dataDestroyed: true };
}
