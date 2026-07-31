export interface HomeSeedGateState {
  seededRequestKey: string | null;
  previousRequestKey: string;
}

export interface HomeSeedGateDecision {
  state: HomeSeedGateState;
  shouldFetch: boolean;
}

export function decideHomeSeedRequest(
  state: HomeSeedGateState,
  input: { requestKey: string; retryRequested: boolean },
): HomeSeedGateDecision {
  const requestKeyChanged = state.previousRequestKey !== input.requestKey;
  const canUseSeed =
    !input.retryRequested &&
    !requestKeyChanged &&
    state.seededRequestKey === input.requestKey;

  return {
    shouldFetch: !canUseSeed,
    state: {
      previousRequestKey: input.requestKey,
      seededRequestKey: canUseSeed ? state.seededRequestKey : null,
    },
  };
}
