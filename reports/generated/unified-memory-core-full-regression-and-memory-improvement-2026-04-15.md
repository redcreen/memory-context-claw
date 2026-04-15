# Unified Memory Core Full Regression And Memory Improvement Report

- generatedAt: `2026-04-15`
- scope: full regression, CLI benchmark, live answer-level gate, transport watchlist, performance baseline, and live `unified-memory-core` vs OpenClaw builtin A/B memory comparison

## Executive Summary

This round answers two different questions:

1. Is the current `unified-memory-core` build healthy as a product and plugin?
2. Compared with OpenClaw builtin memory alone, how much answer-level memory improvement is visible in real live cases today?

The current answers are:

- product and regression health: strong
- retrieval-heavy CLI memory coverage: strong
- isolated answer-level formal gate: green
- raw host `openclaw memory search` transport: still unstable, but now isolated into a watchlist instead of contaminating algorithm conclusions
- direct live `unified-memory-core` vs builtin answer-level improvement: real, but concentrated rather than universal on the current agent/index baseline

## What Was Tested

### Repo Regression

- `npm test`
- `npm run verify:memory-intent`
- latest same-day `npm run umc:release-preflight -- --format markdown` evidence

### CLI Memory Benchmarks

- retrieval-heavy benchmark through the OpenClaw local sqlite-backed memory path
- isolated local answer-level formal gate through `openclaw agent --local`
- raw `openclaw memory search` transport watchlist
- main-path performance baseline

### Live A/B Memory Comparison

The direct “does Memory Core help more than builtin memory?” comparison was run as a real live A/B answer-level benchmark:

- same evaluation agent
- same prompts
- same fixture memory
- `unified-memory-core` versus legacy builtin context engine

The current de-duplicated live A/B set contains `16` distinct cases:

- English: `8`
- Chinese: `8`

This set was intentionally reduced to distinct capability points instead of counting prompt paraphrase mirrors as fake extra evidence.

The broader runnable matrix currently maintained in the repo is:

- total runnable cases: `392`
- zh-bearing cases: `211 / 392 = 53.83%`
- retrieval cases: `262`
- answer-level cases: `130`

## Full Test Results

### Regression And Release Gates

- `npm test`: `399 / 399` pass
- `npm run verify:memory-intent`: pass
- latest available `release-preflight` evidence in this round: `8 / 8` pass
- note: an immediate post-fix rerun of `release-preflight` was attempted, but it did not complete within this session budget, so the final conclusions below rely on the directly rerun sub-gates instead
- markdown link scan: green

### Retrieval-Heavy CLI Benchmark

- report: [openclaw-cli-memory-benchmark-2026-04-15-full-retrieval.md](openclaw-cli-memory-benchmark-2026-04-15-full-retrieval.md)
- total cases: `262`
- passed: `262 / 262`
- zh-bearing cases: `137 / 262`

Category coverage:

- profile: `25 / 25`
- preference: `64 / 64`
- rule: `27 / 27`
- project: `59 / 59`
- cross-source: `16 / 16`
- supersede: `12 / 12`
- temporal-current: `41 / 41`
- temporal-history: `18 / 18`

### Isolated Local Answer-Level Formal Gate

- report: [openclaw-cli-agent-answer-matrix-2026-04-15.md](openclaw-cli-agent-answer-matrix-2026-04-15.md)
- total cases: `12`
- passed: `12 / 12`
- zh-bearing cases: `2 / 12`

This gate proves that the current answer-level path is not only retrieving memory, but can still answer correctly on a stable local host path.

This `12 / 12` result was rerun after the host-output hardening in this round:

- stronger JSON extraction from plugin-log-prefixed stderr/stdout payloads
- stale session lock cleanup for isolated eval agents
- no per-case destructive session reset inside the benchmark runner
- one bounded retry for empty/parse-failed host payloads

This is a real live host-path gate, but it is not the same as the builtin-vs-UMC A/B set below:

- `12` cases: current UMC answer-level health gate
- `16` cases: direct live A/B comparison against the builtin baseline

### Raw Transport Watchlist

- report: [openclaw-memory-search-transport-watchlist-2026-04-15.md](openclaw-memory-search-transport-watchlist-2026-04-15.md)
- probes: `8`
- raw ok: `0 / 8`
- current failure class: `missing_json_payload / invalid_json`

Interpretation:

- this is currently a host transport problem
- it is no longer treated as proof that Memory Core retrieval is wrong
- retrieval conclusions in this report come from the stable local sqlite-backed benchmark path instead

### Deeper Answer-Level Watch Surface

- report: [openclaw-cli-agent-answer-watch-2026-04-15.md](openclaw-cli-agent-answer-watch-2026-04-15.md)
- total cases: `18`
- passed: `12 / 18`
- failed: `6`
- zh-bearing cases: `9 / 18`

Interpretation:

- this surface improved from the earlier `7 / 18` watch result
- but it is still not strong enough to replace the repo-default `12 / 12` formal gate
- the remaining failures are no longer just one bucket of host noise; they are now a mix of residual output-shape problems and genuine answer-level expectation mismatches

### Main-Path Performance Baseline

- report: [main-path-performance-baseline-2026-04-15.md](main-path-performance-baseline-2026-04-15.md)

Current baseline:

- retrieval / assembly average: `8 ms`
- raw transport average: `8335 ms`
- answer-level average: `24553 ms`

Interpretation:

- retrieval and assembly remain fast
- answer-level remains the slowest main path
- raw transport remains noisy enough to require its own watchlist

## Live A/B Memory Improvement Results

- report: [openclaw-memory-improvement-ab-2026-04-15.md](openclaw-memory-improvement-ab-2026-04-15.md)
- compact summary: [openclaw-memory-improvement-summary-2026-04-15.md](openclaw-memory-improvement-summary-2026-04-15.md)

### Topline Counts

- compared real live cases: `16`
- `unified-memory-core` passed: `16`
- legacy builtin passed: `15`
- both passed: `15`
- Memory Core only: `1`
- legacy only: `0`
- both failed: `0`

### English Versus Chinese

#### English

- compared real live cases: `8`
- both passed: `8`
- Memory Core only: `0`
- legacy only: `0`
- both failed: `0`

#### Chinese

- compared real live cases: `8`
- both passed: `7`
- Memory Core only: `1`
- legacy only: `0`
- both failed: `0`

### What The A/B Result Actually Means

The honest reading is:

- OpenClaw builtin memory is already good enough to answer many simple stable-fact and current-state prompts on the current test agent
- `unified-memory-core` does not magically create a huge visible uplift on every easy prompt
- the visible current live uplift is concentrated in harder retrieval / phrasing situations, especially natural Chinese phrasing

The single clear current `unified-memory-core`-only win in this live set is:

- case: `agent-zh-natural-project-1`
- question: `只根据当前记忆，Project Lantern 到底是在做什么？如果没有这条记忆，就只回答：I don't know based on current memory.`
- result:
  - `unified-memory-core`: pass
  - builtin legacy: fail
- attribution: `unified-retrieval-gain`

So if the question is “does Memory Core help today?”, the honest answer is:

- yes, but not by replacing every builtin success
- the bigger immediate value is governed retrieval, cleaner assembly, broader benchmark coverage, nightly self-learning, maintainability, CLI-verifiable gates, and explicit isolation of host transport failures
- the direct answer-level uplift is currently measurable but still concentrated, not yet broad enough to claim a dramatic across-the-board boost

## Where Memory Core Is Already Significantly Better

Even when many simple prompts are shared wins, Memory Core is already materially stronger in these areas:

1. Governed retrieval and assembly
   Memory Core has formal handling for conflict, supersede, current-state questions, and stable-fact prioritization instead of relying on a flatter baseline retrieval path.

2. Larger verified memory benchmark surface
   The project now maintains a runnable matrix of `392` cases with `53.83%` Chinese-bearing coverage, plus a `262 / 262` retrieval-heavy formal gate.

3. Stable answer-level gate
   The isolated local answer-level gate is now `12 / 12`, which gives a repeatable host path for future optimization work.

4. Better separation between stable gate and deeper watch
   The deeper `18`-case watch surface has improved to `12 / 18`, but it is still explicitly kept out of the repo-default formal gate. That keeps host noise and harder answer-level regressions from quietly polluting the stable health signal.

5. Host transport noise isolation
   Raw `openclaw memory search` instability is tracked separately, so host JSON failures no longer get misread as algorithm regressions.

6. Governed self-learning lifecycle
   Memory Core already includes nightly self-learning, governed candidate promotion, decision trails, and replay / audit tooling. OpenClaw builtin memory alone does not expose this same governed lifecycle surface in this repo.

## Current Progress And Next Step

According to the GitHub development plan:

- current completed baseline: the repo has already closed the `12 / 12` isolated answer-level gate and the broader benchmark program
- current next step: [development-plan.zh-CN.md](../../docs/reference/unified-memory-core/development-plan.zh-CN.md) item `84`

Current `next` in the development plan:

- deepen the stable answer-level formal gate into more `cross-source`, `conflict`, `multi-step history`, and more natural Chinese coverage

That means this round has finished the broad regression and evidence pass, and the next phase is no longer “prove basic health”, but “turn the improved `12 / 18` deeper watch into a cleaner, promotable gate where Memory Core beats the builtin baseline more often”.

## Related Reports

- [openclaw-cli-memory-eval-program-2026-04-14.md](openclaw-cli-memory-eval-program-2026-04-14.md)
- [openclaw-contextengine-ab-eval-2026-04-14.md](openclaw-contextengine-ab-eval-2026-04-14.md)
- [openclaw-answer-level-gate-expansion-2026-04-15.md](openclaw-answer-level-gate-expansion-2026-04-15.md)
- [openclaw-natural-chinese-watch-and-perf-2026-04-15.md](openclaw-natural-chinese-watch-and-perf-2026-04-15.md)
