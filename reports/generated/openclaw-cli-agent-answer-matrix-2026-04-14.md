# OpenClaw CLI Memory Benchmark

- generatedAt: `2026-04-14T05:26:48.594Z`
- agent: `umceval`
- totalCases: `1`
- currentPassed: `0`
- currentFailed: `1`
- legacyCompared: `1`
- legacyPassed: `0`

## Category Summary
- agent-profile: `0/1`

## Attribution Summary
- unified-failed: `1`

## Transport Summary
- agent: `1`

## Entrypoint Summary
- agent: `1`

## Failing Cases
- agent-name-1: expectation mismatch

## Sample Results
- agent-name-1 [agent-profile] `agent` pass=`false` attribution=`unified-failed`
  prompt: Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.
  observed: I don't know based on current memory.

## Notes
- This script supports both retrieval-level and answer-level cases; the entrypoint summary above shows which ones were selected in this run.
- Search-heavy cases default to the same OpenClaw agent sqlite index because raw `openclaw memory search` is currently unstable on this host.
- Use `--raw-search-cli` only when you explicitly want to probe that unstable transport and accept fallback noise.
- Legacy comparison is only enabled for benchmark-critical attribution cases, not the full matrix.
- The current fixture mirror lives under `evals/openclaw-cli-memory-fixture/`.

