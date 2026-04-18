# 路线图

[English](roadmap.md) | [中文](roadmap.zh-CN.md)

## 范围

这页是仓库的稳定路线图包装层。它负责回答：

- 当前主线已经做到哪
- 如果只关心 `Context Minor GC`，应该按什么顺序看
- `Minor GC` 收口后，真正剩下的工作是什么

实时执行状态仍以这些控制面为准：

- [../.codex/status.md](../.codex/status.md)
- [../.codex/plan.md](../.codex/plan.md)

详细执行队列看这里：

- [reference/unified-memory-core/development-plan.zh-CN.md](reference/unified-memory-core/development-plan.zh-CN.md)

## 当前真相

| 项目 | 当前状态 |
| --- | --- |
| `Context Minor GC` | 已收口，不再是当前 blocker |
| Stage 7 / Step 108 | 已完成：插件内自托管 decision runner 已落地，不需要修改 OpenClaw core |
| Stage 7 / `104` harder eval matrix | 已完成：live matrix `6 / 6` |
| Stage 9 guarded smart path | 已完成：live A/B baseline `4 / 4`、guarded `4 / 4`，但继续保持 `default-off` / opt-in only |
| 当前阶段 | `post-stage10-adoption-closeout` |
| 当前切片 | `hold-stage10-adoption-proof-stable` |
| 当前主目标 | 保持 Docker hermetic 基线、Stage 10 shortest-path / shared-foundation proof、以及 `Context Minor GC` operator scorecard 长期为绿 |
| 下一候选切片 | `formalize-realtime-memory-intent-ingestion` |

一句话总结：

`Minor GC` 这条线已经做完“可用性收口”，现在剩下的不是“继续证明它能不能跑”，而是“保持它稳定、保持 guarded 边界、以及转向下一条产品主线”。

## 如果只关心 Minor GC，按这个顺序看

1. [Context Minor GC 架构页](reference/unified-memory-core/architecture/context-minor-gc.zh-CN.md)
   - 先看概念边界、已完成什么、还剩什么
2. [Stage 7 / Step 108 收口报告](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)
   - 看“不改 OpenClaw core，如何打通 decision transport”
3. [Stage 7 `Context Minor GC` 收口报告](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md)
   - 看 Stage 7 为什么已经能正式关闭
4. [Stage 9 收口报告](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md)
   - 看 guarded smart path 为什么已收口，但仍然保持 `default-off`
5. [开发计划](reference/unified-memory-core/development-plan.zh-CN.md)
   - 看 Minor GC 之后真正排队的下一条工作

## Context Minor GC 当前状态

这块单独列出来，是为了避免 `roadmap / plan / 架构页 / 报告` 各说各话。

- Stage 6 `dialogue working-set shadow`：已完成，保持 `default-off` + shadow-only
- Stage 7 scorecard：captured `16 / 16`
- Stage 7 average raw reduction ratio：`0.4191`
- Stage 7 / Step 108：已完成
  - hermetic gateway captured `5 / 5`
  - 本机 service smoke captured `3 / 3`
- Stage 7 / `104` harder live matrix：`6 / 6`
  - captured `6 / 6`
  - relation `6 / 6`
  - reduction `6 / 6`
- Stage 9 guarded live A/B：已完成
  - baseline `4 / 4`
  - guarded `4 / 4`
  - guarded applied `2 / 4`
  - activation matched `4 / 4`
  - false activations `0`
  - missed activations `0`

解释：

- `Minor GC` 的能力闭环已经完成
- 它没有被推进成默认 active-path
- 这不是“没做完”，而是刻意保留的产品边界

## 当前 / 下一步 / 更后面

| 时间层级 | 重点 | 退出信号 |
| --- | --- | --- |
| 当前 | 维护态：保持 Docker hermetic、Stage 10 最短接入路径、shared-foundation proof、`Context Minor GC` scorecard 持续为绿 | 新改动不会把 Stage 7 / 9 / 10 的证据面打回红色 |
| 下一步 | 把“主回复 + `memory_extraction`”收成正式产品契约，补上 ordinary-conversation rule 的实时 governed ingest 入口 | replay gate、admission routing、adapter tests、架构文档全部对齐 |
| 更后面 | 对同一批核心案例做 `legacy / unified / bootstrap / retrieval` 对照，明确答案来源和增益边界 | 用户能直接看懂哪些能力来自原生、哪些来自扩展、哪些只是 bootstrap 输入 |

## 当前评估结论

- 已完成：
  - Stage 7 `Context Minor GC` 已关闭
  - Step 108 已关闭
  - Stage 9 `guarded smart path` 已关闭
  - Stage 10 adoption / shared-foundation proof 已关闭
- 继续保持：
  - `Context Minor GC` operator scorecard 为绿
  - Docker 为默认 hermetic A/B 面
  - guarded seam 继续 `default-off` / opt-in only
- 现在不做：
  - 不把 guarded path 扩成默认 active prompt mutation
  - 不修改 OpenClaw builtin memory 行为
  - 不重新打开“Minor GC 到底能不能跑通”这个问题

## 三个用户价值与当前里程碑

| 用户价值 | 已落地 | 当前证据面 | 现在真正剩下的 |
| --- | --- | --- | --- |
| `轻快` | fact-first assembly、runtime shadow、`Context Minor GC` closeout、Docker hermetic eval | Stage 7 closeout、harder matrix `6 / 6`、Stage 9 live A/B | 让“轻快”持续为绿，而不是重新打开 Stage 7；未来是否扩大默认路径，必须是新的显式产品决策 |
| `聪明` | realtime / nightly 学习链路、working-set pruning、guarded smart path | ordinary-conversation strict closeout、Stage 9 closeout | 下一条真正的新工作是 `memory_extraction` / governed ingest，而不是回头补 Minor GC 基础能力 |
| `省心` | `umc` CLI、inspect / audit / replay / rollback、shared foundation | Stage 10 closeout、release-preflight、Docker hermetic baseline | 保持 operator 证据面可读、可跑、可回放 |
