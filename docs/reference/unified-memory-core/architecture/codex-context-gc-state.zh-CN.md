# Codex Context GC Current State

[English](codex-context-gc-state.md) | [中文](codex-context-gc-state.zh-CN.md)

## 问题

`Codex 现在使用 GC 时，是否已经做到 context GC？`

## 一句话结论

分层回答：

- `project-level Context Minor GC`：`已经做到`
- `host-level thread context GC`：`还没有做到`
- `用户体感上的“明显按需加载 context”`：`还没有做到`

所以更准确的说法不是“完全没做成”，也不是“已经端到端做成了”，而是：

`repo 内的 working-set GC 已经能真实 apply，但它还不足以让 Codex 宿主整条线程明显变瘦。`

## 已经做到的部分

当前仓库里的 Codex 路径，已经不只是 shadow 记录。

真实生效点有三处：

1. `buildCodexContextMinorGcPackage(...)` 会在 guard 通过时，把 `effectiveContextBlock` 切到裁剪后的 packaged block，而不是保留 baseline block，见 [src/codex-context-minor-gc.js](./../../../../src/codex-context-minor-gc.js:193)。
2. VS Code helper 默认允许 `continue` 关系进入 apply 判定，不再只放行 `switch` / `resolve`，见 [src/codex-vscode-context-minor-gc.js](./../../../../src/codex-vscode-context-minor-gc.js:518)。
3. 真正给 prompt 注入内容时，`renderCodexVscodeContextMinorGcPrompt(...)` 只要看到 `applied=true`，就会输出裁剪后的 `effectiveContextBlock`，见 [src/codex-vscode-context-minor-gc.js](./../../../../src/codex-vscode-context-minor-gc.js:565)。

从 telemetry 看，这层能力也确实实际跑起来过。

例如 [reports/generated/codex-vscode-context-minor-gc/codex-telemetry.jsonl](./../../../../reports/generated/codex-vscode-context-minor-gc/codex-telemetry.jsonl:51) 里有多条：

- `applied=true`
- `relation=continue`
- `baseline_context_estimate=579`
- `effective_context_estimate=131`
- `prompt_reduction_ratio=0.7737`

这说明：

- 项目层的 context block 不是只“算出来能裁”
- 而是已经“真的被替换成更小的 working set”

## 还没做到的部分

真正没做到的是 `host-level context GC`。

当前这套实现主要裁的是：

- 仓库自己准备加进 prompt 的 `Context Minor GC Working Set`

它做不到的是：

- 回收 Codex 宿主线程已经累积下来的长 commentary、长 final answer、工具轨迹和历史前缀

这在实现里是明确可见的：

1. helper 读取的是 session 中最近的消息，再做 repo 内 working-set 裁剪，见 [src/codex-vscode-context-minor-gc.js](./../../../../src/codex-vscode-context-minor-gc.js:497)。
2. footer 里的 host 指标，本质上只是用 `last_token_usage.input_tokens` 估算“最近一轮请求输入量”，不是直接改写宿主上下文，见 [src/codex-vscode-context-minor-gc.js](./../../../../src/codex-vscode-context-minor-gc.js:607)。
3. 当前 packaged block 仍然保留 `Active raw turns` + `Semantic pins`，说明 project-level carry-forward 还是偏 raw-turn，不是彻底的 summary-first task-state，见 [src/codex-context-minor-gc.js](./../../../../src/codex-context-minor-gc.js:107)。

所以现状是：

- `project-level` 会缩
- `host-level` 不会因为这层 helper 自动大幅缩

## 为什么体感还不明显

问题不是一个点，而是三层叠加：

1. `宿主不可回收`
   repo helper 不能重写 Codex host 已形成的整条线程历史。
2. `project-level 仍偏保守`
   当前保留的是少量 raw turns + pins，不是最小 task-state。
3. `诊断本身会继续污染线程`
   如果在同一条线程里持续贴大段工具输出、session 观测和长分析，宿主盘子还是会继续涨。

这也是为什么：

- `GC 已经 apply`
- 但用户仍然会感觉 `context 没明显变小`

## 该怎么判断现在到底算不算“做到了”

按不同验收口径，答案不同。

### 口径 A：repo 内有没有真的做 working-set GC

答案：

- `有`

这是现在最确定的一层。

### 口径 B：当前旧线程会不会因为这层 GC 立刻明显瘦下来

答案：

- `不会`

这层不是宿主级 full compaction，也不是 thread history rewrite。

### 口径 C：用户现在能不能明显感觉到“按需加载”

答案：

- `还不能稳定做到`

尤其是已经很重的旧线程，体感改善通常不会明显。

## 现阶段最合理的产品判断

当前更准确的产品判断应该是：

- `Context Minor GC` 作为 repo 内能力，已经成立
- `体感型 context GC` 作为宿主层产品体验，还没有闭环

也就是说，当前不是“Minor GC 还没跑通”，而是：

`Minor GC 已经能跑通并真实 apply，但它离用户可感知的 host-level 轻量化，还差最后一层产品闭环。`

## 下一步该补什么

如果目标是让用户明显感觉到“现在真的按需加载了”，优先级应该是：

1. `summary-first carry-forward`
   先保留 task-state，再保留极少量 raw turns，不再默认带长 assistant 原文。
2. `operator 观测与会话续写分离`
   详细诊断写 artifact；当前线程只回短结论。
3. `限制线程内重型调试输出`
   避免为了观测 GC，又把宿主 context 继续推高。

## 最后结论

如果有人问：

`Codex 现在开了 GC，算不算已经做到 context GC？`

最短可复用回答应该是：

`部分做到了。repo 内 working-set GC 已经真实生效；但宿主线程级、用户体感级的 context GC 还没完全做到。`
