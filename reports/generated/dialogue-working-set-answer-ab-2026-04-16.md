# Dialogue Working-Set Answer A/B

- model: `gpt-5.4`
- reasoning effort: `low`
- cases: `5`
- baselinePassed: `5`
- shadowPassed: `5`
- bothPass: `5`
- shadowOnly: `0`
- baselineOnly: `0`
- bothFail: `0`
- average estimated prompt reduction ratio: `0.0636`
- average baseline elapsed ms: `11674.4`
- average shadow elapsed ms: `12676`

## answer-ab-return-family-seat
- description: A durable seat preference should still answer correctly after a code detour.
- decision relation: `switch`
- decision raw reduction ratio: `0.5625`
- outcome: `both_pass`
- baseline prompt estimate: `140`
- shadow prompt estimate: `128`
- prompt reduction ratio: `0.0857`
- baseline elapsed ms: `12927`
- shadow elapsed ms: `12963`
- baseline answer: 靠过道。
- shadow answer: 结论：你坐飞机喜欢靠过道。

## answer-ab-branch-return-stage6
- description: A side fact should not break recall of an unfinished three-part rollout split.
- decision relation: `continue`
- decision raw reduction ratio: `0.4483`
- outcome: `both_pass`
- baseline prompt estimate: `133`
- shadow prompt estimate: `130`
- prompt reduction ratio: `0.0226`
- baseline elapsed ms: `10723`
- shadow elapsed ms: `13428`
- baseline answer: 版本正确性、安装验证、回滚安全。
- shadow answer: 版本正确性、安装验证、回滚安全。

## answer-ab-session-negative
- description: A one-off codename must not become a permanent default after the topic switches.
- decision relation: `switch`
- decision raw reduction ratio: `0.4444`
- outcome: `both_pass`
- baseline prompt estimate: `115`
- shadow prompt estimate: `116`
- prompt reduction ratio: `-0.0087`
- baseline elapsed ms: `12252`
- shadow elapsed ms: `12660`
- baseline answer: 没有长期默认称呼。`琥珀梯`只限那一轮临时使用。
- shadow answer: 没有长期默认称呼。`琥珀梯`只用于这一轮，不作为以后默认名称。

## answer-ab-current-task-after-switch
- description: After an older topic is closed, the current task should still answer correctly from the pruned working set.
- decision relation: `switch`
- decision raw reduction ratio: `0.9000`
- outcome: `both_pass`
- baseline prompt estimate: `147`
- shadow prompt estimate: `134`
- prompt reduction ratio: `0.0884`
- baseline elapsed ms: `10903`
- shadow elapsed ms: `12717`
- baseline answer: 当前新任务是写 shadow mode 报告。
- shadow answer: 当前新任务是写 shadow mode 报告。

## answer-ab-style-pin-survives
- description: A style preference should still answer correctly after an unrelated retrieval-policy detour.
- decision relation: `switch`
- decision raw reduction ratio: `0.7111`
- outcome: `both_pass`
- baseline prompt estimate: `154`
- shadow prompt estimate: `134`
- prompt reduction ratio: `0.1299`
- baseline elapsed ms: `11567`
- shadow elapsed ms: `11612`
- baseline answer: 结论：你刚才要求我回复时默认“先给结论，再展开细节”。
- shadow answer: 先给结论，再展开细节。

