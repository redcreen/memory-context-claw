# Unified Memory Core Roadmap

[English](#english) | [中文](#中文)

## English

## Final Target

`Unified Memory Core` is the official shared-memory product for:

- OpenClaw
- Codex
- future tools

It should become:

- a governed shared memory foundation
- a separable long-term product
- a multi-adapter system with explicit namespaces and visibility control

## Current Phase

Status: `phase 6 / design-complete and implementation-ready`

What is happening now:

- official product naming
- product/module split alignment
- top-level architecture correction
- master documentation alignment
- module architecture docs
- module roadmaps / blueprints / todo
- testing surfaces and case matrix
- deployment topology and multi-runtime model
- shared contracts and backbone definitions for steps 5-7
- OpenClaw / Codex adapter design packages for steps 8-9
- self-learning / standalone / independent-execution design packages for steps 10-12

## Program Roadmap

```mermaid
flowchart LR
    A["Phase 1\nProduct Framing"] --> B["Phase 2\nMaster Documentation"]
    B --> C["Phase 3\nModule Documentation"]
    C --> D["Phase 4\nTesting Surfaces"]
    D --> E["Phase 5\nIncremental Development"]
    E --> F["Phase 6\nIndependent Product Execution"]

    classDef phase fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class A,B,C,D,E,F phase;
```

### Phase 1: Product Framing

Goal:

- confirm product name
- confirm adapter model
- confirm first-class module split
- confirm repo incubation strategy

### Phase 2: Master Documentation

Goal:

- finalize top-level architecture
- finalize master roadmap
- finalize future repo layout
- record overall implementation order

### Phase 3: Module Documentation

Goal:

- create sub-architecture docs
- create module roadmaps
- create module blueprints
- create module todo pages

### Phase 4: Testing Surfaces

Goal:

- create module case matrix
- define regression surfaces
- define artifact validation surfaces
- define adapter compatibility checks

### Phase 5: Incremental Development

Goal:

- develop modules in sequence
- start with contracts and source model
- keep docs and testing aligned from day one

### Phase 6: Independent Product Execution

Goal:

- continue executing the independent product direction from the current main branch
- preserve old plugin-first shape through branch snapshot when needed
- keep adapters and core evolving under one product roadmap

## First-Class Module Tracks

1. `Source System`
2. `Reflection System`
3. `Memory Registry`
4. `Projection System`
5. `Governance System`
6. `OpenClaw Adapter`
7. `Codex Adapter`

## 中文

## 最终目标

`Unified Memory Core` 是面向：

- OpenClaw
- Codex
- 后续其他工具

的正式共享记忆产品。

它最终要成为：

- 一套受治理的共享记忆底座
- 一个可独立拆分的长期产品
- 一个具备显式 namespace 和可见性控制的多 adapter 系统

## 当前阶段

状态：`phase 6 / 设计包已完成，可进入实现`

当前正在做：

- 正式产品命名
- 产品 / 模块拆分对齐
- 顶层架构纠偏
- 主文档体系对齐
- 模块架构文档补齐
- 模块 roadmap / blueprint / todo 补齐
- testing surfaces 与 case matrix 建立
- deployment topology 与多 runtime 模型补齐
- Step 5-7 的 shared contracts 与 backbone definitions 定稿
- Step 8-9 的 OpenClaw / Codex adapter 设计包定稿
- Step 10-12 的 self-learning / standalone / independent-execution 设计包定稿

## 项目路线图

```mermaid
flowchart LR
    A["Phase 1\n产品定型"] --> B["Phase 2\n主文档体系"]
    B --> C["Phase 3\n模块文档体系"]
    C --> D["Phase 4\n测试面"]
    D --> E["Phase 5\n逐步开发"]
    E --> F["Phase 6\n独立产品执行"]

    classDef phase fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class A,B,C,D,E,F phase;
```

### Phase 1：产品定型

目标：

- 确认正式产品名
- 确认 adapter 模型
- 确认一等模块拆分
- 确认仓内孵化策略

### Phase 2：主文档体系

目标：

- 定稿顶层架构
- 定稿主 roadmap
- 定稿开发总计划
- 定稿未来仓库结构
- 记录总体实施顺序

### Phase 3：模块文档体系

目标：

- 建立子架构文档
- 建立模块 roadmap
- 建立模块 blueprint
- 建立模块 todo

### Phase 4：测试面

目标：

- 建立模块用例矩阵
- 定义回归面
- 定义 artifact 校验面
- 定义 adapter 兼容性检查

### Phase 5：逐步开发

目标：

- 按模块顺序推进开发
- 从 contracts 和 source model 开始
- 从第一天起保持文档和测试同步

### Phase 6：独立产品执行

目标：

- 在当前主干上持续执行独立产品方向
- 通过分支快照保留旧的 plugin-first 形态
- 让 core 与 adapters 在同一产品 roadmap 下持续演进

## 一等模块主线

1. `Source System`
2. `Reflection System`
3. `Memory Registry`
4. `Projection System`
5. `Governance System`
6. `OpenClaw Adapter`
7. `Codex Adapter`
