# Memory Search Governance Report
- 生成时间：2026-04-09T16:15:23.247Z

## Summary
- cases: `6`
- builtinUnavailable: `0`
- builtinSignalHits: `4`
- builtinSourceHits: `0`
- pluginSignalHits: `6`
- pluginSourceHits: `6`
- pluginFastPathLikely: `6`
- builtinFailures: `6`
- pluginFailures: `0`

## Delta vs Previous
- builtinUnavailableDelta: `-6`
- builtinSignalHitsDelta: `4`
- builtinSourceHitsDelta: `0`
- pluginSignalHitsDelta: `0`
- pluginSourceHitsDelta: `0`
- pluginFastPathLikelyDelta: `0`
- builtinFailuresDelta: `6`
- pluginFailuresDelta: `0`

## Watchlist Changes
- added: none
- resolved: none
- persisting: none

## Cases
- `food-preference-recall`
  - builtin: signal=`ok`, source=`miss`
  - plugin: signal=`ok`, source=`ok`, fastPath=`yes`
- `identity-name-recall`
  - builtin: signal=`ok`, source=`miss`
  - plugin: signal=`ok`, source=`ok`, fastPath=`yes`
- `short-chinese-token`
  - builtin: signal=`miss`, source=`miss`
  - plugin: signal=`ok`, source=`ok`, fastPath=`yes`
- `session-memory-source-competition`
  - builtin: signal=`ok`, source=`miss`
  - plugin: signal=`ok`, source=`ok`, fastPath=`yes`
- `rule-formal-memory-priority`
  - builtin: signal=`ok`, source=`miss`
  - plugin: signal=`ok`, source=`ok`, fastPath=`yes`
- `project-positioning-priority`
  - builtin: signal=`miss`, source=`miss`
  - plugin: signal=`ok`, source=`ok`, fastPath=`yes`
