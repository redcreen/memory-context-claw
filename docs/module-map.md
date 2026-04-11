# Module Map

[English](module-map.md) | [中文](module-map.zh-CN.md)

## Purpose

This document is the durable module-level map for the repo.

It answers:

- what the major modules are
- which files belong to each module
- which official first-class modules are active vs maintain-only
- where to look first when resuming work

Use this together with:

- current execution state: [.codex/status.md](../.codex/status.md)
- execution order: [.codex/plan.md](../.codex/plan.md)
- top-level architecture: [system-architecture.md](../system-architecture.md)

## Module Overview

| Module | Responsibility | Main Paths | Status |
| --- | --- | --- | --- |
| Source System | controlled source ingestion, normalization, and replayable source artifacts | `src/unified-memory-core/source-system.js`, `test/unified-memory-core/source-system.test.js` | baseline-complete |
| Reflection System | candidate generation, daily reflection, and reflection outputs | `src/unified-memory-core/reflection-system.js`, `src/unified-memory-core/daily-reflection.js`, related `test/unified-memory-core/` files | baseline-complete / next-phase candidate |
| Memory Registry | source / candidate / stable artifacts and decision trail | `src/unified-memory-core/memory-registry.js`, `test/unified-memory-core/memory-registry.test.js` | baseline-complete |
| Projection System | export shaping, visibility filtering, and consumer projections | `src/unified-memory-core/projection-system.js`, `test/unified-memory-core/projection-system.test.js` | baseline-complete |
| Governance System | audit / repair / replay / governance cycle / promotion support | `src/unified-memory-core/governance-system.js`, `src/*audit*.js`, `scripts/run-governance-cycle.js`, related tests | governing |
| OpenClaw Adapter | OpenClaw-facing retrieval / assembly / scoring / runtime integration | `src/openclaw-adapter.js`, `src/assembly.js`, `src/retrieval*.js`, `src/scoring.js`, related tests | active |
| Codex Adapter | Codex-facing adapter integration and compatibility path | `src/codex-adapter.js`, `test/codex-adapter.test.js`, `test/adapter-compatibility.test.js` | baseline-complete / maintain |

## Resume Order

When resuming, read in this order:

1. [.codex/status.md](../.codex/status.md)
2. [.codex/module-dashboard.md](../.codex/module-dashboard.md)
3. the active module file under [.codex/modules/](../.codex/modules/)
4. this file
5. only then the deeper roadmap / reports

## Current Active Modules

1. **OpenClaw Adapter**
   Current focus: expand stable facts / stable rules while keeping recalled context clean.
2. **Governance System**
   Current focus: keep governance signals readable and use `eval:smoke-promotion` conservatively.
3. **Reflection System**
   Current focus: define the next enhancement phase beyond the current baseline.

## Terminology Boundary

- `core-product` is the product umbrella over `Source System`, `Reflection System`, `Memory Registry`, `Projection System`, and `Governance System`.
- `plugin-runtime` refers to the active OpenClaw-facing runtime path, centered on `OpenClaw Adapter`.
- `self-learning` is not a synonym for `core-product`; it is the most likely next enhancement direction inside the product umbrella.
