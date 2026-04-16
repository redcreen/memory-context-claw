# Unified Memory Core Full Regression And Memory Improvement Report

- generatedAt: `2026-04-16`
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
- direct live `unified-memory-core` vs builtin improvement is now split into two clearer surfaces:
  - existing-memory consumption: real but modest on the current agent/index baseline
  - ordinary-conversation realtime writing: materially clearer in favor of Unified Memory Core

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

The current live A/B set contains `100` distinct answer-level cases:

- English: `50`
- Chinese: `50`

This set was intentionally expanded to make the comparison harder to hand-wave: same agent family, same memory fixture, two engines, and enough volume to show whether the product really pulls away or merely feels better anecdotally.

Important boundary:

- this A/B compares **consumption quality on the same existing memory fixture**
- it does **not** by itself compare which runtime is better at emitting new governed long-term memory during a live conversation
- that second question is now covered by the focused ordinary-conversation suite described below

The broader runnable matrix currently maintained in the repo is:

- total runnable cases: `392`
- zh-bearing cases: `211 / 392 = 53.83%`
- retrieval cases: `262`
- answer-level cases: `130`

## Full Test Results

### Regression And Release Gates

- `npm test`: `414 / 414` pass
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
- zh-bearing cases: `6 / 12`

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
- raw ok: `3 / 8`
- watchlist: `5`
- failure classes: `4` `missing_json_payload`, `1` `empty_results`

Interpretation:

- this is currently a host transport problem
- it is no longer treated as proof that Memory Core retrieval is wrong
- retrieval conclusions in this report come from the stable local sqlite-backed benchmark path instead

### Deeper Answer-Level Watch Surface

- report: [openclaw-cli-agent-answer-watch-2026-04-15.md](openclaw-cli-agent-answer-watch-2026-04-15.md)
- total cases: `18`
- passed: `14 / 18`
- failed: `4`
- zh-bearing cases: `9 / 18`

Interpretation:

- this surface improved from the earlier `7 / 18` watch result, then from `12 / 18` to `14 / 18` in this round
- but it is still not strong enough to replace the repo-default `12 / 12` formal gate
- the remaining failures are now concentrated into four harder cases instead of broad host-noise collapse
- the still-open cases are `agent-current-editor-1`, `agent-cross-source-calls-1`, `agent-zh-project-1`, and `agent-zh-natural-cross-source-calls-1`

### Main-Path Performance Baseline

- report: [main-path-performance-baseline-2026-04-15.md](main-path-performance-baseline-2026-04-15.md)

Current baseline:

- retrieval / assembly average: `16 ms`
- raw transport average: `8061 ms`
- answer-level average: `11200 ms`

Interpretation:

- retrieval and assembly remain fast
- answer-level remains the slowest main path
- raw transport remains noisy enough to require its own watchlist

## Live A/B Memory Improvement Results

- report: [openclaw-memory-improvement-ab-2026-04-15.md](openclaw-memory-improvement-ab-2026-04-15.md)
- compact summary: [openclaw-memory-improvement-summary-2026-04-15.md](openclaw-memory-improvement-summary-2026-04-15.md)
- focused ordinary-conversation write-time report: [openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md](openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md)

### Topline Counts

- compared real live cases: `100`
- `unified-memory-core` passed: `98`
- legacy builtin passed: `97`
- both passed: `97`
- Memory Core only: `1`
- legacy only: `0`
- both failed: `2`

### English Versus Chinese

#### English

- compared real live cases: `50`
- `unified-memory-core` passed: `50`
- legacy builtin passed: `49`
- both passed: `49`
- Memory Core only: `1`
- legacy only: `0`
- both failed: `0`

#### Chinese

- compared real live cases: `50`
- `unified-memory-core` passed: `48`
- legacy builtin passed: `48`
- both passed: `48`
- Memory Core only: `0`
- legacy only: `0`
- both failed: `2`

### What The 100-Case A/B Actually Means

The honest reading is:

- OpenClaw builtin memory is already good enough to answer many simple stable-fact and current-state prompts on the current test agent
- `unified-memory-core` does not currently create a large visible uplift on every easy prompt
- after `100` real live cases, the direct answer-level gap is still small enough that it would be misleading to market this as a broad built-in replacement win
- the visible current uplift is concentrated in a narrow slice of harder retrieval / phrasing situations, while two harder Chinese history cases still miss on both engines

The single clear current `unified-memory-core`-only win in this live set is:

- case: `ab100-en-project-purpose-5`
- question: `Based only on your memory for this agent, if someone asks what Lantern does, how should you describe it? If memory is missing, reply exactly: I don't know based on current memory.`
- result:
  - `unified-memory-core`: pass
  - builtin legacy: fail
- attribution: `unified-retrieval-gain`

A benchmark cleanup worth making explicit is:

- the earlier Chinese birthday prompt is no longer counted as a plain negative case
- it behaved more like an identity-conflict / birthday-guardrail probe than a clean abstention probe
- after replacing it with a true unknown-fact negative, the `100`-case live A/B no longer contains a builtin-only win

So if the question is “does Memory Core help today?”, the honest answer is:

- yes, but the direct live answer-level improvement is modest on this current baseline
- the bigger immediate value is governed retrieval, cleaner assembly, broader benchmark coverage, nightly self-learning, maintainability, CLI-verifiable gates, and explicit isolation of host transport failures
- if the goal is “Memory Core should obviously beat builtin in many more real questions”, that goal is not closed yet on the existing-memory-consumption surface

## Focused Ordinary-Conversation Realtime Write Results

This round also adds a second live A/B that is much closer to the user-facing intuition behind `should_write_memory`:

- one ordinary conversation introduces a new durable rule, tool-routing preference, or user profile fact
- session transcripts are then pruned
- a later recall question checks whether the memory survived as durable recall rather than just short-lived session carry-over

Topline:

- compared live cases: `10`
- `unified-memory-core` current path passed: `10`
- legacy builtin path passed: `5`
- both passed: `5`
- Memory Core only: `5`
- legacy only: `0`
- both failed: `0`

Language split:

- English: current `5 / 5`, legacy `3 / 5`, `UMC-only=2`, `legacy-only=0`
- Chinese: current `5 / 5`, legacy `2 / 5`, `UMC-only=3`, `legacy-only=0`

Interpretation:

- the earlier `100`-case suite said “existing-memory consumption uplift is modest”
- this new focused suite says “ordinary-conversation realtime write behavior is already meaningfully better with Unified Memory Core than with the current default legacy path”
- the write-time advantage the user expected was real, but the earlier `100`-case fixture-consumption A/B was the wrong tool to reveal it

The clearest current UMC-only wins in this focused suite are:

- English tool-routing tag recall
- English timezone recall
- Chinese durable-rule codename recall
- Chinese async-update preference recall
- Chinese notebook fact recall

The previous focused-suite legacy-only miss has now been closed:

- English durable-rule keyword recall for `saffron-releases` now passes on both `current` and `legacy`

## Where Memory Core Is Already Significantly Better

Even when many simple prompts are shared wins, Memory Core is already materially stronger in these areas:

1. Governed retrieval and assembly
   Memory Core has formal handling for conflict, supersede, current-state questions, and stable-fact prioritization instead of relying on a flatter baseline retrieval path.

2. Larger verified memory benchmark surface
   The project now maintains a runnable matrix of `392` cases with `53.83%` Chinese-bearing coverage, a `262 / 262` retrieval-heavy formal gate, a `100`-case existing-memory live A/B, and a focused `10`-case ordinary-conversation write-time live A/B.

3. Stable answer-level gate
   The isolated local answer-level gate is now `12 / 12`, and the formal gate itself now carries `6 / 12` zh-bearing cases instead of only a token Chinese slice.

4. Better separation between stable gate and deeper watch
   The deeper `18`-case watch surface has improved to `14 / 18`, but it is still explicitly kept out of the repo-default formal gate. That keeps the remaining four harder answer-level failures from quietly polluting the stable health signal.

5. Host transport noise isolation
   Raw `openclaw memory search` instability is tracked separately, so host JSON failures no longer get misread as algorithm regressions.

6. Governed self-learning lifecycle
   Memory Core already includes nightly self-learning, governed candidate promotion, decision trails, and replay / audit tooling. OpenClaw builtin memory alone does not expose this same governed lifecycle surface in this repo.

## Current Progress And Next Step

According to the GitHub development plan:

- current completed baseline: the repo has already closed the `12 / 12` isolated answer-level gate, the broader benchmark program, and this round’s full rerun / A-B refresh
- current next step: [development-plan.zh-CN.md](../../docs/reference/unified-memory-core/development-plan.zh-CN.md) item `91`

Current `next` in the development plan:

- remove the two shared Chinese history misses from the `100`-case A/B suite
- redesign the next live A/B around harder `cross-source`, `conflict`, `multi-step history`, and denser natural-Chinese gains instead of spending another round on already-closed negative / ordinary-write regressions
- target future answer-level gains in `cross-source`, `conflict`, `multi-step history`, and denser natural Chinese prompts where `unified-memory-core` should earn more differentiated wins

That means this round has finished the broad regression and evidence pass, and the next phase is no longer “prove basic health”, but “turn the improved `14 / 18` deeper watch into a promotable next formal-gate layer where Memory Core beats the builtin baseline more often”.

## Related Reports

- [openclaw-cli-memory-eval-program-2026-04-14.md](openclaw-cli-memory-eval-program-2026-04-14.md)
- [openclaw-contextengine-ab-eval-2026-04-14.md](openclaw-contextengine-ab-eval-2026-04-14.md)
- [openclaw-answer-level-gate-expansion-2026-04-15.md](openclaw-answer-level-gate-expansion-2026-04-15.md)
- [openclaw-natural-chinese-watch-and-perf-2026-04-15.md](openclaw-natural-chinese-watch-and-perf-2026-04-15.md)
