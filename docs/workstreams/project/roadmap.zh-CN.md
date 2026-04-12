# Unified Memory Core Roadmap

[English](roadmap.md) | [中文](roadmap.zh-CN.md)

## 项目定位

`Unified Memory Core` 不是“又一个记忆插件”。

它的目标是成为 OpenClaw 一层**持续运行、可治理、事实优先的长期记忆上下文层**。

下一步的 learning 子系统已经被提升为正式产品方向的一部分。

这个产品现在已经正式命名为：

`Unified Memory Core`

一句话总结：

`把 OpenClaw 的长期记忆，变成一层可治理、事实优先、可直接服务任务的上下文系统。`

当前已经成立的事实是：

- 当前有治理的 baseline 已覆盖 Stage 3 self-learning lifecycle、Stage 4 policy adaptation、Stage 5 product hardening
- release-preflight、bundle install verify、host smoke，以及 registry-root operator policy 已进入当前 operator baseline
- 下一阶段不该重开 baseline contract work，而是先把这条 operator baseline 稳定住，再讨论后续增强

## 这份主 Roadmap 负责什么

`docs/roadmap.md` 是稳定的 roadmap 包装页。

这份文档是项目 workstream 的详细 roadmap 和文档索引。

它应该让下面四件事一眼就能看明白：

1. 项目最终想做成什么
2. 当前已经完成了什么
3. 当前正在做什么
4. 下一条主线准备怎么推进

它不负责承载每个专题的全部 phase 细节。

专题细节放到各自的 roadmap 里维护。

模块视角入口：

- [../../module-map.zh-CN.md](../../module-map.zh-CN.md)

## Roadmap 结构

```mermaid
flowchart TB
    A["docs/roadmap.zh-CN.md\n稳定 roadmap 包装页"] --> B["docs/architecture.zh-CN.md\n顶层架构"]
    A --> P["docs/workstreams/project/roadmap.zh-CN.md\n项目 workstream roadmap"]
    P --> C["docs/workstreams/memory-search/roadmap.zh-CN.md\nmemory-search roadmap"]
    P --> D["docs/workstreams/self-learning/roadmap.zh-CN.md\nself-learning roadmap"]
    C --> E["docs/workstreams/memory-search/next-blueprint.md\nmemory-search blueprint"]
    D --> F["docs/workstreams/self-learning/architecture.zh-CN.md\nself-learning architecture"]

    classDef top fill:#e8f1ff,stroke:#2f6feb,color:#123a73,stroke-width:1.5px;
    classDef work fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.5px;
    classDef arch fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.5px;
    class A,P top;
    class B,F arch;
    class C,D,E work;
```

## 当前状态快照

### 总体

- 项目状态：`可用 + 已治理 + 有回归保护`
- 架构状态：`Stage 5 closeout baseline 已完成`
- 治理状态：`已进入常规维护循环`
- 当前回归基线：
  - `critical smoke = 18/18`
  - `full smoke = 28/28`

### Workstream 状态

| Workstream | 状态 | 当前模式 |
| --- | --- | --- |
| 核心 capture / fact-card / assembly | `completed` | maintain + tune |
| Memory Search | `phase-complete` | governance + incremental expansion |
| Self-Learning / Reflection | `stage-complete` | governed lifecycle、policy adaptation、exports、CLI、governance surfaces 已可用 |
| Unified Memory Core | `stage5-complete / closeout` | 持续保持 release-preflight、deployment verification、root policy 稳定 |

## 进展图

```mermaid
flowchart TB
    A["Unified Memory Core 项目总览\n当前状态：Stage 5 closeout 维护中"] --> B["基础能力层\n已完成"]
    A --> C["Unified Memory Core 产品主线\nStage 1-5 已完成"]
    A --> D["Memory Search Workstream\nphase-complete / 治理中"]
    A --> E["Stage 5 之后的维护面\noperator baseline + 后续阶段 gate"]

    B --> B1["Capture Foundation\n已完成"]
    B --> B2["Fact / Card Foundation\n已完成"]
    B --> B3["Consumption Foundation\n已完成，持续调优"]
    B --> B4["Regression Foundation\n已完成"]
    B --> B5["Governance Foundation\n运行中"]

    C --> C1["Stage 1-2\ncontracts + source + registry + adapters\n已完成"]
    C --> C2["Stage 3\nself-learning lifecycle\n已完成"]
    C --> C3["Stage 4\npolicy adaptation\n已完成"]
    C --> C4["Stage 5\nproduct hardening + release-preflight\n已完成"]

    C1 --> C11["OpenClaw Adapter Runtime\n已完成"]
    C1 --> C12["Codex Adapter Runtime\n已完成"]
    C1 --> C13["Adapter Compatibility Tests\n已完成"]

    C2 --> C21["Daily Reflection + Promotion / Decay\n已完成"]
    C3 --> C31["Policy-input artifacts + consumer adaptation\n已完成"]
    C4 --> C41["Standalone source hardening + maintenance\n已完成"]
    C4 --> C42["Bundle install verify + host smoke\n已完成"]
    C4 --> C43["Independent execution + root policy\n已完成"]

    D --> D1["Memory Search Governance\n持续进行"]
    D --> D2["Case Expansion / Policy Tuning\n按需推进"]

    E --> E1["保持 Stage 5 evidence 持续为绿"]
    E --> E2["保持 canonical-root operator policy 持续可见"]
    E --> E3["只有在 prerequisites 持续为绿后，才开启后续增强规划"]

    classDef done fill:#e8f7e8,stroke:#2f855a,color:#1c4532,stroke-width:1.5px;
    classDef active fill:#eef6ff,stroke:#2563eb,color:#123a73,stroke-width:1.5px;
    classDef next fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.5px;

    class B,B1,B2,B3,B4,B5,C,C1,C2,C3,C4,C11,C12,C13,C21,C31,C41,C42,C43 done;
    class A,D,D1,D2,E,E1,E2 active;
    class E3 next;
```

## 已完成的项目基础

项目的基础层已经搭起来了。

### 1. Capture 基础层

状态：`completed`

已完成：

- session-memory 消费
- candidate distillation
- pre-compaction distillation
- 原始 session trace 保留

### 2. Fact/Card 基础层

状态：`completed`

已完成：

- fact 句提炼
- `conversation-memory-cards.md/json`
- 从 `workspace/MEMORY.md` 生成 stable cards
- 从 `workspace/memory/YYYY-MM-DD.md` 生成 stable cards
- 从 adapter 文档 / notes 生成 project cards

### 3. Consumption 基础层

状态：`completed with tuning`

已完成：

- cardArtifact consumption
- query rewrite
- heuristic rerank
- perf-critical fast path
- token-budget-aware assembly

仍在微调：

- optional LLM rerank evaluation

### 4. Regression 基础层

状态：`active + strong`

已完成：

- smoke suite
- perf suite
- stable-facts regression
- hot-session regression 的真实边界说明

当前基线：

- `critical smoke = 18/18`
- `full smoke = 28/28`

### 5. Governance 基础层

状态：`running as regular maintenance`

已完成：

- confirmed vs pending 分层
- pending export pipeline
- formal admission rules
- host workspace governance
- 周期性清理工具
- governance cycle
- duplicate audit
- conflict audit

仍在持续：

- conflict handling refinement
- 把更多稳定事实升进回归保护面
- 继续减少 session-derived explanations 与 formal policy 的重叠

## 当前焦点

### 下一条主要工程主线

**Stage 5 收口后的稳定维护**

为什么先做这个：

- `development-plan.md` 这条 local-first baseline 已经做完，而且顶层 roadmap 包装页已经对齐
- 现在的主要风险不再是缺实现，而是证据面或文档状态回退
- release-preflight、deployment verification、host-neutral root policy 必须继续保持可见且为绿，后续阶段才有资格开启
- 只有当 runtime API prerequisites 在一段时间内持续为绿时，才适合单独开新的 enhancement plan

关键文档：

- 主 roadmap：
  [../../roadmap.zh-CN.md](../../roadmap.zh-CN.md)
- 实施计划：
  [../../reference/unified-memory-core/development-plan.zh-CN.md](../../reference/unified-memory-core/development-plan.zh-CN.md)
- release preflight：
  [../../reference/unified-memory-core/testing/release-preflight.zh-CN.md](../../reference/unified-memory-core/testing/release-preflight.zh-CN.md)
- host-neutral roadmap：
  [../host-neutral-memory/roadmap.zh-CN.md](../host-neutral-memory/roadmap.zh-CN.md)

### 并行维护主线

**Memory Search**

当前状态：

- `Memory Search Workstream` 的 Phase A-E 已完成
- 现在已进入：
  - 常规治理
  - 增量 case 扩充
  - 按需 policy 调整
  - blueprint 驱动执行

当前治理质量：

- 最新 `eval:memory-search:cases` 摘要保持 `pluginSignalHits = 30/30`
- 最新 `eval:memory-search:cases` 摘要保持 `pluginSourceHits = 30/30`
- 最新 `eval:memory-search:cases` 摘要保持 `pluginFastPathLikely = 30/30`

关键文档：

- roadmap：
  [../memory-search/roadmap.zh-CN.md](../memory-search/roadmap.zh-CN.md)
- blueprint：
  [../memory-search/next-blueprint.zh-CN.md](../memory-search/next-blueprint.zh-CN.md)

## 当前已经计划好的下一阶段

项目下一步的大方向是：

`先把 post-Stage-5 的 operator baseline 稳定住，只有在 prerequisites 持续为绿后再单独开启新的增强阶段`

从这里开始的计划阶段是：

1. 保持 release-preflight、bundle install verify、host smoke、`Stage 5` evidence 持续为绿
2. 保持 canonical-root operator policy 在 CLI、公开文档和控制面里持续显式
3. 保持项目 / workstream roadmap 与 live implementation baseline 同步
4. 继续把 memory-search 维持在治理模式，只在必要时扩 targeted case
5. 只有在 runtime API / service-mode prerequisites 持续为绿后，才开启新的 enhancement plan

## 架构方向

当前更适合把整体架构理解为：

- `Unified Memory Core` 产品层
- `unified-memory-core` 作为 OpenClaw adapter
- `Codex Adapter` 作为一等 adapter

在产品内部，建议按 7 条一等模块组织：

1. **Source System**
2. **Reflection System**
3. **Memory Registry**
4. **Projection System**
5. **Governance System**
6. **OpenClaw Adapter**
7. **Codex Adapter**

## 文档地图

### 顶层文档

- [../../../README.zh-CN.md](../../../README.zh-CN.md)
- [../../architecture.zh-CN.md](../../architecture.zh-CN.md)
- [../../roadmap.zh-CN.md](../../roadmap.zh-CN.md)
- [../../module-map.zh-CN.md](../../module-map.zh-CN.md)
- [../../reference/unified-memory-core/deployment-topology.zh-CN.md](../../reference/unified-memory-core/deployment-topology.zh-CN.md)
- [../self-learning/architecture.zh-CN.md](../self-learning/architecture.zh-CN.md)

### 当前专题文档

- [../memory-search/architecture.zh-CN.md](../memory-search/architecture.zh-CN.md)
- [../memory-search/roadmap.zh-CN.md](../memory-search/roadmap.zh-CN.md)
- [../memory-search/next-blueprint.zh-CN.md](../memory-search/next-blueprint.zh-CN.md)
- [../self-learning/roadmap.zh-CN.md](../self-learning/roadmap.zh-CN.md)

## 建议接着读

- 如果想看里程碑层面的 roadmap 包装页：
  [../../roadmap.zh-CN.md](../../roadmap.zh-CN.md)
- 如果想看 post-Stage-5 的 operator 工作流：
  [../../reference/unified-memory-core/maintenance-workflow.zh-CN.md](../../reference/unified-memory-core/maintenance-workflow.zh-CN.md)
- 如果想看部署与发版 gate：
  [../../reference/unified-memory-core/testing/release-preflight.zh-CN.md](../../reference/unified-memory-core/testing/release-preflight.zh-CN.md)
- 如果想看 host-neutral operator policy 这条线：
  [../host-neutral-memory/roadmap.zh-CN.md](../host-neutral-memory/roadmap.zh-CN.md)
