# OpenClaw CLI Memory Benchmark

- generatedAt: `2026-04-15T04:55:25.360Z`
- agent: `umceval65`
- totalCases: `16`
- currentPassed: `16`
- currentFailed: `0`
- legacyCompared: `16`
- legacyPassed: `15`
- abstained: `0`
- abstentionRate: `0`
- zhBearingCases: `8/16`

## Language Summary
- zhBearing: `8`
- nonZh: `8`

## Category Summary
- agent-profile: `3/3`
- agent-project: `1/1`
- agent-temporal: `4/4`
- agent-zh: `3/3`
- agent-zh-natural: `4/4`
- negative: `1/1`

## Attribution Summary
- shared-capability: `13`
- shared-baseline-retrieval: `2`
- unified-retrieval-gain: `1`

## Transport Summary
- agent_local: `16`

## Entrypoint Summary
- agent: `16`

## Failing Cases
- none

## Sample Results
- agent-name-1 [agent-profile] `agent` pass=`true` attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Maya Chen
- agent-timezone-1 [agent-profile] `agent` pass=`true` attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the user's timezone? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Asia/Shanghai
- agent-project-1 [agent-project] `agent` pass=`true` attribution=`shared-baseline-retrieval`
  prompt: Based only on your memory for this agent, what is Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Project Lantern is a B2B analytics assistant for clinic managers. Source: notes/project-lantern.md#L1-L15
- agent-current-editor-1 [agent-temporal] `agent` pass=`true` attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the user's current main editor now? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Zed
- agent-current-demo-1 [agent-temporal] `agent` pass=`true` attribution=`shared-capability`
  prompt: Based only on your memory for this agent, when is the clinic demo scheduled now? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Next Tuesday at 15:00 Shanghai time.
- agent-current-region-1 [agent-temporal] `agent` pass=`true` attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the confirmed default deploy region now? If memory is missing, reply exactly: I don't know based on current memory.
  observed: `eu-west-1`
- agent-current-notebook-1 [agent-temporal] `agent` pass=`true` attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what notebook does the user currently use for meetings? If memory is missing, reply exactly: I don't know based on current memory.
  observed: The charcoal A5 notebook.
- agent-role-1 [agent-profile] `agent` pass=`true` attribution=`shared-capability`
  prompt: Based only on your memory for this agent, what is the user's role? If memory is missing, reply exactly: I don't know based on current memory.
  observed: Independent product engineer building a clinic analytics assistant.
- agent-zh-profile-1 [agent-zh] `agent` pass=`true` attribution=`shared-capability`
  prompt: 仅根据你当前这个 agent 的记忆，用户希望你怎么称呼她？如果记忆里没有，请直接回答：I don't know based on current memory.
  observed: Maya Chen.
- agent-zh-profile-2 [agent-zh] `agent` pass=`true` attribution=`shared-capability`
  prompt: 仅根据你当前这个 agent 的记忆，用户的时区是什么？如果记忆里没有，请直接回答：I don't know based on current memory.
  observed: Asia/Shanghai
- agent-zh-project-1 [agent-zh] `agent` pass=`true` attribution=`shared-baseline-retrieval`
  prompt: 仅根据你当前这个 agent 的记忆，Project Lantern 现在的里程碑是什么？如果记忆里没有，请直接回答：I don't know based on current memory.
  observed: Stage 2 pilot.
- agent-zh-natural-project-1 [agent-zh-natural] `agent` pass=`true` attribution=`unified-retrieval-gain`
  prompt: 只根据当前记忆，Project Lantern 到底是在做什么？如果没有这条记忆，就只回答：I don't know based on current memory.
  observed: - Project Lantern 是一个面向诊所管理者的 **B2B analytics assistant**。 - 当前记忆里就是这么定义的。 Source: notes/project-lantern.md#L1-L15

## Notes
- This script supports both retrieval-level and answer-level cases; the entrypoint summary above shows which ones were selected in this run.
- Search-heavy cases default to the same OpenClaw agent sqlite index because raw `openclaw memory search` is currently unstable on this host.
- Use `--raw-search-cli` only when you explicitly want to probe that unstable transport and accept fallback noise.
- Legacy comparison is only enabled for benchmark-critical attribution cases, not the full matrix.
- The current fixture mirror lives under `evals/openclaw-cli-memory-fixture/`.
- Agent cases use an explicit memory_search tool hint before answering.
- Agent cases run via `openclaw agent --local` to avoid gateway/session-lock noise.

