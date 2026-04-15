# OpenClaw CLI Memory Benchmark

- generatedAt: `2026-04-15T03:58:00.402Z`
- agent: `umceval65`
- totalCases: `12`
- currentPassed: `12`
- currentFailed: `0`
- legacyCompared: `5`
- legacyPassed: `0`
- abstained: `0`
- abstentionRate: `0`
- zhBearingCases: `2/12`

## Language Summary
- zhBearing: `2`
- nonZh: `10`

## Category Summary
- agent-profile: `1/1`
- agent-project: `2/2`
- agent-temporal: `3/3`
- agent-preference: `1/1`
- agent-rule: `1/1`
- agent-history: `1/1`
- agent-zh: `1/1`
- agent-zh-natural: `1/1`
- negative: `1/1`

## Attribution Summary
- legacy-skipped: `5`
- not-compared: `7`

## Transport Summary
- agent_local: `12`

## Entrypoint Summary
- agent: `12`

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
- agent-current-region-1 [agent-temporal] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: Based only on your memory for this agent, what is the confirmed default deploy region now? If memory is missing, reply exactly: I don't know based on current memory.
  observed: eu-west-1
- agent-current-notebook-1 [agent-temporal] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: Based only on your memory for this agent, what notebook does the user currently use for meetings? If memory is missing, reply exactly: I don't know based on current memory.
  observed: The charcoal A5 notebook.
- agent-preference-async-1 [agent-preference] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, does the user prefer async written updates or live voice calls? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Async written updates, not live voice calls.
- agent-rule-no-guess-1 [agent-rule] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, what should happen if memory is missing or conflicting? If memory is missing, reply exactly: I don't know based on current memory.
  observed: I don't know based on current memory.
- agent-project-city-1 [agent-project] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, what is the launch city for the pilot? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Singapore.
- agent-history-editor-1 [agent-history] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, what editor was Maya still using on 2026-04-10? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Vim.
- agent-zh-temporal-1 [agent-zh] `agent` pass=`true` attribution=`not-compared`
  prompt: 仅根据你当前这个 agent 的记忆，用户现在主要用什么编辑器？如果记忆里没有，请直接回答：I don't know based on current memory.
  observed: Zed.
- agent-zh-natural-project-1 [agent-zh-natural] `agent` pass=`true` attribution=`not-compared`
  prompt: 只根据当前记忆，Project Lantern 到底是在做什么？如果没有这条记忆，就只回答：I don't know based on current memory.
  observed: - Project Lantern is a B2B analytics assistant for clinic managers. Source: notes/project-lantern.md#L1-L15
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

