# System Architecture

[English](architecture.md) | [中文](architecture.zh-CN.md)

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

- [../../../README.md](../../../README.md)
- [../../roadmap.md](../../roadmap.md)
- [../../reference/unified-memory-core/deployment-topology.md](../../reference/unified-memory-core/deployment-topology.md)
- [../../reference/code-memory-binding-architecture.md](../../reference/code-memory-binding-architecture.md)
- [../self-learning/architecture.md](../self-learning/architecture.md)
- [../memory-search/architecture.md](../memory-search/architecture.md)

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

## Deployment Position

The current architecture should support:

- one OpenClaw with multiple agents
- multiple OpenClaw runtimes
- multiple Codex runtimes
- multiple Claude or future tool runtimes

Current implementation target:

- support local and shared-workspace modes first
- keep contracts ready for later shared-service and runtime-API phases

See:

- [../../reference/unified-memory-core/deployment-topology.md](../../reference/unified-memory-core/deployment-topology.md)

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
  [../../roadmap.md](../../roadmap.md)
- top-level architecture wrapper:
  [../../architecture.md](../../architecture.md)
- deployment topology:
  [../../reference/unified-memory-core/deployment-topology.md](../../reference/unified-memory-core/deployment-topology.md)
- OpenClaw code-memory binding:
  [../../reference/code-memory-binding-architecture.md](../../reference/code-memory-binding-architecture.md)
- self-learning workstream:
  [../self-learning/architecture.md](../self-learning/architecture.md)
- memory-search workstream:
  [../memory-search/architecture.md](../memory-search/architecture.md)
