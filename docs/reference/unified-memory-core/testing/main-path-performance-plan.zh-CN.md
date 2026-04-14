# 主链路性能专项计划

[English](main-path-performance-plan.md) | [中文](main-path-performance-plan.zh-CN.md)

## 目标

这份文档单独规划 post-Stage-5 的主链路性能工作。

它不回答“功能有没有”，而回答：

- 哪些链路要测
- 怎么测
- 慢点怎么分层
- 哪些结果可以进下一轮优化优先级

## 当前结论

当前主链路已经被拆成三层，不再混在一起：

1. retrieval / assembly 内部主链路
2. raw `openclaw memory search` transport
3. live `openclaw agent` answer-level host path

这三层现在必须分别测、分别看，不允许再把它们混成一个“memory search 性能”。

## 需要持续记录的 baseline

### 1. Retrieval / Assembly

目标：

- 量化插件内部 retrieval、scoring、assembly 的耗时
- 判断慢点是不是来自 retrieval fan-out，还是 assembly 本身

入口：

```bash
npm run eval:perf -- --timeout-ms 15000
```

核心指标：

- `retrievalMs`
- `scoringMs`
- `assemblyMs`
- `totalMs`
- `candidateCount`
- `selectedCount`

### 2. Raw Transport

目标：

- 单独看 raw `openclaw memory search` 命令本身是否超时、空结果或不稳定
- 不让 transport 问题继续污染插件算法判断

入口：

```bash
npm run eval:openclaw:transport-watch
```

核心指标：

- `rawOk`
- `watchlist`
- `averageDurationMs`
- `maxDurationMs`
- 分类失败分布

### 3. Answer-Level Host Path

目标：

- 量化真实 `openclaw agent` 问答路径的耗时
- 区分“很慢但答对”和“很慢且直接 abstain”

入口：

```bash
npm run eval:openclaw:agent-matrix -- --skip-legacy --max-cases 36 --format markdown
```

以及：

```bash
npm run eval:main-path:perf
```

核心指标：

- `durationMs`
- pass/fail
- abstention rate
- 当前值问题和普通事实问题的差异

## 分层归因规则

### 当 retrieval / assembly 绿、transport 有 watchlist、answer-level 红

判断：

- 优先看宿主 answer-level consumption boundary
- 不把问题误判成 retrieval 算法回退

### 当 retrieval / assembly 红、transport 也红

判断：

- 先分出 transport 失败比例
- 只有 transport 之外仍然显著变差，才算插件主链路性能问题

### 当 answer-level 绿、transport 红

判断：

- transport 继续留在 watchlist
- 不因为 transport 红就阻断 answer-level 算法优化

## 建议预算

当前先用工程预算，不先承诺产品 SLA：

- retrieval / assembly perf baseline：保持毫秒级，重点盯平均值和最慢 case
- raw transport：先看趋势与失败分布，不先硬设 SLA
- answer-level host path：先降低明显异常的几十秒级慢路径，再讨论更细预算

## 下一轮优化顺序

1. 保持 isolated local answer-level formal gate 继续为绿，并把样本面从当前 `6` 条代表性 case 扩大
2. 把 gateway/session-lock 噪声与 raw transport failure 继续隔离，避免重新污染 answer-level 结论
3. 在正式门禁稳定的前提下，再决定最慢层是宿主接入、prompt/context 组装，还是调用边界的问题
4. 每轮性能优化后都要重跑 baseline，并写回报告
