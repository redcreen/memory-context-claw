# Skip Builtin Memory-Search Checks In Release Preflight

## Context

`release-preflight` had already become the one-command CLI gate for repo regression, Stage 5 acceptance, host smoke, and deployment verification.

One part of that gate was heavier than it needed to be:

- `eval-memory-search-cases` still ran builtin OpenClaw `memory search` for every case
- `release-preflight` only used plugin-side expected-signal hits from that report
- the builtin comparison was useful for deeper investigation, but it was not part of the release decision itself

That left the gate slower than necessary and made it look like preflight was hanging, even though the extra work was not contributing to pass/fail.

## What Changed

Adjusted the gate instead of weakening the memory-search coverage.

Implementation changes:

- added `--skip-builtin` to `scripts/eval-memory-search-cases.js`
- when `--skip-builtin` is enabled, builtin OpenClaw search is recorded as `skipped: true` and the report stays structurally complete
- updated `scripts/run-release-preflight.js` to call `eval:memory-search:cases -- --skip-builtin`
- added a regression test proving the skip path still reports plugin hits and marks builtin checks as skipped

Documentation and control-surface changes:

- updated release-preflight reference docs to describe the plugin-only memory-search gate
- refreshed `.codex/status.md`, `.codex/plan.md`, and subproject status so maintainers do not assume preflight still includes builtin parity

## Key Decisions

1. Keep release-preflight aligned to release decisions, not every possible diagnostic comparison.
2. Preserve builtin OpenClaw search comparison as a separate deeper eval path instead of deleting it.
3. Treat this as a maintenance optimization, not a change to Stage 5 or release-boundary scope.

## Verification

- `node --test test/eval-memory-search-cases.test.js`
- `node scripts/eval-memory-search-cases.js --skip-builtin --only food-preference-recall,identity-name-recall`
- `npm run umc:openclaw-itest -- --format json`
- `node scripts/run-release-preflight.js --format json`

Final observed results:

- `node --test test/eval-memory-search-cases.test.js`: `pass`
- `node scripts/eval-memory-search-cases.js --skip-builtin --only food-preference-recall,identity-name-recall`: plugin hits `2/2`
- `npm run umc:openclaw-itest -- --format json`: `pass`
- `node scripts/run-release-preflight.js --format json`: `pass`
- `npm test`: `364/364`

## Outcome

`release-preflight` now stays focused on plugin-side memory-search regression and no longer spends release-gate time on builtin comparison that belongs to deeper diagnostics.

The heavier builtin comparison path still exists; it is simply no longer bundled into the one-command release gate.
