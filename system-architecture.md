# System Architecture

[English](#english) | [中文](#中文)

## English

## Purpose

This is the top-level system architecture document for the current repo.

It explains the latest official model:

- `Unified Memory Core` is the product-level shared memory foundation
- `unified-memory-core` is the OpenClaw-facing adapter and consumption layer
- `Codex Adapter` is a first-class integration target from day one
- `memory search` is now one workstream inside a broader multi-product architecture

This document should answer:

- what the overall system is now
- which boundaries are stable
- how data moves from sources to tools
- how the current repo is organized around product core and adapters
- where governance and testing sit

Related documents:

- [README.md](README.md)
- [project-roadmap.md](project-roadmap.md)
- [unified-memory-core.md](unified-memory-core.md)
- [unified-memory-core-architecture.md](unified-memory-core-architecture.md)
- [self-learning-architecture.md](self-learning-architecture.md)
- [reports/memory-search-architecture.md](reports/memory-search-architecture.md)

## Architecture At A Glance

```mermaid
flowchart TB
    subgraph CORE["Unified Memory Core"]
        S["Source System"]
        R["Reflection System"]
        M["Memory Registry"]
        P["Projection System"]
        G["Governance System"]

        S --> R --> M --> P
        G -. audit / repair / replay .-> S
        G -. audit / repair / replay .-> R
        G -. audit / repair / replay .-> M
        G -. audit / repair / replay .-> P
    end

    subgraph ADAPTERS["Adapters"]
        OA["OpenClaw Adapter\nunified-memory-core"]
        CA["Codex Adapter"]
        TA["Other Tool Adapters"]
    end

    P --> OA
    P --> CA
    P --> TA

    OA --> O1["OpenClaw retrieval / context assembly"]
    CA --> C1["Codex prompt / task / code workflow"]
    TA --> T1["CLI / agents / services / apps"]

    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef adapter fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class S,R,M,P core;
    class OA,CA,TA,O1,C1,T1 adapter;
    class G ops;
```

## Official Position

The current official architecture is:

1. `Unified Memory Core` is the shared-memory product
2. `unified-memory-core` is not the whole product anymore
3. `unified-memory-core` is the OpenClaw adapter and OpenClaw-specific consumption layer
4. `Codex Adapter` is part of the intended first-class architecture, not a later afterthought
5. product logic and tool-specific logic should stay separated through adapters

## System Goal

The combined system is meant to do three things well:

1. build governed memory from controlled sources
2. preserve high traceability and repairability
3. project stable memory differently for different tools without coupling the core to any one tool

## End-To-End Flow

```mermaid
flowchart LR
    A["Controlled sources\nconversation / file / URL / dir / image / CLI"] --> B["Source adapters"]
    B --> C["Normalization + fingerprinting"]
    C --> D["Reflection + extraction"]
    D --> E["Candidate artifacts"]
    E --> F["Promotion / decay / conflict handling"]
    F --> G["Stable memory registry"]
    G --> H["Projection / export adapters"]
    H --> I["OpenClaw / Codex / future tools"]

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

## Stable Boundaries

### 1. Product boundary

`Unified Memory Core` owns:

- source ingestion
- candidate generation
- artifact lifecycle
- decision trail
- exports
- governance controls

### 2. OpenClaw boundary

`unified-memory-core` owns:

- OpenClaw-specific retrieval policy
- OpenClaw-specific context assembly
- OpenClaw-facing export consumption
- integration with OpenClaw host behavior through the OpenClaw adapter

### 3. Codex boundary

`Codex Adapter` owns:

- Codex-facing code memory projection
- Codex-specific task guidance consumption
- Codex write-back event mapping

## Module Stack

```mermaid
flowchart TB
    subgraph M1["1. Source System"]
        A1["Conversation Adapter"]
        A2["File Adapter"]
        A3["URL Adapter"]
        A4["Directory Adapter"]
        A5["Image Adapter"]
        A6["Manual CLI Input"]
    end

    subgraph M2["2. Reflection System"]
        B1["Event Labeling"]
        B2["Pattern Extraction"]
        B3["Fact / Rule / Habit Candidates"]
        B4["Evidence Scoring"]
    end

    subgraph M3["3. Memory Registry"]
        C1["Source Artifacts"]
        C2["Candidate Artifacts"]
        C3["Stable Artifacts"]
        C4["Decision Trail"]
        C5["Conflict / Superseded Records"]
    end

    subgraph M4["4. Projection System"]
        D1["OpenClaw Export"]
        D2["Codex Export"]
        D3["Generic Export Artifacts"]
        D4["Policy Projection"]
    end

    subgraph M5["5. Governance System"]
        E1["Audit"]
        E2["Repair"]
        E3["Replay"]
        E4["Diff / History"]
        E5["Regression Surfaces"]
    end

    subgraph M6["6. Adapters"]
        F1["OpenClaw Adapter"]
        F2["Codex Adapter"]
        F3["Other Tool Adapters"]
    end

    M1 --> M2 --> M3 --> M4 --> M6
    M5 -. governs .-> M1
    M5 -. governs .-> M2
    M5 -. governs .-> M3
    M5 -. governs .-> M4

    classDef source fill:#f7f1e3,stroke:#b58105,color:#4a3a00,stroke-width:1.6px;
    classDef reflect fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    classDef memory fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef proj fill:#f3e8ff,stroke:#7c3aed,color:#4c1d95,stroke-width:1.6px;
    classDef govern fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    classDef adapter fill:#dbeafe,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class A1,A2,A3,A4,A5,A6 source;
    class B1,B2,B3,B4 reflect;
    class C1,C2,C3,C4,C5 memory;
    class D1,D2,D3,D4 proj;
    class E1,E2,E3,E4,E5 govern;
    class F1,F2,F3 adapter;
```

## OpenClaw Flow

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Host as "OpenClaw Host"
    participant Adapter as "unified-memory-core"
    participant Core as "Unified Memory Core"
    participant Search as "builtin memory_search"

    User->>Host: Ask a question
    Host->>Adapter: Request context assembly
    Adapter->>Core: Load relevant stable memory exports
    Adapter->>Adapter: Classify intent and choose retrieval mode

    alt Fact-first / formal-first path
        Adapter->>Adapter: Prefer exported stable facts and rules
    else Mixed / search-first path
        Adapter->>Search: Query builtin memory_search
        Search-->>Adapter: Raw host hits
        Adapter->>Adapter: Merge host hits with core exports
    end

    Adapter->>Adapter: Score, dedupe, and assemble final context
    Adapter-->>Host: Return context package
    Host-->>User: Final answer
```

## Codex Flow

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Codex as "Codex Runtime"
    participant Adapter as "Codex Adapter"
    participant Core as "Unified Memory Core"

    User->>Codex: Start coding task
    Codex->>Adapter: Resolve project + code namespace
    Adapter->>Core: Load stable code memory exports
    Core-->>Adapter: Rules / facts / lessons / project constraints
    Adapter-->>Codex: Codex-specific memory projection
    Codex->>Codex: Plan and execute task
    Codex->>Adapter: Emit write-back events
    Adapter->>Core: Submit source events / candidates
```

## Where Memory Search Fits

`memory search` is important, but it is no longer the top-level architecture story.

Its role is now:

- one workstream inside the OpenClaw adapter
- one consumption-layer concern
- one area of governance and regression inside `unified-memory-core`

It does not define the whole shared-memory product.

## Governance And Testing Position

```mermaid
flowchart LR
    A["Source correctness"] --> E["Regression surfaces"]
    B["Candidate correctness"] --> E
    C["Registry correctness"] --> E
    D["Projection correctness"] --> E
    E --> F["OpenClaw adapter checks"]
    E --> G["Codex adapter checks"]

    H["Audit / repair / replay"] -. improves .-> A
    H -. improves .-> B
    H -. improves .-> C
    H -. improves .-> D

    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class A,B,C,D,E,F,G core;
    class H ops;
```

## Repo Direction

The latest repo direction is:

- preserve the prior adapter-bootstrap shape through the branch `unified-memory-core-bootstrap`
- use `main` to move the system toward the official `Unified Memory Core` product shape
- keep product docs, module docs, and adapter docs aligned before deep implementation

## Document Map

- product index:
  [unified-memory-core.md](unified-memory-core.md)
- product architecture:
  [unified-memory-core-architecture.md](unified-memory-core-architecture.md)
- product roadmap:
  [unified-memory-core-roadmap.md](unified-memory-core-roadmap.md)
- OpenClaw code-memory binding:
  [code-memory-binding-architecture.md](code-memory-binding-architecture.md)
- self-learning workstream:
  [self-learning-architecture.md](self-learning-architecture.md)
- memory-search workstream:
  [reports/memory-search-architecture.md](reports/memory-search-architecture.md)

## 中文

## 文档目的

这是当前仓库的顶层系统架构文档。

它描述的是最新的正式架构：

- `Unified Memory Core` 是产品级共享记忆底座
- `unified-memory-core` 是面向 OpenClaw 的 adapter 和消费层
- `Codex Adapter` 从第一天就是一等集成目标
- `memory search` 现在只是更大体系中的一个 workstream

这份文档主要回答：

- 现在整体系统到底是什么
- 哪些边界已经稳定
- 数据如何从 source 流到不同工具
- 当前仓库如何围绕产品 core 与 adapters 组织
- governance 和 testing 放在什么位置

相关文档：

- [README.md](README.md)
- [project-roadmap.md](project-roadmap.md)
- [unified-memory-core.md](unified-memory-core.md)
- [unified-memory-core-architecture.md](unified-memory-core-architecture.md)
- [self-learning-architecture.md](self-learning-architecture.md)
- [reports/memory-search-architecture.md](reports/memory-search-architecture.md)

## 一图看懂

```mermaid
flowchart TB
    subgraph CORE["Unified Memory Core"]
        S["Source System"]
        R["Reflection System"]
        M["Memory Registry"]
        P["Projection System"]
        G["Governance System"]

        S --> R --> M --> P
        G -. audit / repair / replay .-> S
        G -. audit / repair / replay .-> R
        G -. audit / repair / replay .-> M
        G -. audit / repair / replay .-> P
    end

    subgraph ADAPTERS["Adapters"]
        OA["OpenClaw Adapter\nunified-memory-core"]
        CA["Codex Adapter"]
        TA["Other Tool Adapters"]
    end

    P --> OA
    P --> CA
    P --> TA

    OA --> O1["OpenClaw retrieval / context assembly"]
    CA --> C1["Codex prompt / task / code workflow"]
    TA --> T1["CLI / agents / services / apps"]

    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef adapter fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class S,R,M,P core;
    class OA,CA,TA,O1,C1,T1 adapter;
    class G ops;
```

## 正式定位

当前正式架构可以概括成：

1. `Unified Memory Core` 是共享记忆产品
2. `unified-memory-core` 不再代表整个产品本体
3. `unified-memory-core` 负责 OpenClaw adapter 与 OpenClaw 专属消费层
4. `Codex Adapter` 是第一天就存在的一等架构目标
5. 产品逻辑和工具专属逻辑通过 adapter 分开

## 系统目标

整个体系的目标是把三件事做好：

1. 从可控 source 中构建受治理的记忆
2. 保持高可追踪、可修复、可回放能力
3. 在不把 core 绑死给单一工具的前提下，把稳定记忆投影给不同工具

## 从输入到输出的主链

```mermaid
flowchart LR
    A["可控 source\nconversation / file / URL / dir / image / CLI"] --> B["Source adapters"]
    B --> C["Normalization + fingerprinting"]
    C --> D["Reflection + extraction"]
    D --> E["Candidate artifacts"]
    E --> F["Promotion / decay / conflict handling"]
    F --> G["Stable memory registry"]
    G --> H["Projection / export adapters"]
    H --> I["OpenClaw / Codex / future tools"]

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

## 稳定边界

### 1. Product boundary

`Unified Memory Core` 负责：

- source ingestion
- candidate generation
- artifact lifecycle
- decision trail
- exports
- governance controls

### 2. OpenClaw boundary

`unified-memory-core` 负责：

- OpenClaw 专属 retrieval policy
- OpenClaw 专属 context assembly
- OpenClaw 面向的 export consumption
- 通过 OpenClaw adapter 与 OpenClaw host 行为集成

### 3. Codex boundary

`Codex Adapter` 负责：

- 面向 Codex 的 code memory projection
- Codex 专属任务提示消费
- Codex write-back event 映射

## 模块栈

```mermaid
flowchart TB
    subgraph M1["1. Source System"]
        A1["Conversation Adapter"]
        A2["File Adapter"]
        A3["URL Adapter"]
        A4["Directory Adapter"]
        A5["Image Adapter"]
        A6["Manual CLI Input"]
    end

    subgraph M2["2. Reflection System"]
        B1["Event Labeling"]
        B2["Pattern Extraction"]
        B3["Fact / Rule / Habit Candidates"]
        B4["Evidence Scoring"]
    end

    subgraph M3["3. Memory Registry"]
        C1["Source Artifacts"]
        C2["Candidate Artifacts"]
        C3["Stable Artifacts"]
        C4["Decision Trail"]
        C5["Conflict / Superseded Records"]
    end

    subgraph M4["4. Projection System"]
        D1["OpenClaw Export"]
        D2["Codex Export"]
        D3["Generic Export Artifacts"]
        D4["Policy Projection"]
    end

    subgraph M5["5. Governance System"]
        E1["Audit"]
        E2["Repair"]
        E3["Replay"]
        E4["Diff / History"]
        E5["Regression Surfaces"]
    end

    subgraph M6["6. Adapters"]
        F1["OpenClaw Adapter"]
        F2["Codex Adapter"]
        F3["Other Tool Adapters"]
    end

    M1 --> M2 --> M3 --> M4 --> M6
    M5 -. governs .-> M1
    M5 -. governs .-> M2
    M5 -. governs .-> M3
    M5 -. governs .-> M4

    classDef source fill:#f7f1e3,stroke:#b58105,color:#4a3a00,stroke-width:1.6px;
    classDef reflect fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    classDef memory fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef proj fill:#f3e8ff,stroke:#7c3aed,color:#4c1d95,stroke-width:1.6px;
    classDef govern fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    classDef adapter fill:#dbeafe,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class A1,A2,A3,A4,A5,A6 source;
    class B1,B2,B3,B4 reflect;
    class C1,C2,C3,C4,C5 memory;
    class D1,D2,D3,D4 proj;
    class E1,E2,E3,E4,E5 govern;
    class F1,F2,F3 adapter;
```

## OpenClaw 流程

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Host as "OpenClaw Host"
    participant Adapter as "unified-memory-core"
    participant Core as "Unified Memory Core"
    participant Search as "builtin memory_search"

    User->>Host: 发起问题
    Host->>Adapter: 请求组装上下文
    Adapter->>Core: 加载相关稳定记忆导出
    Adapter->>Adapter: 分类 intent 并决定 retrieval mode

    alt Fact-first / formal-first path
        Adapter->>Adapter: 优先使用导出的稳定事实与规则
    else Mixed / search-first path
        Adapter->>Search: 查询 builtin memory_search
        Search-->>Adapter: 返回宿主 raw hits
        Adapter->>Adapter: 将宿主 hits 与 core exports 合并
    end

    Adapter->>Adapter: 打分、去重、组装最终上下文
    Adapter-->>Host: 返回 context package
    Host-->>User: 最终回答
```

## Codex 流程

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Codex as "Codex Runtime"
    participant Adapter as "Codex Adapter"
    participant Core as "Unified Memory Core"

    User->>Codex: 发起 coding task
    Codex->>Adapter: 解析 project + code namespace
    Adapter->>Core: 加载稳定 code memory exports
    Core-->>Adapter: 规则 / 事实 / 经验 / 项目约束
    Adapter-->>Codex: 转成 Codex 专属 memory projection
    Codex->>Codex: 计划并执行任务
    Codex->>Adapter: 发出 write-back events
    Adapter->>Core: 提交 source events / candidates
```

## Memory Search 在哪里

`memory search` 很重要，但它已经不是顶层架构故事本身。

它现在的位置是：

- OpenClaw adapter 内部的一条 workstream
- consumption layer 的一个重点问题
- `unified-memory-core` 内部的一条治理与回归线

它不再定义整个共享记忆产品。

## Governance 与 Testing 在哪里

```mermaid
flowchart LR
    A["Source correctness"] --> E["Regression surfaces"]
    B["Candidate correctness"] --> E
    C["Registry correctness"] --> E
    D["Projection correctness"] --> E
    E --> F["OpenClaw adapter checks"]
    E --> G["Codex adapter checks"]

    H["Audit / repair / replay"] -. improves .-> A
    H -. improves .-> B
    H -. improves .-> C
    H -. improves .-> D

    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class A,B,C,D,E,F,G core;
    class H ops;
```

## 仓库方向

当前最新的仓库方向是：

- 用 `unified-memory-core-bootstrap` 保留旧的 adapter-bootstrap 形态
- 用 `main` 按正式 `Unified Memory Core` 产品方向继续推进
- 在深度实现前，优先把产品文档、模块文档和 adapter 文档对齐

## 文档地图

- 产品索引：
  [unified-memory-core.md](unified-memory-core.md)
- 产品架构：
  [unified-memory-core-architecture.md](unified-memory-core-architecture.md)
- 产品 roadmap：
  [unified-memory-core-roadmap.md](unified-memory-core-roadmap.md)
- OpenClaw code-memory 绑定：
  [code-memory-binding-architecture.md](code-memory-binding-architecture.md)
- self-learning workstream：
  [self-learning-architecture.md](self-learning-architecture.md)
- memory-search workstream：
  [reports/memory-search-architecture.md](reports/memory-search-architecture.md)
