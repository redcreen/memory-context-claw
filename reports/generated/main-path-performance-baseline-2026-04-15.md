# Main-Path Performance Baseline

- generatedAt: `2026-04-15T03:14:06.581Z`
- repo: `unified-memory-core`
- answerAgent: `umceval65`

## Retrieval / Assembly Baseline
- cases: `5`
- averageTotalMs: `43`
- softExceeded: `0`
- hardExceeded: `0`

## Raw Transport Baseline
- probes: `8`
- rawOk: `0`
- watchlist: `8`
- averageDurationMs: `15570`
- maxDurationMs: `25216`

## Answer-Level Agent Baseline
- ok=`true` durationMs=`44043` answer="Maya Chen"
  prompt: 仅根据你当前这个 agent 的记忆，你应该怎么称呼用户？如果记忆里没有，请直接回答：I don't know based on current memory.
- ok=`true` durationMs=`33057` answer="Project Lantern 是一个面向诊所管理者的 B2B analytics assistant 项目。"
  prompt: 只根据当前记忆，Project Lantern 到底是什么项目？如果记忆里没有，请直接回答：I don't know based on current memory.
- ok=`true` durationMs=`31364` answer="`eu-west-1`\nSource: MEMORY.md#L12"
  prompt: 只根据当前记忆，现在默认部署区域到底用哪个？如果记忆里没有，请直接回答：I don't know based on current memory.

## Layer Attribution
- retrieval / assembly fast path is still millisecond-level: avg `43ms`
- raw transport remains slower and less reliable: avg `15570ms`, watchlist `8`
- answer-level host path is still the slowest visible path: avg `36155`, pass `3/3`

## Notes
- This baseline is for the main path planning slice, not a release gate replacement.
- The answer-level samples intentionally use the same OpenClaw CLI path as the formal answer-level gate.
- The baseline now uses `openclaw agent --local` so gateway/session-lock failures stay out of main-path latency attribution.

