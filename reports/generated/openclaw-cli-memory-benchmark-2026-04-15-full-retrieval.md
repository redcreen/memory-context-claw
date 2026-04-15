# OpenClaw CLI Memory Benchmark

- generatedAt: `2026-04-15T13:46:26.723Z`
- agent: `umceval`
- totalCases: `262`
- currentPassed: `262`
- currentFailed: `0`
- legacyCompared: `0`
- legacyPassed: `0`
- abstained: `0`
- abstentionRate: `0`
- zhBearingCases: `137/262`

## Language Summary
- zhBearing: `137`
- nonZh: `125`

## Category Summary
- profile: `25/25`
- preference: `64/64`
- rule: `27/27`
- project: `59/59`
- cross-source: `16/16`
- supersede: `12/12`
- temporal-current: `41/41`
- temporal-history: `18/18`

## Attribution Summary
- not-compared: `262`

## Transport Summary
- local_sqlite_index: `262`

## Entrypoint Summary
- memory_search: `262`

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
- Agent cases use an explicit memory_search tool hint before answering.
- Agent cases run via the default gateway path.

