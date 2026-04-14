# Main-Path Performance Baseline

- generatedAt: `2026-04-14T06:28:08.052Z`
- repo: `unified-memory-core`

## Retrieval / Assembly Baseline
- cases: `5`
- averageTotalMs: `20`
- softExceeded: `0`
- hardExceeded: `0`

## Raw Transport Baseline
- probes: `8`
- rawOk: `0`
- watchlist: `8`
- averageDurationMs: `9863`
- maxDurationMs: `15140`

## Answer-Level Agent Baseline
- ok=`false` durationMs=`45049` answer=""
  prompt: Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.
  error: Command failed: openclaw agent --agent umceval --thinking off --timeout 30 --json --message Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.

- ok=`true` durationMs=`25895` answer="I don't know based on current memory."
  prompt: Based only on your memory for this agent, what is Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.
- ok=`true` durationMs=`30502` answer="I don't know based on current memory."
  prompt: Based only on your memory for this agent, what is the confirmed default deploy region now? If memory is missing, reply exactly: I don't know based on current memory.

## Layer Attribution
- retrieval / assembly fast path is still millisecond-level: avg `20ms`
- raw transport remains slower and less reliable: avg `9863ms`, watchlist `8`
- answer-level host path is the slowest visible path: avg `33815` and current answers stay in abstention

## Notes
- This baseline is for the main path planning slice, not a release gate replacement.
- The answer-level samples intentionally use the same host path that the benchmark matrix is exercising.

