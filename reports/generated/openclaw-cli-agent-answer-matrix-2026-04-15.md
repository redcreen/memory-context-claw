# OpenClaw CLI Memory Benchmark

- generatedAt: `2026-04-15T13:45:29.144Z`
- agent: `umceval65`
- totalCases: `12`
- currentPassed: `12`
- currentFailed: `0`
- legacyCompared: `8`
- legacyPassed: `0`
- abstained: `0`
- abstentionRate: `0`
- zhBearingCases: `6/12`

## Language Summary
- zhBearing: `6`
- nonZh: `6`

## Category Summary
- agent-profile: `1/1`
- agent-temporal: `1/1`
- agent-preference: `1/1`
- agent-rule: `1/1`
- agent-project: `1/1`
- agent-history: `1/1`
- agent-zh-natural: `5/5`
- negative: `1/1`

## Attribution Summary
- legacy-skipped: `8`
- not-compared: `4`

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
- agent-current-demo-1 [agent-temporal] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: Based only on your memory for this agent, when is the clinic demo scheduled now? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Next Tuesday at 15:00 Shanghai time.
- agent-preference-async-1 [agent-preference] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, does the user prefer async written updates or live voice calls? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Async written updates.
- agent-rule-no-guess-1 [agent-rule] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, what should happen if memory is missing or conflicting? If memory is missing, reply exactly: I don't know based on current memory.
  observed: I don't know based on current memory.
- agent-project-city-1 [agent-project] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, what is the launch city for the pilot? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Singapore
- agent-history-editor-1 [agent-history] `agent` pass=`true` attribution=`not-compared`
  prompt: Based only on your memory for this agent, what editor was Maya still using on 2026-04-10? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Vim
- agent-zh-natural-name-1 [agent-zh-natural] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: 只根据当前记忆，平时我希望你怎么称呼我？如果没有这条记忆，就只回答：I don't know based on current memory.
  observed: Maya Chen
- agent-zh-natural-project-1 [agent-zh-natural] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: 只根据当前记忆，Project Lantern 到底是在做什么？如果没有这条记忆，就只回答：I don't know based on current memory.
  observed: Project Lantern is a B2B analytics assistant for clinic managers.
- agent-zh-natural-editor-1 [agent-zh-natural] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: 只根据当前记忆，我现在主力编辑器到底换成什么了？如果没有这条记忆，就只回答：I don't know based on current memory.
  observed: Zed
- agent-zh-natural-region-1 [agent-zh-natural] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: 只根据当前记忆，现在默认部署区域到底应该用哪个？如果没有这条记忆，就只回答：I don't know based on current memory.
  observed: eu-west-1
- agent-zh-natural-rule-1 [agent-zh-natural] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: 只根据当前记忆，如果记忆不完整或者互相打架，你应该怎么处理？如果没有这条记忆，就只回答：I don't know based on current memory.
  observed: I don't know based on current memory.
- agent-zh-natural-negative-1 [negative] `agent` pass=`true` attribution=`legacy-skipped`
  prompt: 只根据当前记忆，我最喜欢的编程语言是什么？如果没有这条记忆，就只回答：I don't know based on current memory.
  observed: I don't know based on current memory.

## Notes
- This script supports both retrieval-level and answer-level cases; the entrypoint summary above shows which ones were selected in this run.
- Search-heavy cases default to the same OpenClaw agent sqlite index because raw `openclaw memory search` is currently unstable on this host.
- Use `--raw-search-cli` only when you explicitly want to probe that unstable transport and accept fallback noise.
- Legacy comparison is only enabled for benchmark-critical attribution cases, not the full matrix.
- The current fixture mirror lives under `evals/openclaw-cli-memory-fixture/`.
- Agent cases use an explicit memory_search tool hint before answering.
- Agent cases run via `openclaw agent --local` to avoid gateway/session-lock noise.

