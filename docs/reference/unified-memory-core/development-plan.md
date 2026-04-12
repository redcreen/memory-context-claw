# Unified Memory Core Development Plan

[English](development-plan.md) | [中文](development-plan.zh-CN.md)

## Purpose

This document is the execution queue for `Unified Memory Core`.

It should answer one practical question clearly:

`what do we build next, in what exact order, and where should work resume today?`

Related documents:

- [../../roadmap.md](../../roadmap.md)
- [../../architecture.md](../../architecture.md)
- [deployment-topology.md](deployment-topology.md)
- [architecture/README.md](architecture/README.md)
- [roadmaps/README.md](roadmaps/README.md)
- [blueprints/README.md](blueprints/README.md)
- [testing/README.md](testing/README.md)

## Final Target

`Unified Memory Core` should become:

- a governed shared-memory foundation
- a reusable product core for OpenClaw, Codex, and future tools
- a multi-adapter system with explicit namespaces, visibility rules, and repairable artifacts
- a product that can run in embedded mode and standalone mode

## How To Use This Plan

Read this document as one ordered build queue.

Rules:

1. finish the current stage before starting the next stage
2. execute steps in numeric order
3. if a step is marked `completed`, do not reopen it unless a bug forces it
4. if a step is marked `next`, that is the exact place to resume work
5. anything outside the current stage stays deferred

## Current Position

Current status:

- `Stage 1`: completed
- `Stage 2`: completed
- current pointer: `Step 21`
- current recommendation: resume from `Stage 3`

Already implemented in the current baseline:

- shared contracts
- `Source System` MVP
- `Memory Registry` MVP
- local `source -> candidate` pipeline
- `Projection System` MVP
- `Governance System` MVP
- OpenClaw adapter runtime integration
- Codex adapter runtime integration
- reflection / daily learning baseline
- standalone runtime / CLI baseline
- audit / repair / replay / export inspect baseline
- independent execution review baseline

Execution constraints that still apply:

- keep the implementation `local-first`
- keep the implementation `network-ready`, not `network-required`
- do not jump ahead of the current step pointer

## Stage Map

| Stage | Step Range | Goal | Status |
| --- | --- | --- | --- |
| Stage 1 | `1-10` | freeze product shape and documentation baseline | `completed` |
| Stage 2 | `11-20` | complete the first local-first implementation baseline | `completed` |
| Stage 3 | `21-30` | complete the self-learning lifecycle baseline | `next` |
| Stage 4 | `31-38` | connect governed learning outputs into adapter policy use | `later` |
| Stage 5 | `39-46` | harden product operations and split-ready execution | `later` |

## Sequential Build Plan

### Stage 1. Design And Documentation Baseline

Stage complete when:

- product shape is explicit
- documents are aligned
- testing surfaces are defined

1. `completed` Freeze product naming, boundary, and repo direction.
2. `completed` Align top-level architecture and master roadmap.
3. `completed` Define first-class module boundaries.
4. `completed` Complete module architecture documents.
5. `completed` Complete module roadmaps, blueprints, and todo pages.
6. `completed` Define testing surfaces and case matrix.
7. `completed` Define deployment topology and multi-runtime model.
8. `completed` Define shared contracts for artifacts, namespace, visibility, and exports.
9. `completed` Define OpenClaw and Codex adapter boundaries.
10. `completed` Define self-learning, standalone mode, and independent-execution boundaries.

### Stage 2. Local-First Implementation Baseline

Stage complete when:

- one local-first product loop works end to end
- adapters consume governed exports
- standalone mode is usable

11. `completed` Implement shared contracts and contract tests.
12. `completed` Implement `Source System` MVP.
13. `completed` Implement `Memory Registry` MVP.
14. `completed` Implement the local `source -> candidate` pipeline and registry tests.
15. `completed` Implement `Projection System` MVP.
16. `completed` Implement `Governance System` MVP with audit / repair / replay primitives.
17. `completed` Implement OpenClaw adapter runtime integration.
18. `completed` Implement Codex adapter runtime integration.
19. `completed` Implement `Reflection System` MVP and the daily reflection baseline.
20. `completed` Implement standalone CLI, export / audit / repair / replay surfaces, and independent-execution review.

### Stage 3. Self-Learning Lifecycle Baseline

Stage complete when:

- observation candidates can move through a governed lifecycle
- promotion and decay are explicit
- learning-specific governance is testable

21. `next` Implement promotion rules for learning candidates.
22. `later` Implement decay and expiry rules for weak or stale signals.
23. `later` Implement conflict detection and conflict reporting for learned artifacts.
24. `later` Implement stable registry update rules for promoted learning artifacts.
25. `later` Add learning-specific audit reports.
26. `later` Add learning-specific replay and repair paths.
27. `later` Add time-window comparison reports for learning outcomes.
28. `later` Add regression coverage for the learning lifecycle.
29. `later` Validate OpenClaw consumption of promoted learning artifacts.
30. `later` Close the stage with one governed `observation -> stable` loop running locally end to end.

### Stage 4. Policy Adaptation And Multi-Consumer Use

Stage complete when:

- governed learning outputs can influence consumer behavior explicitly
- adapter-side policy use stays reversible and testable

31. `later` Define the `policy-input artifact` contract.
32. `later` Implement policy-input projections from promoted learning artifacts.
33. `later` Adapt OpenClaw retrieval / assembly behavior from governed learning signals.
34. `later` Adapt Codex task-side consumption from governed learning signals.
35. `later` Add policy adaptation tests and rollback protections.
36. `later` Add consumer-specific export compatibility reports.
37. `later` Validate namespace and visibility behavior across adapters for learned artifacts.
38. `later` Close the stage with one reproducible policy-adaptation loop.

### Stage 5. Product Hardening And Independent Operation

Stage complete when:

- the product is operationally maintainable
- split-ready execution is validated
- future service mode can be discussed from a stable base

39. `later` Harden standalone source adapters for file / directory / URL / image inputs.
40. `later` Add scheduled-job-friendly workflows for reflection and governance runs.
41. `later` Add self-learning maintenance workflow docs and CLI support.
42. `later` Add release-boundary validation checks.
43. `later` Add migration and repo-split rehearsal.
44. `later` Add reproducibility and rollback checks for learning exports.
45. `later` Review prerequisites for runtime API or network service mode.
46. `later` Close the stage with an independent-product readiness review.

## Current Next Build

Resume exactly from here:

1. start at `Step 21`
2. finish `Stage 3` completely before touching `Stage 4`
3. treat `Stage 4-5` as locked until `Stage 3` closes

Do not start with:

- runtime API
- multi-host network service
- advanced network-required architecture
- repo split execution work beyond what is already documented

## Review Checklist

Review this document with these questions:

1. Is the current pointer obvious enough?
2. Is every stage closed before the next one starts?
3. Is any step still too large and worth splitting again?
4. Is anything listed too early?
5. Can a maintainer resume from the step number alone?
