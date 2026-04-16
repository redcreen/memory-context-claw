# 对话 Working-Set 裁剪

[English](dialogue-working-set-pruning.md) | [中文](dialogue-working-set-pruning.zh-CN.md)

## 目的

这份文档定义一个独立的运行时层，专门处理长对话里的多话题切换：

- 完整保留 session log
- 不改长期记忆沉淀链路
- 只在“下一轮 prompt 工作集”这个层面，把已经过期的原始对话块移出去

它不是下面两份设计的替代品：

- [context-slimming-and-budgeted-assembly.zh-CN.md](context-slimming-and-budgeted-assembly.zh-CN.md)
- [../../pre-compaction-memory-distillation-design.zh-CN.md](../../pre-compaction-memory-distillation-design.zh-CN.md)

它补的是两者之间的缺口：

- `context slimming` 关注 durable source 的检索与预算化组装
- `pre-compaction distillation` 关注 compact 前如何把重要信息沉淀成长期记忆
- `dialogue working-set pruning` 关注“近期原始对话里，哪些内容已经不该继续占用下一轮 prompt”

## 问题是什么

长对话不会一直围绕同一个主题。

真实对话经常是这样：

1. 话题 A 开始
2. 话题 B 插进来
3. 话题 C 变成真正的当前主话题
4. A/B 的原始轮次明明已经不再有帮助，却还继续占着 prompt

如果运行时把所有 raw turns 都同等保留，模型实际上一直在为这些内容付费：

- 已经解决的旧话题块
- 跑题的状态快照
- 一次性的 meta 交流
- 已经失效的解释链

这和 durable memory 检索不是同一个问题：

- 检索本身可能已经对了
- 但活动 prompt working set 还是太厚

## 非目标

这条设计不做这些事：

- 不删除 session log
- 不替代长期记忆治理
- 不重写 builtin memory 的存储方式
- 不要求每轮额外跑一次完整 compact
- 不让 LLM 直接拥有“永久删上下文”的权力

## 核心分层

运行时应该明确分成 4 层：

1. `session log`
   - 完整 raw turns；这条能力不删日志
2. `active working set`
   - 还允许进入下一轮 prompt 的原始轮次
3. `thread capsules`
   - 已归档的话题摘要或语义 pin
4. `durable memory`
   - 经过治理的长期事实、规则、已提升状态

关键约束是：

> working-set pruning 只能把 raw turns 从“下一轮 prompt”里移出去，不能销毁日志，也不能偷偷替代长期记忆策略。

## 决策契约

LLM 不应该直接返回“把这些轮次永久删掉”。

它应该返回一个受运行时约束的 hint，例如：

```json
{
  "relation": "continue | branch | switch | resolve",
  "confidence": 0.92,
  "evict_turn_ids": ["t3", "t4"],
  "pin_turn_ids": ["t1"],
  "archive_summary": "话题 A 已结束，只保留用户的回复风格偏好作为语义 pin。",
  "reasoning_summary": "当前问题已经切到插件配置，因此已解决的项目概括轮次可以离开原始 working set。"
}
```

最终控制权仍然在运行时：

- latest user turn 永远受保护
- 非法 id 直接忽略
- 被 evict 的 raw turns 仍保留在 session log
- `pin_turn_ids` 表示语义内容要以 pin / capsule 形式存活，即使原始轮次离开 prompt

## 关系语义

- `continue`
  - 还是同一个活动话题；除明显噪音外，原始块继续保留
- `branch`
  - 中途插了一个支线问题，但旧任务仍未结束；主任务和支线锚点都要保留
- `switch`
  - 当前活动话题已经切换；旧原始块可以离开下一轮 prompt，但长期事实或风格规则应继续以 pin 存活
- `resolve`
  - 对话大体收束；保留 pins 和 latest user turn，其余归档

## 运行时策略

第一版应该坚持 rule-first、guarded：

1. 先看廉价信号
   - token 压力
   - 显式换题标记
   - 是否仍有 unresolved task
   - 是否出现 durable preference
2. 只在必要时引入 LLM hint
   - 换题边界模糊
   - open loop 与新任务冲突
   - durable pin 和 session chatter 难区分
3. 只做 soft eviction
   - 从下一轮 prompt 移出
   - 日志继续保留
   - 后续允许再召回或转成 capsule

建议实现顺序：

1. mock evaluator + shadow report
2. runtime shadow mode
3. 小流量 guarded activation
4. 最后才真正并入正式 assembly

## 与现有设计的关系

### 与 Context Slimming 的关系

`context slimming and budgeted assembly` 负责控制 durable artifacts 如何被检索和装配。

`dialogue working-set pruning` 负责控制“最近 raw turns 里，哪些还值得继续占 prompt”。

两者互补：

- durable-source slimming 回答“哪些记忆产物该进来？”
- working-set pruning 回答“哪些近期原始轮次可以出去？”

### 与 Pre-Compaction Distillation 的关系

`pre-compaction distillation` 解决的是 compact 前如何把重要信息升级成长期记忆候选。

`dialogue working-set pruning` 更窄：

- 它只关心当前长对话里的 prompt 负载
- 它不决定 durable promotion
- 它可以发生在全局 compaction 阈值到来之前

## Mock First 可行性路径

为了避免过早改动当前系统，第一阶段应保持隔离：

- 评估样例：[../../../../evals/dialogue-working-set-pruning-cases.js](../../../../evals/dialogue-working-set-pruning-cases.js)
- 纯函数 helper：[../../../../src/dialogue-working-set.js](../../../../src/dialogue-working-set.js)
- 真实 LLM 评估器：[../../../../scripts/eval-dialogue-working-set-pruning.js](../../../../scripts/eval-dialogue-working-set-pruning.js)
- 单元测试：[../../../../test/dialogue-working-set.test.js](../../../../test/dialogue-working-set.test.js)
- 生成报告：[../../../../reports/generated/dialogue-working-set-pruning-feasibility-2026-04-16.md](../../../../reports/generated/dialogue-working-set-pruning-feasibility-2026-04-16.md)

mock 阶段至少要先证明 3 件事：

1. 多话题对话可以被稳定分成 `continue / branch / switch / resolve`
2. 旧 raw blocks 可以被移出 prompt，同时 durable facts 还能通过 pin 继续存在
3. token 降幅是真实的，而且不会误删 unresolved tasks 或 latest user turn

## 当前验证快照

这条设计现在已经不只是纯 mock feasibility，而是有足够证据进入 Stage 6 的 docs-first review gate。

- roadmap 指针：[../../../roadmap.zh-CN.md](../../../roadmap.zh-CN.md)
- development plan 指针：[../development-plan.zh-CN.md](../development-plan.zh-CN.md)
- 总验证汇总：[../../../../reports/generated/dialogue-working-set-validation-2026-04-16.md](../../../../reports/generated/dialogue-working-set-validation-2026-04-16.md)

当前证据：

- shadow replay：`9 / 9`
- shadow replay average raw reduction ratio：`0.5722`
- shadow replay average shadow-package reduction ratio：`0.2275`
- answer A/B：baseline `5 / 5`，shadow `5 / 5`，`0` 回归
- answer A/B average estimated prompt reduction ratio：`0.0636`
- adversarial replay：`7 / 7`

支撑报告：

- [../../../../reports/generated/dialogue-working-set-pruning-feasibility-2026-04-16.md](../../../../reports/generated/dialogue-working-set-pruning-feasibility-2026-04-16.md)
- [../../../../reports/generated/dialogue-working-set-shadow-replay-2026-04-16.md](../../../../reports/generated/dialogue-working-set-shadow-replay-2026-04-16.md)
- [../../../../reports/generated/dialogue-working-set-answer-ab-2026-04-16.md](../../../../reports/generated/dialogue-working-set-answer-ab-2026-04-16.md)
- [../../../../reports/generated/dialogue-working-set-adversarial-2026-04-16.md](../../../../reports/generated/dialogue-working-set-adversarial-2026-04-16.md)

当前解释：

- 方向已经足够强，可以进入 runtime shadow instrumentation
- 但证据还不够支撑直接切 active prompt path

## 当前 Runtime Gate

下一条实现 slice 现在刻意收窄成：

- 保持 `default-off`
- 记录 `relation / evict / pins / reduction ratio`
- 这一阶段不改正式 prompt
- 这一阶段不改 builtin memory 行为
- 只有当真实 session 的 shadow telemetry 长期为绿后，才讨论任何 guarded active-path experiment

## 验收标准

可行性阶段至少应证明：

1. 不发生硬删除
   - session log 完整保留
   - latest user turn 永远受保护
2. case 级决策质量达标
   - 必须保留的 open-loop turns 没被误删
   - switch cases 中应该淘汰的旧块被淘汰
   - durable facts 被 pin，而不是被静默丢弃
3. prompt 缩减可量化
   - switch cases 的 kept raw-token estimate 有明显下降
4. 真实 LLM 可复现
   - 结构化决策来自真实模型，而不是只靠手写 mock

## 当前建议

这条工作应该作为一个独立的 shadow-first workstream 往前推。

短期目标不是“智能删上下文”。

短期目标是：

- guarded soft eviction
- durable facts 的 semantic pin
- 在真正改主系统前，先证明多话题 prompt working set 可以安全变小

所以当前项目层面的决策是：

- 先 review 并通过 Stage 6 的 docs-first 规划
- 再落最小 runtime shadow instrumentation
- active prompt mutation 继续等 promotion gate 满足后再讨论
