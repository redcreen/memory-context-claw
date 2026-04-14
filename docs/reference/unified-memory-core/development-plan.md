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
- `Stage 3`: completed
- `Stage 4`: completed
- `Stage 5`: completed
- current pointer: `Stage 5 closeout`
- current recommendation: keep release-preflight, deployment verification, and Stage 5 evidence stable before opening any later phase

Already implemented in the current baseline:

- shared contracts
- `Source System` MVP
- structured `accepted_action` source intake
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
| Stage 3 | `21-30` | complete the self-learning lifecycle baseline | `completed` |
| Stage 4 | `31-38` | connect governed learning outputs into adapter policy use | `completed` |
| Stage 5 | `39-46` | harden product operations and split-ready execution | `completed` |

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

21. `completed` Implement promotion rules for learning candidates.
22. `completed` Implement decay and expiry rules for weak or stale signals.
23. `completed` Implement conflict detection and conflict reporting for learned artifacts.
24. `completed` Implement stable registry update rules for promoted learning artifacts.
25. `completed` Add learning-specific audit reports.
26. `completed` Add learning-specific replay and repair paths.
27. `completed` Add time-window comparison reports for learning outcomes.
28. `completed` Add regression coverage for the learning lifecycle.
29. `completed` Validate OpenClaw consumption of promoted learning artifacts.
30. `completed` Close the stage with one governed `observation -> stable` loop running locally end to end.

### Stage 4. Policy Adaptation And Multi-Consumer Use

Stage complete when:

- governed learning outputs can influence consumer behavior explicitly
- adapter-side policy use stays reversible and testable

31. `completed` Define the `policy-input artifact` contract.
32. `completed` Implement policy-input projections from promoted learning artifacts.
33. `completed` Adapt OpenClaw retrieval / assembly behavior from governed learning signals.
34. `completed` Adapt Codex task-side consumption from governed learning signals.
35. `completed` Add policy adaptation tests and rollback protections.
36. `completed` Add consumer-specific export compatibility reports.
37. `completed` Validate namespace and visibility behavior across adapters for learned artifacts.
38. `completed` Close the stage with one reproducible policy-adaptation loop.

### Stage 5. Product Hardening And Independent Operation

Stage complete when:

- the product is operationally maintainable
- split-ready execution is validated
- future service mode can be discussed from a stable base

39. `completed` Harden standalone source adapters for file / directory / URL / image inputs.
40. `completed` Add scheduled-job-friendly workflows for reflection and governance runs.
41. `completed` Add self-learning maintenance workflow docs and CLI support.
42. `completed` Add release-boundary validation checks.
43. `completed` Add migration and repo-split rehearsal.
44. `completed` Add reproducibility and rollback checks for learning exports.
45. `completed` Review prerequisites for runtime API or network service mode.
46. `completed` Close the stage with an independent-product readiness review.

## Current Next Build

Resume exactly from here:

1. hold release-preflight, deployment verification, and `Stage 5` evidence stable
2. do not open runtime API or service-mode work until the documented prerequisites stay green
3. treat registry-root cutover as explicit operator policy work, not hidden phase drift

Do not start with:

- runtime API
- multi-host network service
- advanced network-required architecture
- repo split execution work beyond what is already documented

## Post-Stage-5 Evaluation-Driven Optimization Queue

This queue is the new mainline after Stage 5.

The goal is not to reopen baseline contract work. The goal is to:

- grow the OpenClaw CLI memory evaluation into a `100+` case benchmark
- use `legacy / unified / bootstrap / retrieval` comparisons to explain where answers come from
- use failing cases to drive assembly / retrieval / policy algorithm iterations

53. `completed` Define the `100+` case benchmark design and coverage matrix.
   - It must at least cover: stable facts, ordinary retrieval, current-state overrides, abstention, conflicting facts, repeated updates, multi-turn history, rule extraction, project knowledge, and cross-source attribution.
   - Every case must specify: evaluation entrypoint, expected answer, acceptable variance, capability tags, and whether A/B comparison is required.
54. `completed` Expand the current `20` cases into a reproducible `100+` OpenClaw CLI benchmark.
   - Prefer real `openclaw memory search` / `openclaw agent` entrypoints by default.
   - Avoid claiming success from internal registry state alone.
55. `completed` Add `legacy / unified / bootstrap / retrieval` attribution reports for the benchmark.
   - The point is not just to compare scores, but to explain where answers came from and which capabilities are extension gains.
56. `completed` Turn benchmark failures into an explicit algorithm work queue and prioritize fixes.
   - Prioritize: current-state override failures, stale-value leakage, incorrect abstention, wrong source attribution, and retrieval misses.
57. `completed` Rerun the benchmark after each meaningful algorithm change, update the reports, refresh the control surface, and push the iteration to GitHub.
58. `completed` Decide whether to open runtime API / service-mode work only after the `100+` benchmark and the attribution reports stabilize.
   - The current answer is still no: keep runtime API / service-mode closed until the answer-level path, transport watchlist, and broader benchmark planning are stable.

## Next-stage Planning Queue

59. `completed` Review the current benchmark coverage and plan a broader `200`-case matrix.
   - The goal is coverage breadth, not raw count chasing.
   - Explicitly cover cross-source mixes, conflicting facts, supersede/current-vs-history cases, multi-step history, abstention, and the answer-level host path.
60. `completed` Plan the next benchmark so Chinese cases account for at least `50%`.
   - Chinese coverage should include real Chinese phrasings, current-state questions, rule questions, and mixed Chinese-English prompts.
61. `completed` Bring the live `openclaw agent` answer-level matrix and the raw transport watchlist into the next formal gate.
   - The answer-level red path must stay separate from raw transport instability.
62. `completed` Define a dedicated performance plan for the retrieval / assembly / answer-level main path.
   - At minimum define baseline commands, measurement dimensions, slow-path layers, and performance regression gates.
63. `completed` Capture the first main-path performance baseline and attribute the slowest paths across retrieval, assembly, host answer-level, and transport.
64. `completed` Only schedule the next execution round after both the `200`-case coverage plan and the main-path performance baseline are clear.

## Next Execution Queue

65. `completed` Expand the benchmark from `187` to a coverage-first `200+` cases and fill blind spots instead of padding with rewrites.
   - The runnable matrix is now `368` cases, with `250` retrieval-heavy and `118` answer-level cases.
66. `completed` Turn Chinese coverage into at least `50%` of the real runnable matrix across retrieval, answer-level, and abstention surfaces.
   - The current zh-bearing runnable matrix is `187 / 368 = 50.82%`.
67. `completed` Promote the answer-level host path and the raw transport watchlist into the formal benchmark gate with pass rate, abstention rate, and watchlist reporting.
   - retrieval-heavy gate: `250/250`
   - answer-level formal gate: `6/6` via `openclaw agent --local` with isolated eval agent `umceval65`
   - transport watchlist: `0/8 raw ok`, all classified as host transport invalid-json
68. `completed` Triage and fix the live `openclaw agent` answer-level red path until it no longer systemically returns `I don't know` or times out.
   - Root causes are now separated: gateway/session-lock noise, agent main-session reuse contamination, and CLI `--local` JSON emitted on stderr.
   - The formal gate now uses the isolated local answer path; the gateway path stays on the watchlist instead of polluting algorithm judgments.
69. `completed` Use the main-path performance baseline to optimize the slowest layer, prioritizing host answer-level first, raw transport second, and only then retrieval / assembly if needed.
   - Current main-path baseline: retrieval / assembly avg `85ms`; raw transport avg `15127ms`; isolated local answer-level avg `39281ms` with `3/3` passing.
70. `completed` Rerun the `200+` benchmark, answer-level gate, transport watchlist, and main-path perf baseline, then use that evidence to decide whether later enhancement planning can open.
   - Conclusion: continue benchmark / perf / transport work, but do not misclassify raw transport or gateway noise as retrieval / answer-level algorithm regressions.
71. `done` Establish a formal memory-intent replay regression surface covering durable rules, tool-routing preferences, session constraints, task-only instructions, user-profile facts, and no-memory noise.
72. `done` Add the minimum real-time `reply + memory_extraction` ingest loop to the Codex runtime write-back path so ordinary conversation rules no longer have to wait for nightly self-learning.
73. `done` Promote the `memory_extraction` output schema into a formal product contract instead of keeping it as a local runtime seam only.
   - Add the shared `memory_intent` contract and source type with explicit category, durability, confidence, admission route, and structured rule fields.
74. `done` Define admission routing for `session_constraint`, `task_instruction`, `durable_rule`, and `tool_routing_preference` instead of flattening everything into `manual` source text first.
   - durable rule / tool-routing cases now route into promotable candidates, while session / task-local cases stay in observation and `none` / false-write cases skip ingest.
75. `done` Add richer reflection, dedupe, supersede, negative-path handling, and governance regression coverage for real-time memory-intent ingestion.
   - `memory_intent` now runs through reflection + lifecycle governance with contract/source/reflection/runtime/CLI regression coverage.
76. `done` Bring the replay suite into the formal gate so future prompt or schema drift cannot quietly push explicit rules back into the nightly funnel.
   - `npm run verify:memory-intent` is now the formal gate for this slice.

## Deferred Enhancement Queue

These items are intentionally `todo`, not the current active stage.

They exist so the next enhancement phase can start from a clear queue instead of reconstructing intent from session history.

47. `done` Split `accepted_action` extraction into reusable target facts, operating rules, and one-off outcome artifacts.
   - `accepted_action` source normalization now emits field descriptors for targets, artifact paths, and output references.
   - reflection now expands successful accepted-action events into field-aware `target_fact`, `operating_rule`, and `outcome_artifact` candidates instead of flattening everything into one summary.
   - CLI and lifecycle validation now prove reusable targets can promote independently while one-off outcomes stay in observation state.
   - runtime/task hook coverage now includes Codex `writeAfterTask(...)` and OpenClaw async `after_tool_call` when structured accepted-action payloads are present.
48. `todo` Add accepted-action admission routing across `session`, `daily`, `observation`, and stable-candidate layers.
49. `todo` Add richer accepted-action evidence weighting using acceptance, execution success, later reuse, contradiction, and citation signals together.
50. `todo` Add negative / partial accepted-action handling so rejected or failed actions become audit or observation inputs instead of stable facts.
51. `todo` Add accepted-action-specific dedupe, supersede, and conflict rules plus replay / audit coverage.
52. `todo` Reopen implementation of this queue only after the post-Stage-5 operator baseline stays green long enough to justify a later enhancement slice.

## Review Checklist

Review this document with these questions:

1. Is the current pointer obvious enough?
2. Is every stage closed before the next one starts?
3. Is any step still too large and worth splitting again?
4. Is anything listed too early?
5. Can a maintainer resume from the step number alone?
