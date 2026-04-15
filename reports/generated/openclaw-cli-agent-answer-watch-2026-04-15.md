# OpenClaw CLI Memory Benchmark

- generatedAt: `2026-04-15T17:58:01.377Z`
- agent: `umceval65`
- totalCases: `18`
- currentPassed: `16`
- currentFailed: `2`
- legacyCompared: `14`
- legacyPassed: `0`
- abstained: `0`
- abstentionRate: `0`
- zhBearingCases: `9/18`

## Language Summary
- zhBearing: `9`
- nonZh: `9`

## Category Summary
- agent-profile: `1/1`
- agent-project: `2/2`
- agent-temporal: `2/2`
- agent-cross-source: `0/1`
- agent-rule: `1/1`
- agent-history: `1/1`
- agent-zh: `2/2`
- agent-zh-natural: `5/6`
- negative: `2/2`

## Attribution Summary
- legacy-skipped: `12`
- unified-failed: `2`
- not-compared: `4`

## Transport Summary
- agent_local: `18`

## Entrypoint Summary
- agent: `18`

## Failing Cases
- agent-cross-source-calls-1: expectation mismatch
- agent-zh-natural-cross-source-calls-1: expectation mismatch

## Sample Results
- agent-name-1 [agent-profile] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Maya Chen
- agent-project-1 [agent-project] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: Based only on your memory for this agent, what is Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Project Lantern is a B2B analytics assistant for clinic managers.
- agent-current-editor-1 [agent-temporal] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: Based only on your memory for this agent, what is the user's current main editor now? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Zed
- agent-current-demo-1 [agent-temporal] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: Based only on your memory for this agent, when is the clinic demo scheduled now? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Next Tuesday at 15:00 Shanghai time.
- agent-cross-source-calls-1 [agent-cross-source] `agent` pass=`false` attribution=`unified-failed`
  prompt: Based only on your memory for this agent, if async text will work, should you avoid voice calls? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Yes.
- agent-rule-no-guess-1 [agent-rule] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, what should happen if memory is missing or conflicting? If memory is missing, reply exactly: I don't know based on current memory.
  observed: I don't know based on current memory.
- agent-project-city-1 [agent-project] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, what is the launch city for the pilot? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Singapore
- agent-history-editor-1 [agent-history] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, what editor was Maya still using on 2026-04-10? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Vim
- agent-zh-project-1 [agent-zh] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: 仅根据你当前这个 agent 的记忆，Project Lantern 现在的里程碑是什么？如果记忆里没有，请直接回答：I don't know based on current memory.
  observed: Stage 2 pilot
- agent-zh-temporal-1 [agent-zh] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: 仅根据你当前这个 agent 的记忆，用户现在主要用什么编辑器？如果记忆里没有，请直接回答：I don't know based on current memory.
  observed: Zed
- agent-zh-natural-name-1 [agent-zh-natural] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: 只根据当前记忆，平时我希望你怎么称呼我？如果没有这条记忆，就只回答：I don't know based on current memory.
  observed: Maya Chen
- agent-zh-natural-project-1 [agent-zh-natural] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: 只根据当前记忆，Project Lantern 到底是在做什么？如果没有这条记忆，就只回答：I don't know based on current memory.
  observed: Project Lantern is a B2B analytics assistant for clinic managers.

## Notes
- This script supports both retrieval-level and answer-level cases; the entrypoint summary above shows which ones were selected in this run.
- Search-heavy cases default to the same OpenClaw agent sqlite index because raw `openclaw memory search` is currently unstable on this host.
- Use `--raw-search-cli` only when you explicitly want to probe that unstable transport and accept fallback noise.
- Legacy comparison is only enabled for benchmark-critical attribution cases, not the full matrix.
- The current fixture mirror lives under `evals/openclaw-cli-memory-fixture/`.
- Agent cases use an explicit memory_search tool hint before answering.
- Agent cases run via `openclaw agent --local` to avoid gateway/session-lock noise.
