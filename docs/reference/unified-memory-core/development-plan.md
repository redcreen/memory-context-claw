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

## Current Product Value Mapping

The execution plan should stay anchored to four product values:

1. `On-demand context loading`
   - already landed: fact-first assembly and Stage 6 runtime shadow instrumentation
   - next work: turn the shadow surface into a harder context-thickness / latency gate
2. `Realtime + nightly self-learning`
   - already landed: realtime `memory_intent` ingestion plus nightly governed learning
   - next work: remove timeout-heavy blind spots so write-time gains survive tighter answer budgets
3. `CLI-governed memory operations`
   - already landed: add / inspect / audit / repair / replay / migrate flows
   - next work: keep those flows readable, replayable, and release-grade while context optimization evolves
4. `Shared memory foundation`
   - already landed: shared contracts, canonical registry root, OpenClaw adapter, and Codex adapter
   - next work: keep the shared-core boundary stable while the OpenClaw-facing context layer becomes more selective

Every next-round step should also preserve six product qualities:

- `simple`
- `usable`
- `lightweight`
- `fast enough`
- `smart`
- `maintainable`

## Product North Star And Execution Meaning

> Simple to install, smooth to use, light and fast to run, smart to remember, easy to maintain.

Translated into execution requirements:

- `simple to install`
  - install, default config, and first verification should keep taking the shortest path
- `smooth to use`
  - default paths come first, instead of turning the next round into a pile of expert-only switches
- `light and fast to run`
  - every new experiment should carry prompt-thickness, latency, and runtime-cost metrics
- `smart to remember`
  - bounded decision contracts, self-learning, working-set pruning, and budgeted assembly should all improve judgment quality together
- `easy to maintain`
  - rollback boundaries, operator metrics, and hermetic / Docker eval entrypoints must be explicit before each promotion step

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
- `Stage 6`: completed
- current pointer: `92`
- current recommendation: run a docs-first review so “per-turn context optimization” becomes the formal recovery point; keep `dialogueWorkingSetShadow` default-off and shadow-only, then move into harder A/B and later experiment design

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

## Next-round Design Constraints

These constraints keep the next per-turn context optimization slice measurable and reversible:

- keep `dialogueWorkingSetShadow` `default-off` and shadow-only until the promotion / rollback gate is explicit
- do not modify builtin memory behavior or treat builtin-memory rewrites as the current mainline
- do not let the long-term design drift into a wider hardcoded rule table; the preferred next direction is a bounded, structured LLM-led context decision contract
- keep LLM tool call count bounded; prefer one structured decision surface over multiple helper calls inside the same turn
- do not start any active-path experiment without operator metrics, a rollback boundary, and hermetic / Docker reproduction coverage

## Stage Map

| Stage | Step Range | Goal | Status |
| --- | --- | --- | --- |
| Stage 1 | `1-10` | freeze product shape and documentation baseline | `completed` |
| Stage 2 | `11-20` | complete the first local-first implementation baseline | `completed` |
| Stage 3 | `21-30` | complete the self-learning lifecycle baseline | `completed` |
| Stage 4 | `31-38` | connect governed learning outputs into adapter policy use | `completed` |
| Stage 5 | `39-46` | harden product operations and split-ready execution | `completed` |
| Stage 6 | `93-100` | validate dialogue working-set pruning in runtime shadow mode before any active prompt cutover | `completed` |

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

### Stage 6. Dialogue Working-Set Shadow Integration

Stage complete when:

- runtime shadow instrumentation exists and stays `default-off`
- the runtime records `relation / evict / pins / reduction ratio` without mutating the final prompt
- real-session shadow telemetry is green enough to decide whether an active-path experiment should even be allowed

Stage 6 evidence:

- runtime replay report: [../../../reports/generated/dialogue-working-set-runtime-shadow-2026-04-16.md](../../../reports/generated/dialogue-working-set-runtime-shadow-2026-04-16.md)
- runtime answer A/B report: [../../../reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16.md](../../../reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16.md)
- runtime shadow summary: [../../../reports/generated/dialogue-working-set-runtime-shadow-summary-2026-04-16.md](../../../reports/generated/dialogue-working-set-runtime-shadow-summary-2026-04-16.md)
- Stage 6 closeout report: [../../../reports/generated/dialogue-working-set-stage6-2026-04-16.md](../../../reports/generated/dialogue-working-set-stage6-2026-04-16.md)

93. `completed` Keep this slice docs-first and review-gated before runtime work.
   - The roadmap, development plan, and architecture references were aligned first so Stage 6 started from a reviewed queue instead of report-only evidence.
94. `completed` Define the Stage 6 runtime shadow contract before implementation.
   - The runtime surface now emits `relation / evict / pins / reduction ratio`, writes replayable export artifacts, and keeps the feature `default-off`.
95. `completed` Implement the minimum runtime shadow instrumentation path.
   - `ContextAssemblyEngine.assemble()` now records runtime shadow decisions on real assembled sessions without mutating the final prompt or builtin memory behavior.
96. `completed` Add real-session shadow reports and replayable exports.
   - Sidecar exports now capture the transcript prefix, decision payload, snapshot, token estimates, and operator-facing summary lines.
97. `completed` Attach answer-level regression measurement to the shadow path.
   - Runtime answer A/B now reuses the real shadow exports instead of isolated helper snapshots only.
98. `completed` Define the active-path promotion gate and rollback boundary.
   - Rollback is configuration-only via `dialogueWorkingSetShadow.enabled=false`, and promotion remains gated behind longer real-session soak plus explicit regression thresholds.
99. `completed` Decide whether to open any active prompt experiment only after the Stage 6 shadow gate stays green.
   - Current decision: do not open active prompt mutation yet; keep the feature shadow-only.
100. `completed` Resume the deferred history cleanup and harder live A/B expansion with Stage 6 telemetry attached.
   - The next execution pointer now returns to the deferred `ab100-zh-history-editor-*` cleanup and the harder A/B expansion, with the new shadow telemetry available as the measurement surface.

## Current Next Build

Resume exactly from here:

1. start from `92`, redesigning the next harder live A/B around `cross-source / conflict / multi-step history / denser natural-Chinese` prompts
2. keep `dialogueWorkingSetShadow` `default-off` and shadow-only while the new telemetry surface soaks
3. use Stage 6 telemetry when expanding the harder live A/B surface and deciding whether any part should later graduate toward a stronger formal gate

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
   - The runnable matrix is now `392` cases, with `262` retrieval-heavy and `130` answer-level cases.
66. `completed` Turn Chinese coverage into at least `50%` of the real runnable matrix across retrieval, answer-level, and abstention surfaces.
   - The current zh-bearing runnable matrix is `211 / 392 = 53.83%`.
67. `completed` Promote the answer-level host path and the raw transport watchlist into the formal benchmark gate with pass rate, abstention rate, and watchlist reporting.
   - retrieval-heavy gate: `250/250`
   - answer-level formal gate: `12/12` via `openclaw agent --local` with isolated eval agent `umceval65`
   - transport watchlist: `3/8 raw ok`; the rest are `4` host transport `missing_json_payload` failures and `1` `empty_results`
68. `completed` Triage and fix the live `openclaw agent` answer-level red path until it no longer systemically returns `I don't know` or times out.
   - Root causes are now separated: gateway/session-lock noise, agent main-session reuse contamination, and CLI `--local` JSON emitted on stderr.
   - The formal gate now uses the isolated local answer path; the gateway path stays on the watchlist instead of polluting algorithm judgments.
69. `completed` Use the main-path performance baseline to optimize the slowest layer, prioritizing host answer-level first, raw transport second, and only then retrieval / assembly if needed.
   - Latest main-path baseline: retrieval / assembly avg `16ms`; raw transport avg `8061ms`; isolated local answer-level avg `11200ms` with `3/3` passing.
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

## Current Execution Queue

77. `completed` Expand the isolated local answer-level formal gate beyond the current `6` representative samples into a larger stable matrix.
   - The repo-default isolated local formal gate now runs `12/12` via `npm run eval:openclaw:agent-matrix`.
   - The current stable `12`-case matrix covers profile, project, preference, rule, temporal current, history, zh, zh-natural, and negative surfaces.
78. `completed` Push Chinese coverage beyond "more than half" into more natural, higher-information real Chinese prompts.
   - The matrix now includes `24` `[zh-natural]` cases (`12` retrieval + `12` answer-level) with a representative retrieval slice of `5/5` and a representative answer-level slice of `6/6`.
79. `completed` Keep gateway/session-lock behavior and raw `openclaw memory search` transport on explicit watchlists.
   - The latest raw transport watchlist is `3/8 raw ok`; the rest are `4` `missing_json_payload` failures and `1` `empty_results`; this watchlist tracks host instability, not retrieval / answer-level algorithm regressions.
80. `completed` Continue optimizing the slowest layer from the main-path performance baseline and rerun the formal gates after each meaningful change.
   - The current priority remains isolated local answer-level first and raw transport second; the latest perf baseline is now retrieval / assembly `16ms`, raw transport `8061ms`, isolated local answer-level `11200ms`.
81. `completed` Turn the larger isolated local answer-level formal gate into a repo-default entry instead of relying on hand-built `--only` commands.
   - `scripts/eval-openclaw-cli-agent-answer-matrix.js` now defaults to isolated eval agent `umceval65`, `--agent-local`, `--skip-legacy`, and a fixed `12`-case formal gate matrix.
82. `completed` Rerun the larger answer-level formal gate and publish a new `2026-04-15` formal report.
   - New formal report: [reports/generated/openclaw-cli-agent-answer-matrix-2026-04-15.md](../../../reports/generated/openclaw-cli-agent-answer-matrix-2026-04-15.md)
   - Latest result: `12 / 12`
83. `completed` Sync the larger answer-level formal gate result back into the roadmap, development plan, and control surface, then reset the next execution pointer.
   - The roadmap, control surface, and development plan no longer describe the answer-level formal gate as just `6/6`.
84. `in_progress` Deepen the current `12`-case stable answer-level formal gate with cross-source, conflict, multi-step history, and deeper natural-Chinese coverage.
   - A deeper `18`-case watch matrix now exists with added cross-source, history, conflict, and denser natural-Chinese answer-level coverage.
- Current watch result: `14 / 18`; the remaining `4` failures have been narrowed down to a smaller harder set, so this matrix remains a watch surface instead of replacing the repo-default formal gate.
   - Reference report: [reports/generated/openclaw-cli-agent-answer-watch-2026-04-15.md](../../../reports/generated/openclaw-cli-agent-answer-watch-2026-04-15.md)
85. `completed` Increase the natural-Chinese share inside the answer-level formal gate itself, not just the global runnable matrix.
   - The repo-default formal gate now runs with `6 / 12` zh-bearing cases, including `5 / 12` `zh-natural` cases.
86. `completed` Revisit the main-path perf baseline and A/B attribution after the deeper answer-level watch is in place so the larger surface does not quietly re-mix host noise into the conclusions.
   - The perf baseline, raw transport watchlist, memory-improvement A/B summary, and full regression pass have all been rerun. The current conclusion is that the stable formal gate is healthy, while the deeper watch is improved but not yet promotable.

87. `completed` Finish the harder-failure attribution pass without prematurely promoting the deeper watch into a larger formal gate.
   - This round prioritized the broader rerun surface instead: full regression, CLI use cases, perf baseline, transport watchlist, and a `100`-case live A/B.
   - The new conclusion is no longer just “close four deeper-watch failures”, but “explain and then close why Memory Core still does not clearly outpace builtin memory in the larger live A/B”.
88. `completed` Re-evaluate the promotion boundary on the broader evidence surface instead of using only the `18`-case deeper watch.
   - The stable formal gate remains `12 / 12`; the deeper watch remains `14 / 18` and is still not promoted.
   - The new `100`-case live A/B now lands at `97` shared wins, `1` Memory Core-only win, `0` builtin-only wins, and `2` shared failures.
89. `completed` Rerun full regression, CLI use cases, perf baseline, and the memory-improvement A/B suite, then publish the next round report.
   - `npm test = 403 / 403`
   - `verify:memory-intent = pass`
   - retrieval-heavy CLI benchmark = `262 / 262`
   - isolated local answer-level formal gate = `12 / 12`
   - raw transport watchlist = `3 / 8 raw ok`
   - main-path perf baseline = retrieval / assembly `16ms`, raw transport `8061ms`, answer-level `11200ms`
   - memory-improvement A/B = `100` cases, `98` UMC pass, `97` builtin pass

90. `completed` Remove the earlier builtin-only regression reading from the `100`-case live A/B: `ab100-zh-negative-4`.
   - The birthday prompt is no longer counted as a plain negative because it behaves more like an identity-conflict / birthday-guardrail probe.
   - After replacing it with a true unknown-fact abstention prompt, `ab100-zh-negative-4` is now a shared abstention pass and the `100`-case live A/B no longer has a builtin-only win.
   - The follow-up round expanded the focused ordinary-conversation realtime-write suite from `10` to `40` cases and reran it in builtin-first, clean-state, then current order; the current result is `38 / 40` for Unified Memory Core versus `21 / 40` for legacy, with `18` UMC-only wins, `1` legacy-only win, and `1` shared fail.
91. `completed` Remove the two shared-fail Chinese history cases in the `100`-case live A/B: `ab100-zh-history-editor-2` and `ab100-zh-history-editor-4`.
   - The fix was not “add more memory”, but repair the history-versus-current-state boundary so Chinese history prompts stop triggering current-state assembly and query rewrites.
   - Focused hermetic cleanup rerun report: [openclaw-memory-improvement-history-cleanup-2026-04-17.md](../../../reports/generated/openclaw-memory-improvement-history-cleanup-2026-04-17.md)
   - Current focused rerun outcome: `ab100-zh-history-editor-2 = unified-gain`, `ab100-zh-history-editor-4 = shared-capability`
   - The stable high-level read is now current `100 / 100`, legacy `99 / 100`, `UMC-only = 1`, `builtin-only = 0`, `both-fail = 0`
92. `next` After the shared-fail history cases close, first complete a docs-first review so the roadmap, development plan, architecture docs, and `.codex/*` all point at the next “per-turn context optimization” recovery point; then redesign the next live A/B around `cross-source`, `conflict`, `multi-step history`, and denser natural-Chinese prompts.
   - This queue now resumes with Stage 6 shadow telemetry attached as a new measurement surface.
   - Next-round design constraints:
     - prefer a bounded, structured LLM-led context decision contract instead of expanding hardcoded rules
     - make operator metrics, rollback boundaries, and Docker / hermetic eval entrypoints explicit
     - keep active prompt mutation out of the default path

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
