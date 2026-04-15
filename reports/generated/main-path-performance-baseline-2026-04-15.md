# Main-Path Performance Baseline

- generatedAt: `2026-04-15T13:13:39.113Z`
- repo: `unified-memory-core`
- answerAgent: `umceval65`

## Retrieval / Assembly Baseline
- cases: `5`
- averageTotalMs: `8`
- softExceeded: `0`
- hardExceeded: `0`

## Raw Transport Baseline
- probes: `8`
- rawOk: `0`
- watchlist: `8`
- averageDurationMs: `8335`
- maxDurationMs: `8686`

## Answer-Level Agent Baseline
- ok=`true` durationMs=`21987` answer="Maya Chen"
  prompt: 仅根据你当前这个 agent 的记忆，你应该怎么称呼用户？如果记忆里没有，请直接回答：I don't know based on current memory.
- ok=`true` durationMs=`30990` answer="Project Lantern 是一个面向诊所管理者的 B2B 分析助手。"
  prompt: 只根据当前记忆，Project Lantern 到底是什么项目？如果记忆里没有，请直接回答：I don't know based on current memory.
- ok=`true` durationMs=`20681` answer="eu-west-1"
  prompt: 只根据当前记忆，现在默认部署区域到底用哪个？如果记忆里没有，请直接回答：I don't know based on current memory.

## Layer Attribution
- retrieval / assembly fast path is still millisecond-level: avg `8ms`
- raw transport remains slower and less reliable: avg `8335ms`, watchlist `8`
- answer-level host path is still the slowest visible path: avg `24553`, pass `3/3`

## Notes
- This baseline is for the main path planning slice, not a release gate replacement.
- The answer-level samples intentionally use the same OpenClaw CLI path as the formal answer-level gate.
- The baseline now uses `openclaw agent --local` so gateway/session-lock failures stay out of main-path latency attribution.

