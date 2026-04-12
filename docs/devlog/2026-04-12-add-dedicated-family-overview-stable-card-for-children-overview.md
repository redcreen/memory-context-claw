# Add dedicated family-overview stable card for children overview queries

- Date: 2026-04-12
- Status: resolved

## Problem

The recall-quality slice had already fixed the false pass where `children-overview` was truncated by path diversity, but the query still depended on two same-path family cards. That kept governance at `multiCard`, which meant the query was still not converged as a true single-card stable fact and could not cleanly enter smoke-promotion.

## Thinking

The correct layer was stable fact extraction, not a looser promotion rule. When one daily memory file already contains both child profiles, the plugin should synthesize a dedicated family-overview card there and let `children-overview` resolve through that direct fact. The assembly-level same-path dual-card override remains useful, but only as a fallback for older card sets that do not yet have the overview card.

## Solution

Updated `buildStableMemoryCardsFromMarkdown` to emit a `family-overview` stable card whenever one stable memory file contains both daughter and son profile facts. Adjusted card-artifact ranking so `children` overview intent explicitly prefers that overview card, and tightened assembly so the same-path dual-card override is skipped when a dedicated overview card is present. Added a new smoke case for `children-overview` and expanded tests to lock the new extraction, ranking, and single-card assembly behavior.

## Validation

`node --test test/retrieval.test.js test/assembly.test.js` passed (`85/85`). Targeted `npm run eval:memory-search:cases -- --only children-overview-priority --format json` showed `selectedCount = 1`, `singleCard = true`, and the dedicated overview card at top. `npm run smoke:eval` passed at `28/28`. A quick full governance refresh via `node scripts/eval-memory-search-cases.js --timeout-ms 1000` plus report sync converged plugin-side metrics to `pluginSignalHits = 30/30`, `pluginSourceHits = 30/30`, `pluginSingleCard = 30/30`, `pluginMultiCard = 0/30`, `pluginFailures = 0`. `npm run eval:smoke-promotion` stayed fresh with `pending = 0`; the remaining two review items are synthetic queries only.

## Follow-Ups

- Continue the next batch of stable fact / stable rule expansion for `openclaw-adapter`.
- Decide whether synthetic-query review items should get a separate promotion policy.
- Revisit later whether registry-root consistency should become an independent strong gate.

## Related Files

- src/retrieval.js
- src/assembly.js
- test/retrieval.test.js
- test/assembly.test.js
- evals/smoke-cases.json
- .codex/status.md
- .codex/plan.md
