# Main-Path Performance Baseline

- generatedAt: `2026-04-15T05:00:09.349Z`
- repo: `unified-memory-core`
- answerAgent: `umceval`

## Retrieval / Assembly Baseline
- cases: `5`
- averageTotalMs: `22`
- softExceeded: `0`
- hardExceeded: `0`

## Raw Transport Baseline
- probes: `8`
- rawOk: `0`
- watchlist: `8`
- averageDurationMs: `10765`
- maxDurationMs: `13305`

## Answer-Level Agent Baseline
- ok=`true` durationMs=`27582` answer="Maya Chen"
  prompt: 仅根据你当前这个 agent 的记忆，你应该怎么称呼用户？如果记忆里没有，请直接回答：I don't know based on current memory.
- ok=`true` durationMs=`27581` answer="Project Lantern 是一个给 clinic managers 用的 B2B analytics assistant。Source: notes/project-lantern.md#L1-L15"
  prompt: 只根据当前记忆，Project Lantern 到底是什么项目？如果记忆里没有，请直接回答：I don't know based on current memory.
- ok=`true` durationMs=`29857` answer="eu-west-1"
  prompt: 只根据当前记忆，现在默认部署区域到底用哪个？如果记忆里没有，请直接回答：I don't know based on current memory.

## Layer Attribution
- retrieval / assembly fast path is still millisecond-level: avg `22ms`
- raw transport remains slower and less reliable: avg `10765ms`, watchlist `8`
- answer-level host path is still the slowest visible path: avg `28340`, pass `3/3`

## Notes
- This baseline is for the main path planning slice, not a release gate replacement.
- The answer-level samples intentionally use the same OpenClaw CLI path as the formal answer-level gate.
- The baseline now uses `openclaw agent --local` so gateway/session-lock failures stay out of main-path latency attribution.

