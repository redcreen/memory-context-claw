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
- top-level architecture wrapper: [architecture.md](architecture.md)

## Module Overview

| Module | Responsibility | Main Paths | Status |
| --- | --- | --- | --- |
| Source System | controlled source ingestion, normalization, and replayable source artifacts | `src/unified-memory-core/source-system.js`, `test/unified-memory-core/source-system.test.js` | baseline-complete |
| Reflection System | candidate generation, daily reflection, lifecycle review inputs, and reflection outputs | `src/unified-memory-core/reflection-system.js`, `src/unified-memory-core/daily-reflection.js`, related `test/unified-memory-core/` files | stage4 contract-mapped / stable |
| Memory Registry | source / candidate / stable artifacts, lifecycle transitions, and decision trail | `src/unified-memory-core/memory-registry.js`, `test/unified-memory-core/memory-registry.test.js` | lifecycle + policy export compatible |
| Projection System | export shaping, visibility filtering, learning metadata, and consumer policy projections | `src/unified-memory-core/projection-system.js`, `src/unified-memory-core/policy-adaptation.js`, `test/unified-memory-core/projection-system.test.js` | stage4-complete / stable |
| Governance System | audit / repair / replay / governance cycle / lifecycle + policy reporting | `src/unified-memory-core/governance-system.js`, `src/*audit*.js`, `scripts/run-governance-cycle.js`, related tests | governing / stage4-complete |
| OpenClaw Adapter | OpenClaw-facing retrieval / assembly / scoring / runtime integration | `src/openclaw-adapter.js`, `src/assembly.js`, `src/retrieval*.js`, `src/scoring.js`, related tests | stage4-complete / stable |
| Codex Adapter | Codex-facing adapter integration and compatibility path | `src/codex-adapter.js`, `test/codex-adapter.test.js`, `test/adapter-compatibility.test.js` | stage4-complete / stable |

## Resume Order

When resuming, read in this order:

1. [.codex/status.md](../.codex/status.md)
2. [.codex/module-dashboard.md](../.codex/module-dashboard.md)
3. the active module file under [.codex/modules/](../.codex/modules/)
4. this file
5. only then the deeper roadmap / reports

## Current Active Modules

1. **Source System**
   Current focus: open `Step 39` source-adapter hardening.
2. **Governance System**
   Current focus: keep Stage 4 policy evidence stable while Stage 5 opens.
3. **Projection System**
   Current focus: carry policy-export reproducibility into Stage 5 without changing the contract boundary.

## Terminology Boundary

- `core-product` is the product umbrella over `Source System`, `Reflection System`, `Memory Registry`, `Projection System`, and `Governance System`.
- `plugin-runtime` refers to the active OpenClaw-facing runtime path, centered on `OpenClaw Adapter`.
- `self-learning` is not a synonym for `core-product`; it is the most likely next enhancement direction inside the product umbrella.
