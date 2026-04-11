# Unified Memory Core Architecture

[English](#english) | [中文](#中文)

## English

## Purpose

This document defines the official product-level architecture for `Unified Memory Core`.

It is meant to answer one question first:

`if memory should become the shared foundation across OpenClaw, Codex, and future tools, what should the overall architecture look like?`

It is the top-level architecture reference for the new product direction.

Related deployment reference:

- [docs/unified-memory-core/deployment-topology.md](docs/unified-memory-core/deployment-topology.md)

## Executive View

Recommended direction:

- `Unified Memory Core` becomes the long-term shared memory foundation
- `unified-memory-core` becomes the OpenClaw adapter / consumer
- future Codex integration becomes the Codex adapter / consumer
- other tools connect through explicit adapters instead of direct coupling

## One Big Picture

```mermaid
flowchart TB
    subgraph TOOLS["Tool Integrations"]
        OA["OpenClaw Adapter"]
        CA["Codex Adapter"]
        TA["Other Tool Adapters"]
    end

    subgraph CORE["Unified Memory Core"]
        S["Source System"]
        R["Reflection System"]
        M["Memory Registry"]
        P["Projection / Export System"]
        G["Governance System"]

        S --> R --> M --> P
        G -. audit .-> S
        G -. audit .-> R
        G -. audit .-> M
        G -. audit .-> P
    end

    OA --> O1["OpenClaw retrieval / assembly"]
    CA --> C1["Codex prompt / context / tool workflow"]
    TA --> T1["CLI / agents / apps / services"]

    P --> OA
    P --> CA
    P --> TA

    classDef tool fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class OA,CA,TA,O1,C1,T1 tool;
    class S,R,M,P core;
    class G ops;
```

## Architecture Position

The important shift is:

`unified-memory-core` should not carry the entire long-term product direction by itself`

Instead:

- the shared memory layer should be designed as a reusable core
- OpenClaw should be one integration target
- Codex should be another integration target
- future consumers should not require redesigning the core

## Input-To-Output Flow

```mermaid
flowchart LR
    A["Conversations / docs / URLs / directories / images / manual CLI input"] --> B["Source Adapters"]
    B --> C["Normalize + fingerprint"]
    C --> D["Reflection + extraction"]
    D --> E["Candidate artifacts"]
    E --> F["Promotion / decay / conflict handling"]
    F --> G["Stable memory registry"]
    G --> H["Projection / export adapters"]
    H --> I["OpenClaw / Codex / other tools"]

    J["Audit / repair / replay"] -.-> E
    J -.-> F
    J -.-> G
    J -.-> H

    classDef input fill:#f7f1e3,stroke:#b58105,color:#4a3a00,stroke-width:1.6px;
    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class A,I input;
    class B,C,D,E,F,G,H core;
    class J ops;
```

## Why This Shape

This shape is meant to preserve five properties:

1. shared memory is not trapped inside one adapter
2. learning sources remain explicit and controllable
3. stable memory is not written directly from raw inputs
4. outputs can be projected differently for different tools
5. everything remains reviewable, repairable, and replayable

## Core Modules

```mermaid
flowchart TB
    subgraph S["1. Source System"]
        S1["Conversation Adapter"]
        S2["File Adapter"]
        S3["URL Adapter"]
        S4["Directory Adapter"]
        S5["Image Adapter"]
        S6["Manual CLI Input"]
    end

    subgraph R["2. Reflection System"]
        R1["Event Labeling"]
        R2["Pattern Extraction"]
        R3["Fact / Rule / Habit Candidate Builder"]
        R4["Evidence Scoring"]
    end

    subgraph M["3. Memory Registry"]
        M1["Source Artifacts"]
        M2["Candidate Artifacts"]
        M3["Stable Artifacts"]
        M4["Decision Trail"]
        M5["Conflict / Superseded Records"]
    end

    subgraph P["4. Projection System"]
        P1["OpenClaw Export"]
        P2["Codex Export"]
        P3["Generic JSON / API Export"]
        P4["Policy Projection"]
    end

    subgraph G["5. Governance System"]
        G1["Audit"]
        G2["Repair"]
        G3["Replay"]
        G4["Diff / History"]
        G5["Regression / Test Surfaces"]
    end

    S --> R --> M --> P
    G -. govern .-> S
    G -. govern .-> R
    G -. govern .-> M
    G -. govern .-> P

    classDef source fill:#f7f1e3,stroke:#b58105,color:#4a3a00,stroke-width:1.6px;
    classDef reflect fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    classDef memory fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef proj fill:#f3e8ff,stroke:#7c3aed,color:#4c1d95,stroke-width:1.6px;
    classDef govern fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class S1,S2,S3,S4,S5,S6 source;
    class R1,R2,R3,R4 reflect;
    class M1,M2,M3,M4,M5 memory;
    class P1,P2,P3,P4 proj;
    class G1,G2,G3,G4,G5 govern;
```

## Tool Boundary

The clean responsibility split should be:

- `Unified Memory Core`
  - owns ingestion
  - owns candidate generation
  - owns promotion lifecycle
  - owns audit trail
  - owns exports

- `OpenClaw Adapter`
  - owns OpenClaw-specific retrieval and context assembly integration

- `Codex Adapter`
  - owns Codex-specific prompt/context/tool integration

## Integration View

```mermaid
flowchart LR
    subgraph CORE["Unified Memory Core"]
        A["Sources"]
        B["Reflection"]
        C["Registry"]
        D["Exports"]
        A --> B --> C --> D
    end

    D --> O["OpenClaw Adapter"]
    D --> X["Codex Adapter"]
    D --> T["Other Adapters"]

    O --> O1["OpenClaw-specific consumption"]
    X --> X1["Codex-specific consumption"]
    T --> T1["Custom consumer logic"]

    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef adapter fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class A,B,C,D core;
    class O,X,T,O1,X1,T1 adapter;
```

## Runtime Topology Position

`Unified Memory Core` should support four deployment stages:

1. single host, local artifacts
2. multiple runtimes, shared workspace
3. shared registry service across hosts
4. runtime API layer on top of governed artifacts

Current recommended implementation target:

- build for `Stage 1 + Stage 2`
- keep contracts ready for `Stage 3 + Stage 4`

See:

- [docs/unified-memory-core/deployment-topology.md](docs/unified-memory-core/deployment-topology.md)

## Governance Loop

```mermaid
flowchart LR
    A["Source"] --> B["Candidate"]
    B --> C["Stable"]
    C --> D["Exported Result"]

    E["Audit"] -. inspect .-> A
    E -. inspect .-> B
    E -. inspect .-> C
    E -. inspect .-> D

    F["Repair"] --> B
    F --> C

    G["Replay"] --> A
    G --> B
    G --> D

    classDef state fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class A,B,C,D state;
    class E,F,G ops;
```

## Recommended Product Decision

Current decision:

`Unified Memory Core` is now the official independent product direction, and the current `main` branch is the active execution trunk for that direction.

## Suggested Future Document Tree

```mermaid
flowchart TB
    A["Unified Memory Core\nmaster index"] --> B["Top-level Architecture"]
    A --> C["Product Roadmap"]
    A --> D["Source System Architecture"]
    A --> E["Reflection System Architecture"]
    A --> F["Memory Registry Architecture"]
    A --> G["Projection System Architecture"]
    A --> H["Governance System Architecture"]

    D --> D1["Source Roadmap"]
    E --> E1["Reflection Roadmap"]
    F --> F1["Registry Roadmap"]
    G --> G1["Projection Roadmap"]
    H --> H1["Governance Roadmap"]

    D1 --> D2["Source Blueprint"]
    E1 --> E2["Reflection Blueprint"]
    F1 --> F2["Registry Blueprint"]
    G1 --> G2["Projection Blueprint"]
    H1 --> H2["Governance Blueprint"]

    classDef top fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    classDef arch fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef route fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class A top;
    class B,C,D,E,F,G,H arch;
    class D1,E1,F1,G1,H1,D2,E2,F2,G2,H2 route;
```

## Review Questions

Confirmed decisions reflected in this architecture:

1. `Unified Memory Core` is the official product name
2. `Projection` and `Governance` remain separate modules
3. `Codex Adapter` is first-class from day one
4. runtime API is a later roadmap item
5. the prior adapter-bootstrap shape is preserved through branch snapshot rather than blocking current main-branch progress

## 中文

## 文档目的

这份文档定义 `Unified Memory Core` 的正式产品级架构。

它先回答一个问题：

`如果记忆系统要成为 OpenClaw、Codex 以及后续其他工具共享的统一记忆底座，整体架构应该长什么样？`

它是这条新产品线的顶层架构参考。

## 总览图

建议方向：

- `Unified Memory Core` 作为长期共享记忆底座
- `unified-memory-core` 作为 OpenClaw adapter / consumer
- 后续 Codex 集成作为 Codex adapter / consumer
- 其他工具通过显式 adapter 接入，而不是直接耦合到核心里

## 一图总览

```mermaid
flowchart TB
    subgraph TOOLS["工具集成层"]
        OA["OpenClaw Adapter"]
        CA["Codex Adapter"]
        TA["Other Tool Adapters"]
    end

    subgraph CORE["Unified Memory Core"]
        S["Source System"]
        R["Reflection System"]
        M["Memory Registry"]
        P["Projection / Export System"]
        G["Governance System"]

        S --> R --> M --> P
        G -. 审计 .-> S
        G -. 审计 .-> R
        G -. 审计 .-> M
        G -. 审计 .-> P
    end

    OA --> O1["OpenClaw retrieval / assembly"]
    CA --> C1["Codex prompt / context / tool workflow"]
    TA --> T1["CLI / agents / apps / services"]

    P --> OA
    P --> CA
    P --> TA

    classDef tool fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class OA,CA,TA,O1,C1,T1 tool;
    class S,R,M,P core;
    class G ops;
```

## 架构定位

这里最关键的转向是：

`unified-memory-core` 不应该继续独自承载整个长期产品方向`

更合理的是：

- 共享记忆层设计成可复用 core
- OpenClaw 只是一个集成目标
- Codex 也是一个集成目标
- 未来新增消费者时，不需要重做核心架构

## 从输入到输出的主链

```mermaid
flowchart LR
    A["对话 / 文档 / URL / 目录 / 图片 / 手工 CLI 输入"] --> B["Source Adapters"]
    B --> C["Normalize + fingerprint"]
    C --> D["Reflection + extraction"]
    D --> E["Candidate artifacts"]
    E --> F["Promotion / decay / conflict handling"]
    F --> G["Stable memory registry"]
    G --> H["Projection / export adapters"]
    H --> I["OpenClaw / Codex / other tools"]

    J["Audit / repair / replay"] -.-> E
    J -.-> F
    J -.-> G
    J -.-> H

    classDef input fill:#f7f1e3,stroke:#b58105,color:#4a3a00,stroke-width:1.6px;
    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class A,I input;
    class B,C,D,E,F,G,H core;
    class J ops;
```

## 为什么要长这样

这个形状主要是为了保住 5 个性质：

1. 共享记忆不被困死在某一个 adapter 内部
2. 学习源保持显式、可控
3. 原始输入不能直接写 stable memory
4. 不同工具可以吃到不同投影结果
5. 整个链路始终可审、可修、可回放

## 核心模块

```mermaid
flowchart TB
    subgraph S["1. Source System"]
        S1["Conversation Adapter"]
        S2["File Adapter"]
        S3["URL Adapter"]
        S4["Directory Adapter"]
        S5["Image Adapter"]
        S6["Manual CLI Input"]
    end

    subgraph R["2. Reflection System"]
        R1["Event Labeling"]
        R2["Pattern Extraction"]
        R3["Fact / Rule / Habit Candidate Builder"]
        R4["Evidence Scoring"]
    end

    subgraph M["3. Memory Registry"]
        M1["Source Artifacts"]
        M2["Candidate Artifacts"]
        M3["Stable Artifacts"]
        M4["Decision Trail"]
        M5["Conflict / Superseded Records"]
    end

    subgraph P["4. Projection System"]
        P1["OpenClaw Export"]
        P2["Codex Export"]
        P3["Generic JSON / API Export"]
        P4["Policy Projection"]
    end

    subgraph G["5. Governance System"]
        G1["Audit"]
        G2["Repair"]
        G3["Replay"]
        G4["Diff / History"]
        G5["Regression / Test Surfaces"]
    end

    S --> R --> M --> P
    G -. govern .-> S
    G -. govern .-> R
    G -. govern .-> M
    G -. govern .-> P

    classDef source fill:#f7f1e3,stroke:#b58105,color:#4a3a00,stroke-width:1.6px;
    classDef reflect fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    classDef memory fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef proj fill:#f3e8ff,stroke:#7c3aed,color:#4c1d95,stroke-width:1.6px;
    classDef govern fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class S1,S2,S3,S4,S5,S6 source;
    class R1,R2,R3,R4 reflect;
    class M1,M2,M3,M4,M5 memory;
    class P1,P2,P3,P4 proj;
    class G1,G2,G3,G4,G5 govern;
```

## 工具边界

更干净的职责拆分应该是：

- `Unified Memory Core`
  - 负责 ingestion
  - 负责 candidate generation
  - 负责 promotion lifecycle
  - 负责 audit trail
  - 负责 exports

- `OpenClaw Adapter`
  - 负责 OpenClaw 专属的 retrieval / context assembly 集成

- `Codex Adapter`
  - 负责 Codex 专属的 prompt / context / tool 集成

## 集成视图

```mermaid
flowchart LR
    subgraph CORE["Unified Memory Core"]
        A["Sources"]
        B["Reflection"]
        C["Registry"]
        D["Exports"]
        A --> B --> C --> D
    end

    D --> O["OpenClaw Adapter"]
    D --> X["Codex Adapter"]
    D --> T["Other Adapters"]

    O --> O1["OpenClaw-specific consumption"]
    X --> X1["Codex-specific consumption"]
    T --> T1["Custom consumer logic"]

    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef adapter fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class A,B,C,D core;
    class O,X,T,O1,X1,T1 adapter;
```

## 治理与修复闭环

```mermaid
flowchart LR
    A["Source"] --> B["Candidate"]
    B --> C["Stable"]
    C --> D["Exported Result"]

    E["Audit"] -. inspect .-> A
    E -. inspect .-> B
    E -. inspect .-> C
    E -. inspect .-> D

    F["Repair"] --> B
    F --> C

    G["Replay"] --> A
    G --> B
    G --> D

    classDef state fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class A,B,C,D state;
    class E,F,G ops;
```

## 是否应该做成独立子项目

当前已经确认的决策是：

`Unified Memory Core` 现在就是正式独立产品方向，当前仓库的 `main` 分支就是这条方向的执行主干。

## 建议的后续文档树

```mermaid
flowchart TB
    A["Unified Memory Core\nmaster index"] --> B["Top-level Architecture"]
    A --> C["Product Roadmap"]
    A --> D["Source System Architecture"]
    A --> E["Reflection System Architecture"]
    A --> F["Memory Registry Architecture"]
    A --> G["Projection System Architecture"]
    A --> H["Governance System Architecture"]

    D --> D1["Source Roadmap"]
    E --> E1["Reflection Roadmap"]
    F --> F1["Registry Roadmap"]
    G --> G1["Projection Roadmap"]
    H --> H1["Governance Roadmap"]

    D1 --> D2["Source Blueprint"]
    E1 --> E2["Reflection Blueprint"]
    F1 --> F2["Registry Blueprint"]
    G1 --> G2["Projection Blueprint"]
    H1 --> H2["Governance Blueprint"]

    classDef top fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    classDef arch fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef route fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class A top;
    class B,C,D,E,F,G,H arch;
    class D1,E1,F1,G1,H1,D2,E2,F2,G2,H2 route;
```

## 需要你重点审的几个问题

这份架构已经反映以下已确认决策：

1. `Unified Memory Core` 是正式产品名
2. `Projection` 和 `Governance` 保持分开
3. `Codex Adapter` 从第一天就是一等 adapter
4. runtime API 放到后续 roadmap 阶段
5. 旧的 adapter-bootstrap 形态通过分支快照保留，不再阻塞当前主干推进
