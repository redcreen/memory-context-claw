# OpenClaw CLI Memory Benchmark

- generatedAt: `2026-04-15T16:37:23.963Z`
- agent: `umceval65`
- totalCases: `1`
- currentPassed: `0`
- currentFailed: `1`
- legacyCompared: `1`
- legacyPassed: `0`
- abstained: `0`
- abstentionRate: `0`
- zhBearingCases: `0/1`

## Language Summary
- zhBearing: `0`
- nonZh: `1`

## Category Summary
- ab-en-bootstrap: `0/1`

## Attribution Summary
- unified-failed: `1`

## Transport Summary
- agent: `1`

## Entrypoint Summary
- agent: `1`

## Failing Cases
- ab100-en-name-1: Unable to parse JSON payload from stdout

## Sample Results
- ab100-en-name-1 [ab-en-bootstrap] `agent` pass=`false` attribution=`unified-failed`
  prompt: Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.
  observed: 

## Notes
- This script supports both retrieval-level and answer-level cases; the entrypoint summary above shows which ones were selected in this run.
- Search-heavy cases default to the same OpenClaw agent sqlite index because raw `openclaw memory search` is currently unstable on this host.
- Use `--raw-search-cli` only when you explicitly want to probe that unstable transport and accept fallback noise.
- Legacy comparison is only enabled for benchmark-critical attribution cases, not the full matrix.
- The current fixture mirror lives under `evals/openclaw-cli-memory-fixture/`.
- Agent cases use an explicit memory_search tool hint before answering.
- Agent cases run via `openclaw agent --local` to avoid gateway/session-lock noise.

