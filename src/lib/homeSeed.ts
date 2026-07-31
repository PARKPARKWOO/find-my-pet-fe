import type { HomeListSeed } from "@/lib/homeFeed";

export interface HomeSeedGateState {
  seededRequestKey: string | null;
  previousRequestKey: string;
}

export interface HomeSeedGateDecision {
  state: HomeSeedGateState;
  shouldFetch: boolean;
}

export function validateHomeListSeed<T>(
  initialPage: HomeListSeed<T> | undefined,
  input: {
    isCanonicalRequest: boolean;
    expectedRequestKey: string;
    currentRequestKey: string;
  },
): HomeListSeed<T> | undefined {
  return input.isCanonicalRequest &&
    initialPage?.requestKey === input.expectedRequestKey &&
    input.currentRequestKey === input.expectedRequestKey
    ? initialPage
    : undefined;
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
