# Separate synthetic review buckets in smoke promotion

- Date: 2026-04-12
- Status: resolved

## Problem

`eval:smoke-promotion` already kept synthetic queries out of `recommendedForSmoke`, but the summary still only exposed a single `reviewRequired` bucket. That made it too easy to conflate real natural-query backlog with stable-but-synthetic governance cases such as `short-chinese-token` and `session-memory-source-competition`.

## Thinking

The right fix was reporting-layer separation, not a change to promotion eligibility. Natural questions that are not stable enough should remain visible as smoke backlog, while synthetic governance cases should stay clearly marked as review-only. Keeping `reviewRequired` as a compatibility alias avoids breaking existing readers while the richer buckets roll out.

## Solution

Updated `smoke-promotion` suggestion building so each item now carries a `promotionBucket`, and the summary now separately reports `naturalPending`, `syntheticReviewRequired`, and `syntheticPending`. Kept `reviewRequired` as a compatibility alias for the synthetic-review bucket. Refreshed the active governance doc so the output contract matches the current script behavior.

## Validation

`node --test test/smoke-promotion.test.js` passed. `npm run eval:smoke-promotion` now reports `naturalPending = 0`, `syntheticReviewRequired = 2`, and `syntheticPending = 0` for the current repo state, with both remaining non-smoke items correctly labeled as `synthetic-review`.

## Follow-Ups

- Decide whether synthetic-review items should stay permanently manual-only or get an explicit non-natural promotion policy.
- Continue the next stable fact / stable rule expansion without mixing synthetic governance cases into smoke backlog counts.

## Related Files

- src/smoke-promotion.js
- test/smoke-promotion.test.js
- docs/workstreams/memory-search/governance.md
- .codex/status.md
