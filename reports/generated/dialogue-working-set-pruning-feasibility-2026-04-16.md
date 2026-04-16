# Dialogue Working-Set Pruning Feasibility Report

## 范围

这次验证只做隔离式 mock，不改现有主系统读写路径：

- 不接入当前 `contextEngine`
- 不改 builtin memory
- 不改现有长期记忆治理
- 只验证“多话题长对话里，LLM 是否能稳定给出下一轮 prompt working set 的 soft-evict 决策”

评估输入来自：

- [evals/dialogue-working-set-pruning-cases.js](../../evals/dialogue-working-set-pruning-cases.js)
- [src/dialogue-working-set.js](../../src/dialogue-working-set.js)
- [scripts/eval-dialogue-working-set-pruning.js](../../scripts/eval-dialogue-working-set-pruning.js)

真实模型评估配置：

- model: `gpt-5.4`
- reasoning effort: `low`
- case count: `5`
- 方式：真实 `codex exec --json` + output schema，非手写结果

## 总结论

结论是：**可行，而且可行性已经足够强，值得进入下一阶段的 shadow integration。**

原因不是“模型看起来懂了”，而是这 5 个多话题案例里，真实模型已经稳定表现出我们要的 3 种能力：

1. 能区分 `continue / branch / switch`
2. 能把 durable facts 从 raw turns 中分离成 semantic pins
3. 能在换题时显著缩小下一轮 raw working set，同时不误伤 latest user turn 和 open loop

## 总体数据

- case 通过率：`5 / 5`
- total baseline tokens: `182`
- total kept tokens: `94`
- aggregate reduction ratio: `0.4835`
- switch-case average reduction ratio: `0.6341`

这组数字的意义是：

- 如果只是普通连续追问，working set 可以只做轻量裁剪
- 如果发生明确换题，raw prompt working set 的压缩幅度已经能达到 `48% - 73%`
- open-loop 分支问题不会被误判成“可以把旧任务全丢掉”

## Case 数据

| Case | Relation | Passed | Baseline | Kept | Reduction | Evict | Pins |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| [continue-context-slimming-followup](dialogue-working-set-pruning/continue-context-slimming-followup.md) | `continue` | `true` | `39` | `29` | `0.2564` | `["t1","t2","t3"]` | `["t2"]` |
| [branch-keep-open-loop-stage6](dialogue-working-set-pruning/branch-keep-open-loop-stage6.md) | `branch` | `true` | `24` | `24` | `0.0000` | `[]` | `["t1","t2"]` |
| [switch-project-to-config-with-pins](dialogue-working-set-pruning/switch-project-to-config-with-pins.md) | `switch` | `true` | `48` | `13` | `0.7292` | `["t1","t2","t3","t4","t5","t6"]` | `["t1","t5"]` |
| [switch-family-to-code-with-durable-pins](dialogue-working-set-pruning/switch-family-to-code-with-durable-pins.md) | `switch` | `true` | `29` | `15` | `0.4828` | `["t1","t2","t3","t4"]` | `["t1","t3"]` |
| [switch-prune-status-noise-keep-style-pin](dialogue-working-set-pruning/switch-prune-status-noise-keep-style-pin.md) | `switch` | `true` | `42` | `13` | `0.6905` | `["t1","t2","t3"]` | `["t2"]` |

## 真实 LLM 反馈摘录

### 1. `continue` 并不等于“什么都不裁”

`continue-context-slimming-followup` 中，模型判断当前仍是同一主题延续，但仍建议移除寒暄和已被 pin 化的风格偏好原始轮次：

> 当前仍是同一架构主题的连续跟进，不是换题。与当前问题最相关的是 t4-t6；t1 是寒暄可移除。t2-t3 主要承载稳定回复偏好，适合转为语义 pin 后从原始工作集中移除。

这说明它能做到：

- 继续当前话题
- 但不盲目保留所有 raw turns

### 2. `branch` 能保住 open loop

`branch-keep-open-loop-stage6` 中，模型没有因为用户插问一条命令就裁掉原任务：

> The active topic is a side question while the original Stage 6 planning task remains unfinished, so this is a branch. Do not evict the earlier planning turns because that loop is still open.

这正是我们最需要的保守行为：

- 支线问题存在
- 但主任务未结束
- 所以 working set 不能过瘦

### 3. `switch` 时会主动把 durable fact 和 raw turn 分开

`switch-family-to-code-with-durable-pins` 中，模型明确把家庭事实保留成 pins，同时移出旧原始轮次：

> The earlier family turns are no longer needed in the next-turn raw working set, but the factual user memories should be preserved as semantic pins.

这证明“事实保留、原文离场”这条策略是能被真实模型执行出来的。

### 4. 临时状态噪音能被干净剪掉

`switch-prune-status-noise-keep-style-pin` 中，模型把状态快照直接判成瞬时噪音：

> The status report is transient noise, and the meta exchange about remembering a style preference is resolved.

这类内容正是长对话 prompt 里最常见、也最该优先清理的负担。

### 5. 明确换题时，压缩幅度足够大

`switch-project-to-config-with-pins` 的结果最激进也最有代表性：

- baseline: `48`
- kept: `13`
- reduction: `0.7292`

模型把整段已结束的项目概括和偏好确认原始轮次都移走，只保留最后的配置问题，并把 durable preference 留成 pins。

## 这次验证真正证明了什么

这次不是在证明“LLM 很聪明”。

这次证明的是下面 4 条运行时约束在真实模型上成立：

1. latest user turn 可以被稳定保护
2. open loop 在 `branch` 案例里不会被误删
3. durable fact / durable preference 可以和 raw turns 分离
4. topic switch 出现后，working set 的 raw-token 压缩是实打实可量化的

## 还没有证明什么

这次验证还没有证明：

1. 把这套逻辑直接接进生产 `contextEngine` 后，answer-level 一定更好
2. 所有边界语料都能一次命中
3. working-set pruning 与现有 retrieval / budgeted assembly 并线后一定没有交互副作用

所以当前最合理的下一步不是直接改主系统，而是：

1. 保持现有系统不动
2. 先做 runtime shadow mode
3. 记录每轮 `relation / evict / pins / reduction ratio`
4. 只在 shadow 数据稳定后，再讨论进入真实 assembly

## 建议

建议进入下一阶段，但继续坚持这三个边界：

1. 只做 `soft eviction`
   - 原始 session log 不删
2. 只做 `working-set pruning`
   - 不替代长期记忆治理
3. 先做 `shadow integration`
   - 不直接切生产 prompt

在这个前提下，这条方案已经不是“拍脑袋设想”，而是**有真实模型反馈、有多案例数据、有明确压缩收益的可执行方向**。
