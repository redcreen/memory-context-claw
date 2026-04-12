# Code Memory Binding Architecture

[English](code-memory-binding-architecture.md) | [中文](code-memory-binding-architecture.zh-CN.md)

## Purpose

This document focuses on one specific architecture question:

`how should OpenClaw code agent, Codex, and future coding tools share the same code memory safely?`

The goal is not to merge all tools into one runtime.

The goal is to let multiple tools read and write the same governed `code memory namespace` through a shared memory core.

## Core Idea

The binding target is not:

- one process
- one prompt
- one session

The binding target is:

- the same `user identity`
- the same `project identity`
- the same `code memory namespace`
- the same `record / export protocol`

## One Diagram

```mermaid
flowchart TB
    U["User Identity"]
    P["Project Identity"]
    N["Code Memory Namespace"]

    U --> N
    P --> N

    O["OpenClaw Code Agent Adapter"] <--> N
    C["Codex Adapter"] <--> N
    L["Claude / Other Coding Adapter"] <--> N

    classDef id fill:#f7f1e3,stroke:#b58105,color:#4a3a00,stroke-width:1.6px;
    classDef mem fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef tool fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class U,P id;
    class N mem;
    class O,C,L tool;
```

## What Should Be Shared

The shared code memory should mostly contain stable engineering signals such as:

- project rules
- coding constraints
- repo-specific conventions
- stable implementation preferences
- recurring testing expectations
- recurring deployment expectations
- stable engineering lessons learned

Examples:

- `do not hardcode`
- `update docs when adding new functionality`
- `new functionality must include tests`
- `runtime changes require test + local deploy`
- `manual file edits must use apply_patch`

## What Should Not Be Shared Directly

These should not be shared as stable code memory by default:

- raw scratchpad thinking
- temporary frustration or emotion
- tool-private hidden reasoning
- one-off speculation
- unreviewed session notes

## Memory Layering

```mermaid
flowchart LR
    A["Raw tool events"] --> B["Candidate code memory"]
    B --> C["Stable code memory"]
    C --> D["Tool-specific projection"]

    classDef raw fill:#f7f1e3,stroke:#b58105,color:#4a3a00,stroke-width:1.6px;
    classDef mem fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef out fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class A raw;
    class B,C mem;
    class D out;
```

## Binding Dimensions

The binding should happen across four dimensions:

1. `user`
2. `workspace / project`
3. `namespace`
4. `visibility / permissions`

## Binding Model

```mermaid
flowchart TB
    subgraph IDENT["Identity Layer"]
        U["user_id"]
        W["workspace_id"]
        P["project_id"]
    end

    subgraph NS["Namespace Layer"]
        G["user/global"]
        C["user/code"]
        PC["project/<repo>/code"]
        PD["project/<repo>/docs"]
        PR["project/<repo>/rules"]
    end

    subgraph TOOL["Tool Layer"]
        O["OpenClaw code agent"]
        X["Codex"]
        Y["Claude / others"]
    end

    U --> G
    U --> C
    P --> PC
    P --> PD
    P --> PR

    O <--> PC
    X <--> PC
    Y <--> PC

    O <--> PR
    X <--> PR
    Y <--> PR

    classDef ident fill:#f7f1e3,stroke:#b58105,color:#4a3a00,stroke-width:1.6px;
    classDef ns fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef tool fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class U,W,P ident;
    class G,C,PC,PD,PR ns;
    class O,X,Y tool;
```

## Recommended Shared Namespace

For coding collaboration, the most important shared namespace is:

`project/<repo>/code`

This allows:

- OpenClaw code agent to write coding rules and stable implementation lessons
- Codex to read and reinforce those same rules
- future tools to consume the same stable engineering memory

## Read / Write Flow

```mermaid
sequenceDiagram
    autonumber
    participant Tool as "Coding Tool"
    participant Adapter as "Tool Adapter"
    participant Core as "Unified Memory Core"
    participant NS as "project/<repo>/code"

    Tool->>Adapter: Task / code interaction / user instruction
    Adapter->>Adapter: Extract memory-relevant signals
    Adapter->>Core: Submit source events
    Core->>Core: Build candidates
    Core->>NS: Promote stable code memory when validated

    Tool->>Adapter: Start next coding task
    Adapter->>NS: Query relevant code memory
    NS-->>Adapter: Stable rules / facts / lessons
    Adapter-->>Tool: Tool-specific projection
```

## Adapter Responsibilities

### OpenClaw Code Agent Adapter

Should:

- extract coding-related rules from OpenClaw sessions
- write candidate events into the shared memory core
- read project code memory before task execution
- consume memory as OpenClaw-specific context hints

### Codex Adapter

Should:

- extract coding-related constraints from Codex work
- write candidate events into the shared memory core
- read project code memory before planning / editing
- consume memory as Codex-specific task guidance

### Future Claude Adapter

Should:

- use the same protocol
- respect the same namespace and permission model
- project outputs in a Claude-appropriate way

## Conflict Handling

If tools produce different conclusions, the system should not overwrite silently.

```mermaid
flowchart LR
    A["Tool A says rule X"] --> C["Candidate pool"]
    B["Tool B says rule Y"] --> C
    C --> D{"Conflict?"}
    D -->|No| E["Promote"]
    D -->|Yes| F["Conflict record"]
    F --> G["Review / repair / supersede"]

    classDef input fill:#f7f1e3,stroke:#b58105,color:#4a3a00,stroke-width:1.6px;
    classDef mem fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class A,B input;
    class C,E mem;
    class D,F,G ops;
```

## Visibility and Safety

Not every memory item should be visible to every tool.

Recommended controls:

- `source_tool`
- `project_scope`
- `namespace`
- `visibility_scope`
- `confidence`
- `promotion_status`

This allows:

- shared code memory where appropriate
- isolated tool-local memory where necessary

## Minimal Record Shape

```json
{
  "id": "code-rule-001",
  "userId": "user-redcreen",
  "projectId": "unified-memory-core",
  "namespace": "project/unified-memory-core/code",
  "sourceTool": "codex",
  "type": "stable_rule",
  "statement": "Do not hardcode implementation details.",
  "confidence": 0.96,
  "status": "stable",
  "visibility": "shared-code-tools"
}
```

## Recommended Rollout Order

```mermaid
flowchart LR
    A["1. Define shared code memory record"] --> B["2. Define project code namespace"]
    B --> C["3. Connect OpenClaw adapter"]
    C --> D["4. Connect Codex adapter"]
    D --> E["5. Connect Claude / other adapters"]

    classDef phase fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class A,B,C,D,E phase;
```

## Decision Summary

Yes, this architecture can let:

- OpenClaw code agent
- Codex
- Claude
- future coding tools

share the same stable coding memory.

But the sharing should be implemented as:

`shared code memory namespace through a governed memory core`

not:

`all tools dumping raw context into one flat storage pool`
