# OpenClaw Docker Ordinary-Conversation Harness Speedup

- generatedAt: `2026-04-17`
- scope: `ordinary-conversation-memory-intent-ab`
- executionEnvironment: `docker`

## Why This Report Exists

This report now answers a slightly different question:

- did the move from the old Docker fast path to the new `gateway-steady` runner actually recover a usable capability surface without losing isolation?

This report is now historical in one narrow sense:

- it records the fast-watch `gateway-steady` improvement line
- it is no longer the official ordinary-conversation capability baseline
- the official baseline is the later strict `1 shard` result: `current=39 / 40`, `legacy=15 / 40`, `UMC-only=24`, `legacy-only=0`, `both-fail=1`

## Before vs After

The older Docker path paid three repeated costs over and over:

1. rebuild a fresh ordinary-conversation state scaffold
2. cold-start the answer path for every case
3. keep burning time on registry wait and recall even after capture had already failed

The new path changes the substrate itself:

- one cached base state per mode
- one warmup turn before freezing that base state into the template cache
- one warmed shard state reused across multiple cases
- per-case reset back to a baseline snapshot instead of cold rebuild
- gateway call execution instead of repeated `agent --local` cold starts
- `4` shards by default so the full suite runs in parallel

## Targeted Timing Evidence

The older targeted slow-case rerun showed the core answer-path problem clearly:

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

- the old wasted recall path was gone
- but the benchmark was still trapped behind the `agent --local` turn path
- that is what justified the move to `gateway-steady`

## Full 40-Case Gateway-Steady Result

With cached templates, warmup, per-case baseline reset, `gateway call agent`, and `4` shards:

- comparedCases: `40`
- totalWallClockMs: `1347259`
- total wall-clock: `~22.5 min`
- templateCacheHits:
  - legacy: `true`
  - current: `true`
- templatePrepMs:
  - legacy: `47ms`
  - current: `34ms`

Isolation checks remain clean:

- totalRuns: `80`
- preCaseResetFailed: `0`
- cleanupFailed: `0`
- sessionClearFailed: `0`

Gateway-steady answer results:

- legacy capture timeouts: `5 / 40`
- current capture timeouts: `3 / 40`
- legacyPassed: `17 / 40`
- currentPassed: `32 / 40`
- `UMC-only = 17`
- `legacy-only = 2`
- `both-fail = 6`

## What Improved

What improved materially:

- the benchmark no longer collapses into a fake `0 / 40` timeout wall
- the Docker path now produces a real ordinary-conversation A/B capability reading
- the full `40`-case suite still completes in a bounded wall-clock window
- isolation remains strict, so cross-case contamination is still ruled out

## What Did Not Improve

What did **not** improve yet:

- wall-clock is still higher than the old infra-only fast path
- the residual `6` shared-fail and `2` legacy-only cases still need targeted cleanup

In other words:

- the Docker substrate is still fast enough and clean enough to remain the default hermetic base
- and it is now also a fair ordinary-conversation capability surface

## Current Decision

Keep this `gateway-steady` Docker path as the default hermetic eval baseline for:

- contamination checks
- infra/perf regressions
- reproducibility
- ordinary-conversation capability A/B

The next step is no longer “make Docker A/B valid at all”.
The next step is “use this clean base to shrink the remaining harder failures and then continue reducing wall-clock”.
