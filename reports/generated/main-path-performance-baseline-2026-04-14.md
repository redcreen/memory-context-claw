# Main-Path Performance Baseline

- generatedAt: `2026-04-14T16:04:44.363Z`
- repo: `unified-memory-core`
- answerAgent: `umceval65`

## Retrieval / Assembly Baseline
- cases: `5`
- averageTotalMs: `85`
- softExceeded: `0`
- hardExceeded: `0`

## Raw Transport Baseline
- probes: `8`
- rawOk: `0`
- watchlist: `8`
- averageDurationMs: `15127`
- maxDurationMs: `22497`

## Answer-Level Agent Baseline
- ok=`true` durationMs=`36376` answer="Maya Chen"
  prompt: Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.
- ok=`true` durationMs=`37976` answer="Project Lantern is a B2B analytics assistant for clinic managers. Source: notes/project-lantern.md#L1-L15"
  prompt: Based only on your memory for this agent, what is Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.
- ok=`true` durationMs=`43492` answer="eu-west-1"
  prompt: Based only on your memory for this agent, what is the confirmed default deploy region now? If memory is missing, reply exactly: I don't know based on current memory.

## Layer Attribution
- retrieval / assembly fast path is still millisecond-level: avg `85ms`
- raw transport remains slower and less reliable: avg `15127ms`, watchlist `8`
- answer-level host path is still the slowest visible path: avg `39281`, pass `3/3`

## Notes
- This baseline is for the main path planning slice, not a release gate replacement.
- The answer-level samples intentionally use the same OpenClaw CLI path as the formal answer-level gate.
- The baseline now uses `openclaw agent --local` so gateway/session-lock failures stay out of main-path latency attribution.

