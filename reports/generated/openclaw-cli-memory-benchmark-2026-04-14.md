# OpenClaw CLI Memory Benchmark

- generatedAt: `2026-04-14T03:19:16.593Z`
- agent: `umceval`
- totalCases: `111`
- currentPassed: `111`
- currentFailed: `0`
- legacyCompared: `0`
- legacyPassed: `0`

## Category Summary
- profile: `11/11`
- preference: `32/32`
- rule: `12/12`
- project: `28/28`
- temporal-current: `19/19`
- temporal-history: `9/9`

## Attribution Summary
- not-compared: `111`

## Transport Summary
- local_sqlite_index: `111`

## Entrypoint Summary
- memory_search: `111`

## Failing Cases
- none

## Sample Results
- profile-name-1 [profile] `memory_search` pass=`true` attribution=`not-compared`
  prompt: preferred name
  observed: # Long-Term Memory  - Preferred name: Maya Chen. - Role: independent product engineer building a clinic analytics assistant. - Timezone: Asia/Shanghai. - Preferred reply style: con
- profile-name-2 [profile] `memory_search` pass=`true` attribution=`not-compared`
  prompt: user preferred name
  observed: # Long-Term Memory  - Preferred name: Maya Chen. - Role: independent product engineer building a clinic analytics assistant. - Timezone: Asia/Shanghai. - Preferred reply style: con
- profile-name-3 [profile] `memory_search` pass=`true` attribution=`not-compared`
  prompt: what name should I use for the user
  observed: # Long-Term Memory  - Preferred name: Maya Chen. - Role: independent product engineer building a clinic analytics assistant. - Timezone: Asia/Shanghai. - Preferred reply style: con
- profile-name-4 [profile] `memory_search` pass=`true` attribution=`not-compared`
  prompt: how should this agent address the user
  observed: # Daily Memory 2026-04-12  - Confirmed update: Maya switched the main editor from Vim to Zed last week. - Confirmed update: the clinic demo moved to next Tuesday at 15:00 Shanghai 
- profile-role-1 [profile] `memory_search` pass=`true` attribution=`not-compared`
  prompt: user role
  observed: # Long-Term Memory  - Preferred name: Maya Chen. - Role: independent product engineer building a clinic analytics assistant. - Timezone: Asia/Shanghai. - Preferred reply style: con
- profile-role-2 [profile] `memory_search` pass=`true` attribution=`not-compared`
  prompt: what does Maya do
  observed: # Personal Profile Notes  - Maya prefers async written updates over live calls. - Maya often travels with only a carry-on and prefers aisle seats. - Maya wants charts optimized for
- profile-role-3 [profile] `memory_search` pass=`true` attribution=`not-compared`
  prompt: independent product engineer clinic analytics assistant
  observed: # Long-Term Memory  - Preferred name: Maya Chen. - Role: independent product engineer building a clinic analytics assistant. - Timezone: Asia/Shanghai. - Preferred reply style: con
- profile-timezone-1 [profile] `memory_search` pass=`true` attribution=`not-compared`
  prompt: timezone
  observed: # Long-Term Memory  - Preferred name: Maya Chen. - Role: independent product engineer building a clinic analytics assistant. - Timezone: Asia/Shanghai. - Preferred reply style: con
- profile-timezone-2 [profile] `memory_search` pass=`true` attribution=`not-compared`
  prompt: user timezone
  observed: # Long-Term Memory  - Preferred name: Maya Chen. - Role: independent product engineer building a clinic analytics assistant. - Timezone: Asia/Shanghai. - Preferred reply style: con
- profile-timezone-3 [profile] `memory_search` pass=`true` attribution=`not-compared`
  prompt: what timezone is Maya in
  observed: # Long-Term Memory  - Preferred name: Maya Chen. - Role: independent product engineer building a clinic analytics assistant. - Timezone: Asia/Shanghai. - Preferred reply style: con
- profile-timezone-4 [profile] `memory_search` pass=`true` attribution=`not-compared`
  prompt: Asia/Shanghai
  observed: # Long-Term Memory  - Preferred name: Maya Chen. - Role: independent product engineer building a clinic analytics assistant. - Timezone: Asia/Shanghai. - Preferred reply style: con
- pref-reply-style-1 [preference] `memory_search` pass=`true` attribution=`not-compared`
  prompt: preferred reply style
  observed: # Long-Term Memory  - Preferred name: Maya Chen. - Role: independent product engineer building a clinic analytics assistant. - Timezone: Asia/Shanghai. - Preferred reply style: con

## Notes
- This script supports both retrieval-level and answer-level cases; the entrypoint summary above shows which ones were selected in this run.
- Search-heavy cases default to the same OpenClaw agent sqlite index because raw `openclaw memory search` is currently unstable on this host.
- Use `--raw-search-cli` only when you explicitly want to probe that unstable transport and accept fallback noise.
- Legacy comparison is only enabled for benchmark-critical attribution cases, not the full matrix.
- The current fixture mirror lives under `evals/openclaw-cli-memory-fixture/`.

