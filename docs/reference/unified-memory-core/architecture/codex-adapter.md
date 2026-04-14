# Codex Adapter Architecture

[English](codex-adapter.md) | [中文](codex-adapter.zh-CN.md)

## Purpose

`Codex Adapter` lets Codex consume and contribute governed shared memory through `Unified Memory Core`.

Its main target is:

`shared code memory with explicit project / user / namespace binding`

Related documents:

- [../deployment-topology.md](../deployment-topology.md)
- [../../code-memory-binding-architecture.md](../../code-memory-binding-architecture.md)

## What It Owns

- code-memory namespace binding
- Codex-facing export projection rules
- Codex read-before-task flow
- Codex write-back event mapping
- multi-runtime-safe code-memory binding rules

## What It Does Not Own

- shared artifact truth
- source ingestion
- OpenClaw-specific behavior

## Core Responsibilities

1. map user + project + namespace
2. load shared code memory before coding tasks
3. write back governed events after coding tasks
4. emit governed accepted-action evidence from `writeAfterTask(...)` when structured task-result metadata is present
5. emit real-time governed conversation-rule intake from `writeAfterTask(...)` when the main reply includes structured `memory_extraction`
6. stay compatible with standalone and embedded execution paths
7. keep the adapter usable across one-host and future multi-host deployments

## Core Flow

```mermaid
sequenceDiagram
    autonumber
    participant Codex
    participant Adapter as Codex Adapter
    participant Core as Unified Memory Core

    Codex->>Adapter: start coding task
    Adapter->>Core: resolve namespace + load exports
    Core-->>Adapter: code memory exports
    Adapter-->>Codex: task-facing memory package
    Codex->>Adapter: task result / write-back event
    Adapter->>Core: governed write-back + optional accepted-action intake

## Accepted-Action Hook Boundary

The Codex adapter now has one explicit write-side learning seam:

- `writeAfterTask(...)` can still emit the legacy governed manual write-back event
- the same call can also emit structured `accepted_action` evidence when task-result metadata includes explicit accepted-action fields
- promotion remains governed by reflection and lifecycle rules, not by adapter-local hardcoding
```

## Reply + Memory-Extraction Boundary

The Codex adapter now also exposes a lighter write-side learning seam:

- the same main-model turn can return hidden `memory_extraction` beside `user_visible_reply`
- `writeAfterTask(...)` immediately emits governed source ingest when `should_write_memory=true` instead of waiting for nightly self-learning backfill
- the current implementation formalizes this signal as a governed `memory_intent` source type while preserving category, durability, confidence, admission_route, and `structured_rule`
- this path fills the real-time gap for explicit conversation rules; it does not replace `accepted_action`

See:

- [realtime-memory-intent-ingestion.md](realtime-memory-intent-ingestion.md)

## Runtime Modes

The adapter should support:

1. `single-runtime local mode`
2. `multi-runtime shared-workspace mode`

It should be prepared for:

3. `shared-registry multi-host mode`

```mermaid
flowchart LR
    A["Codex Runtime A"] --> C["Codex Adapter"]
    B["Codex Runtime B"] --> C
    C --> D["Local Exports / Shared Workspace"]
    D --> E["Unified Memory Core Artifacts"]

    F["Future Shared Registry Service"] -. later .-> C

    classDef adapter fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    class A,B,C adapter;
    class D,E,F core;
```

## Network-Ready Boundaries

The adapter should not assume:

- Codex is the only consumer
- one project maps to one active runtime
- write-back is always single-threaded

So the binding layer must preserve:

- stable project / workspace / user mapping
- namespace-scoped export reads
- explicit write-back event schemas
- serialized governed writes by namespace

## Cross-Tool Sharing Notes

The adapter should be able to share one code-memory namespace with:

- OpenClaw code agents
- future Claude adapters
- standalone CLI jobs

without directly coupling runtime internals across tools.

## Required Boundaries

The adapter must keep separate:

- Codex task runtime
- shared memory contracts
- write-back governance rules

## Initial Build Boundary

The first implementation wave should support:

1. code-memory namespace model
2. read-before-task contract
3. write-after-task event contract
4. adapter compatibility tests
5. multi-runtime-safe write-back rules in local-first mode

## Done Definition

This module is ready for implementation when:

- code memory binding is explicit
- read/write contract is explicit
- project/user binding rules are explicit
- adapter test surfaces are defined
- cross-tool and future networked deployment boundaries are explicit
