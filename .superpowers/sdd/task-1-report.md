# Design Task 1 report — Stage 0 baseline and prerequisite checkpoint

## Status

Completed the available, truthfully verifiable portion of Design Task 1.

- Baseline document committed as `c29113d docs: capture fmp design baseline`.
- Approved pre-plan category/status/account work committed as `697b90d feat: checkpoint fmp category and account updates`.
- No product code was authored for the design slice; the second commit contains only the reviewed, already-present prerequisite set.
- `.superpowers/` and `docs/superpowers/plans/` were not included in the prerequisite checkpoint.

## Baseline artifact

- Created and committed: `docs/superpowers/baselines/2026-07-30-fmp-stage0.md`
- Requested image files were deliberately not created. The required browser-control runtime reported zero available browser backends, so rendered 1440×1200 and 390×844 captures could not be made truthfully. The baseline document marks `/`, `/lost`, `/abandonment`, `/register`, `/profile`, and detail appearance as unverified instead of substituting mock or blank images.
- A local server started at `http://127.0.0.1:3000`; HTTP 200 was observed for `/`, `/lost`, `/abandonment`, and `/register`. The committed baseline has no recorded HTTP observation for `/profile`; that route remains unverified. These are not visual, API, or authentication verifications.

## Dirty-worktree boundary

Before baseline capture, the worktree contained 21 modified product paths and the pre-existing untracked category/status/account modules and tests, plus `.superpowers/` workspace material. The full list is recorded in the committed baseline document. The staged prerequisite snapshot contained exactly 30 paths from the brief's allowlist; no unrelated paths were found or staged.

## Commands and results

### Executable baseline

| Command | Result |
| --- | --- |
| `corepack yarn test:category` | Pass: 9 tests. |
| `corepack yarn tsc --noEmit` | Pass. |
| `corepack yarn lint` | Exit 0 with five existing warnings: three hook-dependency warnings and two `no-img-element` warnings. |
| `corepack yarn build` | Exit 0; preserves the same five warnings. Static generation logged DNS `ENOTFOUND fmp.platformholder.site` failures in the sandbox but completed 21/21 pages. |

### Prerequisite checkpoint verification

| Command | Result |
| --- | --- |
| `git diff --check` | Pass. |
| `corepack yarn test:category` | Pass: 9 tests. |
| `corepack yarn node --test scripts/abandonment-status-contract.test.mjs` | Pass: 7 tests. |
| `corepack yarn typecheck` | Not available: package has no `typecheck` script (exit 1, `Command "typecheck" not found`). |
| `corepack yarn tsc --noEmit` | Pass; executed as the direct equivalent already used for the baseline and staged snapshot verification. |
| `corepack yarn lint` | Exit 0 with the same five existing warnings. |
| `git diff --cached --check` | Pass before commit. |
| `git diff --cached --stat` | 30 paths, 1,250 insertions, 146 deletions; exact allowlist only. |
| `corepack yarn test:category` (staged snapshot) | Pass: 9 tests. |
| `corepack yarn tsc --noEmit` (staged snapshot) | Pass. |

## Reviewed prerequisite contents

The checkpoint coherently groups the previously documented Category Tasks 1–3 and account/status work:

- purpose-category navigation plus distinct lost/abandonment index routes and discovery metadata;
- list loading/error/empty states, canonical/clamped pagination, region-request cancellation, semantic filters, and accessible pagination controls;
- backend-authoritative `noticeClosed` handling for listing, detail messaging, sitemap/IndexNow, and status-neutral explanatory copy;
- withdraw preview/destruction flow and auth/cache handling;
- direct Node contract tests for category behavior and abandonment-status behavior.

## Self-review

- Compared the staged path list against the task brief's explicit `git add --` list; they match exactly.
- Examined the existing tracked diff and every existing untracked source/test module before staging. Their purpose matches `.superpowers/sdd/progress.md`'s completed Category Tasks 1–3 and the approved status/account scope.
- Ran unstaged and staged whitespace checks; neither reported issues.
- Confirmed after both commits that only untracked `.superpowers/` content remains; it was not staged or committed.
- Did not modify `gradle.properties`, product code beyond the reviewed prerequisite diff, plans, credentials, deployment settings, or external services.

## Concerns / follow-up

1. Complete the ten visual baseline captures later in an environment with an available browser backend. Preserve the actual API/login/error state, and amend or add a follow-up baseline commit rather than fabricating images.
2. The task brief calls `corepack yarn typecheck`, but `package.json` has no `typecheck` script. `corepack yarn tsc --noEmit` passes and was used as the direct verification fallback. Adding a script was out of this task's permitted prerequisite diff.
3. The sandbox cannot resolve `fmp.platformholder.site`; build succeeds using application fallback behavior, but live API/auth visual state remains unverified.

## Design Task 1 review fixes — 2026-08-01

### Corrections and implementation

- Corrected the prior report's unsupported `/profile` HTTP 200 claim to match the committed baseline artifact, which records only `/`, `/lost`, `/abandonment`, and `/register` observations.
- Updated `/faq` visible answer and its FAQPage JSON-LD source (`FAQS`) to state that `OPEN` is the default list view, `CLOSED` and `ALL` keep closed notices browsable with context, and a closed notice does not establish the animal's current outcome.
- Extracted the `WithdrawSection` irreversible sequence into dependency-injected `src/lib/withdrawalFlow.ts`. Its discriminated result distinguishes `completed`, `data-destruction` failure, and `account-withdrawal` failure; the component consumes that result for retry state and user guidance.
- The flow blocks Auth withdrawal if service-data destruction fails, preserves `dataDestroyed: true` after an Auth failure so retry skips destruction, and classifies 401/403 through the injected unauthorized predicate for either phase.
- PRD sync reviewed `prd/find-my-pet/requirements.md` and `api-spec.md`; both now document the implemented failure, retry, and unauthorized-classification rules. No API endpoint shape changed.

### TDD evidence

| Phase | Command | Output summary |
| --- | --- | --- |
| RED | `corepack yarn node --test scripts/withdrawal-flow.test.mjs` | Expected exit 1: 0 pass / 5 fail because `withdrawal flow module must exist`. No production flow module existed yet. |
| GREEN | `corepack yarn test:withdrawal-flow` | Exit 0: 5/5 pass — destruction-before-withdrawal order, first-step block, second-step result, retry skip, and unauthorized classification for both phases. |

### Verification and self-review

| Command | Output summary |
| --- | --- |
| `corepack yarn test:withdrawal-flow` | Exit 0; 5 tests passed. |
| `corepack yarn test:category` | Exit 0; 9 tests passed. |
| `corepack yarn test:abandonment-status` | Exit 0; 7 tests passed. |
| `corepack yarn tsc --noEmit` | Exit 0. |
| `corepack yarn lint` | Exit 0; retains five pre-existing warnings (three hook dependencies, two `no-img-element`). |
| `git diff --check` | Exit 0. |

Self-review confirmed the component invokes the pure flow rather than duplicating the two calls, FAQ JSON-LD is derived from the corrected same answer source, and no runtime status claim was added for `/profile`.
