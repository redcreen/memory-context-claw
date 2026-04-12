# Allow two same-path family fact cards for children overview queries

- Date: 2026-04-12
- Status: resolved

## Problem

The recall-quality workstream had enough stable family facts to answer `我家孩子的情况你记住了吗`, but the assembly layer still enforced `maxChunksPerPath = 1`. Because both child profile cards came from the same stable memory file, the final selected context collapsed to only one child card, which made the overview query look clean while still being incomplete.

## Thinking

This was not a retrieval failure and not a reason to relax supporting-noise rules globally. The correct fix was a narrow assembly exception for the `children` mixed-fact intent: keep the stable family-card filter, but allow two same-path card artifacts when that is the only way to preserve the full family overview. That keeps the context compact without reintroducing session noise or unrelated identity-correction snippets.

## Solution

Added an effective per-path override in `assembly.js` so `children` overview queries can keep two card-artifact snippets from the same canonical path. Tightened the `children-overview` governance case so it now requires both child identities instead of passing on a single child card. Expanded the recall-quality surfaces with three new governance cases (`birthday-lunar`, `son-profile`, `children-overview`) and promoted two single-card natural queries (`birthday-lunar`, `son-profile`) into smoke.

## Validation

`node --test test/assembly.test.js` passed with a new regression that locks the same-path dual-card behavior. Targeted memory-search cases for `birthday-lunar`, `son-profile`, and `children-overview` all passed. Full governance refreshed to 30 cases with plugin-side `30/30` signal/source hits and a clean `children-overview` two-card selection. Full smoke passed at `27/27`, and smoke-promotion stayed fresh with no missed natural single-card candidates.

## Follow-Ups

- Decide whether `children-overview` should remain a clean two-card exception or gain a dedicated family-overview stable card so it can become smoke-promotion eligible.

## Related Files

- src/assembly.js,test/assembly.test.js,evals/memory-search-cases.json,evals/smoke-cases.json,.codex/status.md,.codex/plan.md
