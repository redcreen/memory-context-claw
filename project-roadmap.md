# Unified Memory Core Roadmap

[English](#english) | [中文](#中文)

## English

## Positioning

`Unified Memory Core` is not meant to be “just another memory plugin.”

The target is a **continuously running, governed, fact-first long-term memory context layer** for OpenClaw.

The next learning subsystem has now been lifted into an official product direction.

That product is now officially named:

`Unified Memory Core`

One-line summary:

`Turn OpenClaw long memory into a governed, fact-first, task-ready context system.`

## What This Master Roadmap Does

`project-roadmap.md` is the master roadmap and document index.

It should make four things obvious:

1. what the project is trying to become
2. what has already been completed
3. what is currently active
4. what the next major workstreams are

It is not the place for every detailed phase plan.

Use specialized roadmap documents for that.

Module view:

- [.codex/module-dashboard.md](.codex/module-dashboard.md)
- [docs/module-map.md](docs/module-map.md)

## Roadmap Stack

```mermaid
flowchart TB
    A["project-roadmap.md\nmaster roadmap / index"] --> B["system-architecture.md\ntop-level architecture"]
    A --> U["unified-memory-core.md\nproduct index"]
    A --> V["unified-memory-core-roadmap.md\nproduct roadmap"]
    A --> W["docs/unified-memory-core/deployment-topology.md\ndeployment topology"]
    A --> C["reports/memory-search-roadmap.md\nmemory-search roadmap"]
    A --> D["reports/self-learning-roadmap.md\nself-learning roadmap"]
    C --> E["reports/memory-search-next-blueprint.md\nmemory-search blueprint"]
    D --> F["self-learning-architecture.md\nself-learning architecture"]

    classDef top fill:#e8f1ff,stroke:#2f6feb,color:#123a73,stroke-width:1.5px;
    classDef work fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.5px;
    classDef arch fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.5px;
    class A top;
    class B,F,U,V,W arch;
    class C,D,E work;
```

## Status Snapshot

### Overall

- Project status: `usable + governed + regression-protected`
- Architecture status: `core backbone complete`
- Governance status: `running as regular maintenance`
- Current regression baseline:
  - `critical smoke = 10/10`
  - `full smoke = 25/25`

### Workstream Status

| Workstream | Status | Current mode |
| --- | --- | --- |
| Core capture / fact-card / assembly | `completed` | maintain + tune |
| Memory search | `phase-complete` | governance + incremental expansion |
| Self-learning / reflection | `baseline-implemented` | daily reflection, standalone loop, and governance surfaces available |
| Unified Memory Core | `baseline-complete` | tranche 1-3 complete; ready for next enhancement phase |

## Progress Map

```mermaid
flowchart TB
    A["Unified Memory Core Project\nCurrent state: first baseline complete"] --> B["Foundation Layer\ncompleted"]
    A --> C["Unified Memory Core Product Line\nTranche 1-3 completed"]
    A --> D["Memory Search Workstream\nphase-complete / governed"]
    A --> E["Next Phase\nroadmap alignment + new enhancement plan"]

    B --> B1["Capture Foundation\ncompleted"]
    B --> B2["Fact / Card Foundation\ncompleted"]
    B --> B3["Consumption Foundation\ncompleted with tuning"]
    B --> B4["Regression Foundation\ncompleted"]
    B --> B5["Governance Foundation\nrunning"]

    C --> C1["Tranche 1\ncontracts + source + registry\ncompleted"]
    C --> C2["Tranche 2\nprojection + governance + adapters\ncompleted"]
    C --> C3["Tranche 3\nreflection + standalone + independent execution\ncompleted"]

    C2 --> C21["OpenClaw Adapter Runtime\ncompleted"]
    C2 --> C22["Codex Adapter Runtime\ncompleted"]
    C2 --> C23["Adapter Compatibility Tests\ncompleted"]

    C3 --> C31["Daily Reflection Loop Baseline\ncompleted"]
    C3 --> C32["Standalone CLI\nsource / reflect / export / govern\ncompleted"]
    C3 --> C33["Independent Execution Review\nownership / release boundary / migration checklist\ncompleted"]

    D --> D1["Memory Search Governance\nongoing"]
    D --> D2["Case Expansion / Policy Tuning\nas needed"]

    E --> E1["Align roadmap docs with completed baseline"]
    E --> E2["Open next enhancement phase"]
    E2 --> E21["Likely first track:\nself-learning phase 3\npromotion / decay / policy-input artifacts"]

    classDef done fill:#e8f7e8,stroke:#2f855a,color:#1c4532,stroke-width:1.5px;
    classDef active fill:#eef6ff,stroke:#2563eb,color:#123a73,stroke-width:1.5px;
    classDef next fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.5px;

    class A,B,B1,B2,B3,B4,B5,C,C1,C2,C3,C21,C22,C23,C31,C32,C33 done;
    class D,D1,D2 active;
    class E,E1,E2,E21 next;
```

## Completed Foundation

The project foundation is already in place.

### 1. Capture foundation

Status: `completed`

Completed:

- session-memory consumption
- candidate distillation
- pre-compaction distillation
- raw session trace preservation

### 2. Fact/card foundation

Status: `completed`

Completed:

- fact sentence extraction
- `conversation-memory-cards.md/json`
- stable cards from `workspace/MEMORY.md`
- stable cards from `workspace/memory/YYYY-MM-DD.md`
- project cards from adapter docs / notes

### 3. Consumption foundation

Status: `completed with tuning`

Completed:

- cardArtifact consumption
- query rewrite
- heuristic rerank
- perf-critical fast path
- token-budget-aware assembly

Still tuning:

- optional LLM rerank evaluation

### 4. Regression foundation

Status: `active + strong`

Completed:

- smoke suite
- perf suite
- stable-facts regression
- hot-session regression framing

Current baseline:

- `critical smoke = 10/10`
- `full smoke = 25/25`

### 5. Governance foundation

Status: `running as regular maintenance`

Completed:

- confirmed vs pending separation
- pending export pipeline
- formal admission rules
- host workspace governance
- periodic cleanup tooling
- governance cycle
- duplicate audit
- conflict audit

Still ongoing:

- conflict handling refinement
- promotion of more stable facts into regression surfaces
- continued reduction of overlap between session-derived explanations and formal policy

## Current Focus

### Primary next engineering focus

**Roadmap Alignment + Next Enhancement Planning**

Why this is next:

- the current local-first baseline in `development-plan.md` is complete
- roadmap documents still need to reflect the true implementation state
- the next move should be a new enhancement-phase plan, not more work appended to the old baseline plan
- the most likely first coding track in that next phase is deeper self-learning policy work

Key documents:

- master roadmap:
  [project-roadmap.md](project-roadmap.md)
- product roadmap:
  [unified-memory-core-roadmap.md](unified-memory-core-roadmap.md)
- implementation plan:
  [docs/unified-memory-core/development-plan.md](docs/unified-memory-core/development-plan.md)
- self-learning roadmap:
  [reports/self-learning-roadmap.md](reports/self-learning-roadmap.md)

### Parallel maintenance focus

**Memory Search**

Current state:

- `Memory Search Workstream` phases A-E are complete
- it is now in:
  - regular governance
  - incremental case expansion
  - policy tuning when needed
  - blueprint-driven execution

Current governance quality:

- `pluginSignalHits = 6/6`
- `pluginSourceHits = 6/6`
- `pluginFailures = 0`
- `pluginSingleCard = 6/6`
- `pluginMultiCard = 0/6`
- `pluginNoisySupporting = 0/6`

Key documents:

- roadmap:
  [reports/memory-search-roadmap.md](reports/memory-search-roadmap.md)
- blueprint:
  [reports/memory-search-next-blueprint.md](reports/memory-search-next-blueprint.md)

## What Is Currently Planned

The next major project move is:

`close the roadmap gap between documents and implementation, then open a fresh enhancement phase`

Planned project stages from here:

1. align roadmap documents with the completed baseline
2. define the next enhancement-phase scope explicitly
3. choose one primary coding track instead of broad parallel expansion
4. keep memory-search in governance mode
5. preserve local-first and network-ready boundaries while planning future growth

## Architecture Direction

The long-term architecture is now best understood as:

- `Unified Memory Core` as the product-level memory foundation
- `unified-memory-core` as the OpenClaw adapter
- `Codex Adapter` as a first-class adapter track

Inside the product, the first-class modules are:

1. **Source System**
2. **Reflection System**
3. **Memory Registry**
4. **Projection System**
5. **Governance System**
6. **OpenClaw Adapter**
7. **Codex Adapter**

## Document Map

### Top-level documents

- [README.md](README.md)
- [system-architecture.md](system-architecture.md)
- [project-roadmap.md](project-roadmap.md)
- [docs/unified-memory-core/deployment-topology.md](docs/unified-memory-core/deployment-topology.md)
- [self-learning-architecture.md](self-learning-architecture.md)
- [unified-memory-core.md](unified-memory-core.md)
- [unified-memory-core-roadmap.md](unified-memory-core-roadmap.md)

### Current workstream documents

- [reports/memory-search-architecture.md](reports/memory-search-architecture.md)
- [reports/memory-search-roadmap.md](reports/memory-search-roadmap.md)
- [reports/memory-search-next-blueprint.md](reports/memory-search-next-blueprint.md)
- [reports/self-learning-roadmap.md](reports/self-learning-roadmap.md)

## Read This Next

- If you want overall system shape:
  [system-architecture.md](system-architecture.md)
- If you want the product direction:
  [unified-memory-core.md](unified-memory-core.md)
- If you want the product-level roadmap:
  [unified-memory-core-roadmap.md](unified-memory-core-roadmap.md)
- If you want the self-learning workstream inside that product:
  [self-learning-architecture.md](self-learning-architecture.md)

## 中文

## 项目定位

`Unified Memory Core` 不是“又一个记忆插件”。

它的目标是成为 OpenClaw 一层**持续运行、可治理、事实优先的长期记忆上下文层**。

下一步的 learning 子系统已经被提升为正式产品方向的一部分。

这个产品现在已经正式命名为：

`Unified Memory Core`

一句话总结：

`把 OpenClaw 的长期记忆，变成一层可治理、事实优先、可直接服务任务的上下文系统。`

## 这份主 Roadmap 负责什么

`project-roadmap.md` 是主 roadmap，也是文档总索引。

它应该让下面四件事一眼就能看明白：

1. 项目最终想做成什么
2. 当前已经完成了什么
3. 当前正在做什么
4. 下一条主线准备怎么推进

它不负责承载每个专题的全部 phase 细节。

专题细节放到各自的 roadmap 里维护。

模块视角入口：

- [docs/module-map.md](docs/module-map.md)

## Roadmap 结构

```mermaid
flowchart TB
    A["project-roadmap.md\n主 roadmap / 总索引"] --> B["system-architecture.md\n顶层架构"]
    A --> U["unified-memory-core.md\n产品索引"]
    A --> V["unified-memory-core-roadmap.md\n产品 roadmap"]
    A --> C["reports/memory-search-roadmap.md\nmemory-search roadmap"]
    A --> D["reports/self-learning-roadmap.md\nself-learning roadmap"]
    C --> E["reports/memory-search-next-blueprint.md\nmemory-search blueprint"]
    D --> F["self-learning-architecture.md\nself-learning architecture"]

    classDef top fill:#e8f1ff,stroke:#2f6feb,color:#123a73,stroke-width:1.5px;
    classDef work fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.5px;
    classDef arch fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.5px;
    class A top;
    class B,F,U,V arch;
    class C,D,E work;
```

## 当前状态快照

### 总体

- 项目状态：`可用 + 已治理 + 有回归保护`
- 架构状态：`主骨架已完成`
- 治理状态：`已进入常规维护循环`
- 当前回归基线：
  - `critical smoke = 10/10`
  - `full smoke = 25/25`

### Workstream 状态

| Workstream | 状态 | 当前模式 |
| --- | --- | --- |
| 核心 capture / fact-card / assembly | `completed` | maintain + tune |
| Memory Search | `phase-complete` | governance + incremental expansion |
| Self-Learning / Reflection | `baseline-implemented` | reflection、daily loop、standalone baseline 已落地 |
| Unified Memory Core | `baseline-complete` | tranche 1-3 已完成，进入下一阶段前的 roadmap 收口 |

## 进展图

```mermaid
flowchart TB
    A["Unified Memory Core 项目总览\n当前状态：第一阶段 baseline 已闭环"] --> B["基础能力层\n已完成"]
    A --> C["Unified Memory Core 产品主线\nTranche 1-3 已完成"]
    A --> D["Memory Search Workstream\nphase-complete / 治理中"]
    A --> E["下一阶段\nroadmap 收口 + 新增强计划"]

    B --> B1["Capture Foundation\n已完成"]
    B --> B2["Fact / Card Foundation\n已完成"]
    B --> B3["Consumption Foundation\n已完成，持续调优"]
    B --> B4["Regression Foundation\n已完成"]
    B --> B5["Governance Foundation\n运行中"]

    C --> C1["Tranche 1\ncontracts + source + registry\n已完成"]
    C --> C2["Tranche 2\nprojection + governance + adapters\n已完成"]
    C --> C3["Tranche 3\nreflection + standalone + independent execution\n已完成"]

    C2 --> C21["OpenClaw Adapter Runtime\n已完成"]
    C2 --> C22["Codex Adapter Runtime\n已完成"]
    C2 --> C23["Adapter Compatibility Tests\n已完成"]

    C3 --> C31["Daily Reflection Loop Baseline\n已完成"]
    C3 --> C32["Standalone CLI\nsource / reflect / export / govern\n已完成"]
    C3 --> C33["Independent Execution Review\nownership / release boundary / migration checklist\n已完成"]

    D --> D1["Memory Search Governance\n持续进行"]
    D --> D2["Case Expansion / Policy Tuning\n按需推进"]

    E --> E1["先把 roadmap 文档收口到真实进度"]
    E --> E2["再开启下一阶段增强计划"]
    E2 --> E21["优先候选主线：\nself-learning phase 3\npromotion / decay / policy-input artifacts"]

    classDef done fill:#e8f7e8,stroke:#2f855a,color:#1c4532,stroke-width:1.5px;
    classDef active fill:#eef6ff,stroke:#2563eb,color:#123a73,stroke-width:1.5px;
    classDef next fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.5px;

    class A,B,B1,B2,B3,B4,B5,C,C1,C2,C3,C21,C22,C23,C31,C32,C33 done;
    class D,D1,D2 active;
    class E,E1,E2,E21 next;
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

- `critical smoke = 10/10`
- `full smoke = 25/25`

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

**Roadmap 收口 + 下一阶段增强计划**

为什么先做这个：

- `development-plan.md` 这条 local-first baseline 已经做完
- 现在的主要缺口不是实现，而是 roadmap 文档状态还没有完全对齐真实进展
- 下一步应该新开增强阶段计划，而不是继续往旧 baseline 计划里追加内容
- 新阶段最可能的首条编码主线，是更深一层的 self-learning policy 能力

关键文档：

- 主 roadmap：
  [project-roadmap.md](project-roadmap.md)
- 产品 roadmap：
  [unified-memory-core-roadmap.md](unified-memory-core-roadmap.md)
- 实施计划：
  [docs/unified-memory-core/development-plan.md](docs/unified-memory-core/development-plan.md)
- self-learning roadmap：
  [reports/self-learning-roadmap.md](reports/self-learning-roadmap.md)

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

- `pluginSignalHits = 6/6`
- `pluginSourceHits = 6/6`
- `pluginFailures = 0`
- `pluginSingleCard = 6/6`
- `pluginMultiCard = 0/6`
- `pluginNoisySupporting = 0/6`

关键文档：

- roadmap：
  [reports/memory-search-roadmap.md](reports/memory-search-roadmap.md)
- blueprint：
  [reports/memory-search-next-blueprint.md](reports/memory-search-next-blueprint.md)

## 当前已经计划好的下一阶段

项目下一步的大方向是：

`先把文档与实现之间的状态差补齐，再单独开启新的增强阶段`

从这里开始的计划阶段是：

1. 把 roadmap 文档收口到已完成 baseline 的真实状态
2. 明确下一阶段 enhancement plan 的边界和范围
3. 只选一条主编码线推进，避免重新摊大并行面
4. 继续把 memory-search 维持在治理模式
5. 在规划未来扩展时继续守住 local-first 和 network-ready 边界

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

- [README.md](README.md)
- [system-architecture.md](system-architecture.md)
- [project-roadmap.md](project-roadmap.md)
- [self-learning-architecture.md](self-learning-architecture.md)
- [unified-memory-core.md](unified-memory-core.md)
- [unified-memory-core-roadmap.md](unified-memory-core-roadmap.md)

### 当前专题文档

- [reports/memory-search-architecture.md](reports/memory-search-architecture.md)
- [reports/memory-search-roadmap.md](reports/memory-search-roadmap.md)
- [reports/memory-search-next-blueprint.md](reports/memory-search-next-blueprint.md)
- [reports/self-learning-roadmap.md](reports/self-learning-roadmap.md)
- [unified-memory-core.md](unified-memory-core.md)
- [unified-memory-core-roadmap.md](unified-memory-core-roadmap.md)

## 建议接着读

- 如果想看整体系统形态：
  [system-architecture.md](system-architecture.md)
- 如果想看新的产品主线：
  [unified-memory-core.md](unified-memory-core.md)
- 如果想看产品级 roadmap：
  [unified-memory-core-roadmap.md](unified-memory-core-roadmap.md)
- 如果想看下一条主线的架构设计：
  [self-learning-architecture.md](self-learning-architecture.md)
- 如果想看接下来怎么分阶段开发：
  [reports/self-learning-roadmap.md](reports/self-learning-roadmap.md)
