# OpenClaw Docker Ordinary-Conversation Harness Speedup

- generatedAt: `2026-04-17`
- scope: `ordinary-conversation-memory-intent-ab`
- executionEnvironment: `docker`

## Why This Report Exists

This report does not try to prove Memory Core is smarter.

It answers a narrower question first:

- is the Docker A/B substrate now fast enough and clean enough to be worth keeping as the default eval path?

## Before vs After

The older Docker path paid three repeated costs over and over:

1. rebuild a fresh ordinary-conversation state scaffold
2. cold-start the answer path for every case
3. keep burning time on registry wait and recall even after capture had already failed

The new path changes the substrate itself:

- one cached base state per mode
- one warmup turn before freezing that base state into the template cache
- one cloned temp state per case instead of regenerating config + fixture scaffolding
- fast-fail after capture timeout
- `4` shards by default so the full suite runs in parallel

## Targeted Timing Evidence

The targeted slow-case rerun still shows the core answer-path problem clearly:

- comparedCases: `3`
- bothFail: `3`
- templatePrepMs:
  - legacy: `120061`
  - current: `77704`
- legacy avg:
  - clone: `101ms`
  - capture: `30062ms`
  - recall: `0ms`
  - total: `30181ms`
- current avg:
  - clone: `89ms`
  - capture: `30067ms`
  - recall: `0ms`
  - total: `30169ms`

Interpretation:

- the old wasted recall path is gone
- the main bottleneck is still the capture turn itself
- this means the fast substrate is no longer dominated by config generation

## Full 40-Case Fast-Path Result

With cached templates, warmup, fast-fail, and `4` shards:

- comparedCases: `40`
- totalWallClockMs: `607825`
- total wall-clock: `~10.1 min`
- templateCacheHits:
  - legacy: `true`
  - current: `true`
- templatePrepMs:
  - legacy: `5ms`
  - current: `1ms`

Isolation checks remain clean:

- totalRuns: `80`
- duplicateStateRoots: `0`
- duplicateRegistryRoots: `0`
- cleanupFailed: `0`
- sessionClearFailed: `0`

Fast-path answer results:

- legacy capture timeouts: `40 / 40`
- current capture timeouts: `40 / 40`
- legacyPassed: `0 / 40`
- currentPassed: `0 / 40`

## What Improved

What improved materially:

- the benchmark no longer wastes most of its time rebuilding config scaffolding
- the benchmark no longer wastes recall time after capture has already failed
- the full `40`-case suite now completes in a bounded wall-clock window
- isolation remains strict, so cross-case contamination is still ruled out

## What Did Not Improve

What did **not** improve yet:

- Docker answer-level capture itself is still too slow under a strict `30s` budget
- this fast path is therefore not yet a fair capability surface for ordinary-conversation answer quality

In other words:

- the Docker substrate is now fast enough to serve as the default hermetic infra gate
- but it is not yet the final capability benchmark for ordinary-conversation answer quality

## Current Decision

Keep this fast Docker path as the default hermetic eval baseline for:

- contamination checks
- infra/perf regressions
- reproducibility

Do **not** use this exact `30s` fast path alone as the final answer-level capability conclusion.

For that, the next step is a truer steady-state runner that avoids repeated cold answer-path startup while preserving zero contamination between cases.
