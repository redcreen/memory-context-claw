# Subproject Status

## Parent Phase / Milestone

`large project / governed execution / plugin-runtime`

## Goal

保持插件运行时的 retrieval / rerank / assembly / scoring 稳定，并继续把最终 recalled context 收干净。

## Current Slice

`stable-fact expansion with clean assembly`

## Done

- memory-search A-E 已完成
- `full smoke = 25/25`
- `pluginSingleCard = 6/6`
- `pluginMultiCard = 0/6`
- 短 query、workspace、lossless、family/birthday supporting context 已完成一轮收口

## In Progress

- 继续扩新的 stable facts / stable rules
- 新增 case 先通过 `eval:smoke-promotion` 再考虑升进 smoke

## Blockers / Open Decisions

- 哪些新的稳定规则值得升进 smoke，仍然需要人工判断是否足够自然、足够高频

## Exit Condition

- 新 stable facts / rules 的扩面能按同一套流程推进：实现 -> 测试 -> smoke/governance -> 升格建议

## Next 3 Actions

1. 扩下一批稳定事实 / 规则
2. 继续做 supporting context 清洁化
3. 让 smoke 面扩张但不变脆
