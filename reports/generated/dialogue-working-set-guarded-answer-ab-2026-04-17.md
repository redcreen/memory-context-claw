# Dialogue Working-Set Guarded Answer A/B

- model: `gpt-5.4`
- reasoning effort: `low`
- output dir: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-guarded-answer-ab-2026-04-17`
- cases: `5`
- baseline passed: `5`
- shadow passed: `5`
- guarded passed: `5`
- guarded applied: `2`
- guarded only: `0`
- guarded vs shadow wins: `0`
- average shadow prompt reduction ratio: `0.0587`
- average guarded prompt reduction ratio: `0.0424`

## answer-ab-return-family-seat
- description: A durable seat preference should still answer correctly after a code detour.
- guarded applied: `true`
- relation: `switch`
- baseline answer: 你坐飞机喜欢靠过道。
- shadow answer: 靠过道。
- guarded answer: 你坐飞机喜欢靠过道。
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-guarded-answer-ab-2026-04-17/exports/agent-stage9-guarded-answer-ab-answer-ab-return-family-seat-shadow-1776410420030-t0oehr.json`

## answer-ab-branch-return-stage6
- description: A side fact should not break recall of an unfinished three-part rollout split.
- guarded applied: `false`
- relation: `branch`
- baseline answer: 刚才拆成三部分是：版本正确性、安装验证、回滚安全。
- shadow answer: 版本正确性、安装验证、回滚安全。
- guarded answer: 刚才拆成的三部分是：版本正确性、安装验证、回滚安全。
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-guarded-answer-ab-2026-04-17/exports/agent-stage9-guarded-answer-ab-answer-ab-branch-return-stage6-shadow-1776410437600-ggzntx.json`

## answer-ab-session-negative
- description: A one-off codename must not become a permanent default after the topic switches.
- guarded applied: `false`
- relation: `continue`
- baseline answer: 没有长期默认称呼。
- shadow answer: 没有长期默认称呼。`琥珀梯`只是这一次临时叫法。
- guarded answer: 没有长期默认；“琥珀梯”只限那一轮临时称呼。
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-guarded-answer-ab-2026-04-17/exports/agent-stage9-guarded-answer-ab-answer-ab-session-negative-shadow-1776410453853-pffw8b.json`

## answer-ab-current-task-after-switch
- description: After an older topic is closed, the current task should still answer correctly from the pruned working set.
- guarded applied: `false`
- relation: `continue`
- baseline answer: 当前新任务是写 shadow mode 报告。
- shadow answer: 当前新任务是写 shadow mode 报告。
- guarded answer: 当前新任务是写 shadow mode 报告。
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-guarded-answer-ab-2026-04-17/exports/agent-stage9-guarded-answer-ab-answer-ab-current-task-after-switch-shadow-1776410468101-icbf71.json`

## answer-ab-style-pin-survives
- description: A style preference should still answer correctly after an unrelated retrieval-policy detour.
- guarded applied: `true`
- relation: `switch`
- baseline answer: 先给结论，再展开细节。
- shadow answer: 你刚才要求我以后默认先给结论，再展开细节。
- guarded answer: 你刚才要求我以后默认先给结论，再展开细节。
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/dialogue-working-set-guarded-answer-ab-2026-04-17/exports/agent-stage9-guarded-answer-ab-answer-ab-style-pin-survives-shadow-1776410480422-s0bmpg.json`

