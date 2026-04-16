# Dialogue Working-Set Runtime Answer A/B

- model: `gpt-5.4`
- reasoning effort: `low`
- output dir: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16`
- cases: `5`
- baselinePassed: `5`
- shadowPassed: `5`
- bothPass: `5`
- shadowOnly: `0`
- baselineOnly: `0`
- bothFail: `0`
- average prompt reduction ratio: `0.0114`

## answer-ab-return-family-seat
- description: A durable seat preference should still answer correctly after a code detour.
- captured: `true`
- relation: `switch`
- outcome: `both_pass`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16/exports/agent-stage6-answer-ab-answer-ab-return-family-seat-shadow-1776348337788-mwh2sm.json`
- baseline answer: 靠过道。
- shadow answer: 靠过道。

## answer-ab-branch-return-stage6
- description: A side fact should not break recall of an unfinished three-part rollout split.
- captured: `true`
- relation: `branch`
- outcome: `both_pass`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16/exports/agent-stage6-answer-ab-answer-ab-branch-return-stage6-shadow-1776348357842-iesrdu.json`
- baseline answer: 版本正确性、安装验证、回滚安全。
- shadow answer: 版本正确性、安装验证、回滚安全。

## answer-ab-session-negative
- description: A one-off codename must not become a permanent default after the topic switches.
- captured: `true`
- relation: `switch`
- outcome: `both_pass`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16/exports/agent-stage6-answer-ab-answer-ab-session-negative-shadow-1776348381254-vmshlg.json`
- baseline answer: 没有长期默认。"琥珀梯"只是这一次临时叫法。
- shadow answer: 没有长期默认称呼。"琥珀梯"只是这一轮的临时叫法，不应作为以后默认名称。

## answer-ab-current-task-after-switch
- description: After an older topic is closed, the current task should still answer correctly from the pruned working set.
- captured: `true`
- relation: `switch`
- outcome: `both_pass`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16/exports/agent-stage6-answer-ab-answer-ab-current-task-after-switch-shadow-1776348401814-2dn176.json`
- baseline answer: 当前新任务是写 shadow mode 报告。
- shadow answer: 当前新任务是写 shadow mode 报告。

## answer-ab-style-pin-survives
- description: A style preference should still answer correctly after an unrelated retrieval-policy detour.
- captured: `true`
- relation: `continue`
- outcome: `both_pass`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16/exports/agent-stage6-answer-ab-answer-ab-style-pin-survives-shadow-1776348426221-q1966x.json`
- baseline answer: 结论：你刚才要求我回复时默认先给结论，再展开细节。
- shadow answer: 结论：你刚才要求我以后默认“先给结论，再展开细节”。

细节：你之前说的是“以后默认先给我结论，再展开细节。”
