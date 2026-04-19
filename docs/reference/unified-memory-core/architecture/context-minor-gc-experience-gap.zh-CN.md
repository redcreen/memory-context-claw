# Context Minor GC Experience Gap

[English](context-minor-gc-experience-gap.md) | [中文](context-minor-gc-experience-gap.zh-CN.md)

## 目的

这份文档只回答一个面向产品使用感的问题：

`为什么 Context Minor GC 已经收口，但用户在 VS Code Codex 里仍然感觉不到“按需加载 context”的明显体感？`

它不再把这个问题解释成“Stage 11 之后的新主题”。

它的判断是：

- `Stage 11` 的用户体感验收标准定早了
- 这个缺口仍然属于 `Stage 11`
- `Stage 12` 不应该并进来混成同一阶段

相关文档：

- [context-minor-gc.zh-CN.md](context-minor-gc.zh-CN.md)
- [codex-context-gc-state.zh-CN.md](codex-context-gc-state.zh-CN.md)
- [../development-plan.zh-CN.md](../development-plan.zh-CN.md)
- [../../../workstreams/project/roadmap.zh-CN.md](../../../workstreams/project/roadmap.zh-CN.md)

## 最短判断

按“项目层是否已经做了 working-set 裁剪”这个标准，答案是：

- `做到了部分`

按“用户是否能明显感觉到这一轮实际送进模型的 context 变小了”这个标准，答案是：

- `没有做到`

所以用户的直观感受“并没有真正按需加载”是对的。

## 当前证据

下面这些数字来自当前同一条 Codex VS Code session 的近实时观测：

### 1. 宿主层几乎没有变小

一次典型最新观测里：

- `hostActualInputTokens = 148009`
- `hostOriginalInputTokens = 148227`

差值只有：

- `218 tokens`

这意味着：

- project 层即使发生裁剪，落到宿主层以后，净变化几乎不可感知

### 2. project 层确实有时会裁

同一轮 project 层观测里：

- `baseline_context_estimate = 927`
- `effective_context_estimate = 710`
- `prompt_reduction_ratio = 0.2352`

这说明：

- repo 自己注入的 `Context Minor GC Working Set` 确实发生了局部裁剪

### 3. 宿主线程仍在重放大前缀

最新 session token 观测里：

- `last_input_tokens = 133875`
- `cached_input_tokens = 133120`
- `cached_ratio = 0.9944`

这说明：

- 大部分输入前缀在被重复发送，只是 provider 侧缓存命中了
- `缓存命中高` 不等于 `上下文按需变小`

### 4. 当前 working set 仍保留长 raw assistant turns

当前 Codex packaged working set 里，仍然保留了多条长 assistant raw turns，而不是先摘要再 carry-forward。

这意味着：

- project 层的“按需”也偏保守
- 它更像“保留最近相关原文”，而不是“压成最小足够状态”

## 分层诊断

### L1. 宿主层

宿主层是用户真正能感受到的盘子。

问题：

- Codex host 会累计工具轨迹、长 commentary、长 final answer、调试输出
- repo 内的 helper 不能回写并重写宿主已经形成的历史

结论：

- 只优化 project 层注入块，不能显著改变宿主主盘子

### L2. project 层

project 层现在主要做的是：

- 读取最近 `user_message`
- 读取 `final_answer`
- 做 dialogue working-set decision
- 输出 `Context Minor GC Working Set`

问题：

- 默认最多抓最近 `48` 条 message
- carry-forward 仍以 raw turns 为主
- 只有在 reduction / evict / relation 同时过线时才真正 apply

结论：

- project 层是“可裁”，但不是“强裁”

### L3. 观测层

当前 footer 指标是：

- `last_token_usage.input_tokens`

它表示：

- 最近一轮请求输入量

它不是：

- VS Code 状态栏的线程累计占用

结论：

- 观测层现在能帮助诊断
- 但不能证明 end-to-end 体感已经达标

## 当前问题不是一个 bug，而是三个缺口叠加

1. **宿主不可回收缺口**
   repo 级 helper 只能裁自己注入的块，不能真正回收 Codex host 已经积累的长会话历史。
2. **project 层保守缺口**
   当前 packaged block 更偏向保留 raw turns，而不是最小 task-state。
3. **调试污染缺口**
   当排查问题时，如果把原始 session、工具输出、长报告继续写进同一条线程，就会直接把宿主层继续推高。

## 体感目标的可行性

这里必须分开说。

### 目标 A：新会话或后续会话里，context 增长速度明显变慢

可行性：

- `高`

原因：

- 这主要取决于我们是否减少增长源
- 包括短 commentary、summary-first carry-forward、把重型观测移出当前线程

预期：

- 在普通迭代会话里，能看到明显更慢的增长
- 用户体感有机会从“每轮都在涨很多”变成“只有复杂轮才明显上涨”

### 目标 B：当前这条已经很重的旧线程，context 立刻大幅下降

可行性：

- `低`

原因：

- 旧线程的宿主持久历史已经形成
- repo helper 不能强制删除宿主已经保留的上下文

预期：

- 可以小幅止血
- 不能指望从 `150k` 直接打回很低

### 目标 C：让用户明显感觉“现在真的按需加载了”

可行性：

- `中高`

前提：

1. 不把目标定义成“旧线程马上瘦身”
2. 而是定义成“从现在开始，新的复杂排查轮不再线性堆积”
3. 同时让 project 层从 raw-turn carry-forward 改成 summary-first carry-forward

## 推荐方案

### 方案 1：先控增长源

这是最高优先级。

做法：

- commentary 强制短化
- 避免在当前线程里 dump 原始 session / 大段工具输出
- 重型观测写入 repo 外或 report artifact，只回当前线程一个短摘要

价值：

- 直接改善宿主层增长速度

### 方案 2：project 层改成 summary-first

这是第二优先级。

做法：

- 不再优先保留长 assistant raw turns
- 把 current topic 压成 task-state summary
- raw turns 只保留最后极少数必要样本

价值：

- 让 `Context Minor GC Working Set` 真正接近“最小足够状态”

### 方案 3：分离 operator 观测与会话续写

这是第三优先级。

做法：

- `gc header/footer` 只输出极短指标
- 详细诊断写到 artifact
- 当前线程只引用结论，不引用大段原始数据

价值：

- 避免 helper 自己变成新的 context 污染源

## 不推荐的错误方向

1. 继续把 `window` 扩大，当作问题已经解决
2. 继续只调 header/footer 文案
3. 把 `Stage 12` 并入 `Stage 11`，把两个不同主题重新混成一个 stage

## Stage 11 边界修正

因此，这里的正确处理不是：

- “Minor GC 还没做完”
- “把它拆成另一个新 stage”

而是：

- `Minor GC core capability closed`
- `host-visible context loading experience still not acceptable`
- `that experience gap still belongs inside Stage 11`

同时：

- `Stage 12` 继续保持独立，不并进 `Stage 11`

原因：

- `Stage 11` 主题是 `Context Minor GC + Codex integration + user-visible context loading experience`
- `Stage 12` 主题是 `realtime memory intent productization`
- 这两个主题不是同一个问题

它和 `Stage 11` 的关系是：

- `Stage 11` 前半段已经证明能力可用
- 当前剩余工作就是把同一个 `Stage 11` 补到明显可感知的用户体验

## Stage 11 补充验收标准

如果要说 `Stage 11` 真正关闭，至少要满足下面几条：

1. 普通连续对话里，宿主层最近一轮输入不再轻易线性上升
2. 排查类轮次默认不再把原始大输出灌回当前线程
3. project 层 carry-forward 默认以 summary-first 为主，而不是 raw-turn-first
4. 用户能够明显观察到“同等复杂度下，这轮比以前薄很多”

## 最终判断

最短结论：

- 你要的目标不是空想
- 但它不是“修一个 helper 文案”就能达到
- 对新会话和后续会话，目标可行性是 `中高`
- 对已经很重的旧线程，立刻大幅降下来的可行性是 `低`

所以当前正确策略是：

- 不承诺“旧线程马上瘦身”
- 但把后续增长源和 project 层 carry-forward 一起改掉
- 把“体感可见”明确写回 `Stage 11` 的真实验收标准
