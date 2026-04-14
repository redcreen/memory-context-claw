# OpenClaw CLI Memory Benchmark

- generatedAt: `2026-04-14T15:52:23.698Z`
- agent: `umceval65`
- totalCases: `6`
- currentPassed: `6`
- currentFailed: `0`
- legacyCompared: `3`
- legacyPassed: `0`
- abstained: `0`
- abstentionRate: `0`
- zhBearingCases: `1/6`

## Language Summary
- zhBearing: `1`
- nonZh: `5`

## Category Summary
- agent-profile: `1/1`
- agent-project: `1/1`
- agent-temporal: `1/1`
- agent-history: `1/1`
- agent-zh: `1/1`
- negative: `1/1`

## Attribution Summary
- legacy-skipped: `3`
- not-compared: `3`

## Transport Summary
- agent_local: `6`

## Entrypoint Summary
- agent: `6`

## Failing Cases
- none

## Sample Results
- agent-name-1 [agent-profile] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Maya Chen
- agent-project-1 [agent-project] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: Based only on your memory for this agent, what is Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Project Lantern is a B2B analytics assistant for clinic managers. Source: notes/project-lantern.md#L1-L15
- agent-current-editor-1 [agent-temporal] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: Based only on your memory for this agent, what is the user's current main editor now? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Zed.
- agent-history-editor-1 [agent-history] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, what editor was Maya still using on 2026-04-10? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Vim.
- agent-zh-temporal-1 [agent-zh] `agent` pass=`true` attribution=`not-compared`
  prompt: 仅根据你当前这个 agent 的记忆，用户现在主要用什么编辑器？如果记忆里没有，请直接回答：I don't know based on current memory.
  observed: Zed.
- agent-negative-1 [negative] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, what is the user's favorite programming language? If memory is missing, reply exactly: I don't know based on current memory.
  observed: I don't know based on current memory.

## Notes
- This script supports both retrieval-level and answer-level cases; the entrypoint summary above shows which ones were selected in this run.
- Search-heavy cases default to the same OpenClaw agent sqlite index because raw `openclaw memory search` is currently unstable on this host.
- Use `--raw-search-cli` only when you explicitly want to probe that unstable transport and accept fallback noise.
- Legacy comparison is only enabled for benchmark-critical attribution cases, not the full matrix.
- The current fixture mirror lives under `evals/openclaw-cli-memory-fixture/`.
- Agent cases use an explicit memory_search tool hint before answering.
- Agent cases run via `openclaw agent --local` to avoid gateway/session-lock noise.

