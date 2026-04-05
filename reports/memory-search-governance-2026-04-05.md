# Memory Search Governance Report
- 生成时间：2026-04-05T14:09:07.924Z

## Summary
- cases: `6`
- builtinSignalHits: `2`
- builtinSourceHits: `0`
- pluginSignalHits: `4`
- pluginSourceHits: `4`
- pluginFastPathLikely: `5`
- builtinFailures: `6`
- pluginFailures: `3`

## Watchlist
- `food-preference-recall`: builtin(signal=miss, source=miss), plugin(signal=miss, source=ok)
  query: `我爱吃什么`
- `short-chinese-token`: builtin(signal=miss, source=miss), plugin(signal=miss, source=miss)
  query: `牛排 刘超`
- `session-memory-source-competition`: builtin(signal=ok, source=miss), plugin(signal=ok, source=miss)
  query: `用户爱吃什么 饮食 喜欢吃 刘超 超哥`

## Cases
- `food-preference-recall`
  - builtin: signal=`miss`, source=`miss`
  - plugin: signal=`miss`, source=`ok`, fastPath=`yes`
- `identity-name-recall`
  - builtin: signal=`miss`, source=`miss`
  - plugin: signal=`ok`, source=`ok`, fastPath=`yes`
- `short-chinese-token`
  - builtin: signal=`miss`, source=`miss`
  - plugin: signal=`miss`, source=`miss`, fastPath=`no`
- `session-memory-source-competition`
  - builtin: signal=`ok`, source=`miss`
  - plugin: signal=`ok`, source=`miss`, fastPath=`yes`
- `rule-formal-memory-priority`
  - builtin: signal=`ok`, source=`miss`
  - plugin: signal=`ok`, source=`ok`, fastPath=`yes`
- `project-positioning-priority`
  - builtin: signal=`miss`, source=`miss`
  - plugin: signal=`ok`, source=`ok`, fastPath=`yes`
