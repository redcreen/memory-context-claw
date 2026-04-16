# Roadmap

[English](roadmap.md) | [中文](roadmap.zh-CN.md)

## Scope

This page is the stable roadmap wrapper for the repo. It shows milestone order and current program direction without replacing the live execution control surface.

For live work state, read:

- [../.codex/status.md](../.codex/status.md)
- [../.codex/module-dashboard.md](../.codex/module-dashboard.md)

For detailed queues, read:

- [project workstream roadmap](workstreams/project/roadmap.md)
- [unified-memory-core/development-plan.md](reference/unified-memory-core/development-plan.md)

## Current Program Snapshot

This block is here to answer "where did the `200+` case program actually land?" without forcing a jump back to the control surface.

- Program: `execute-200-case-benchmark-and-answer-path-triage`
- Status: `completed`
- Runnable matrix: `392` cases
- Chinese coverage: `211 / 392 = 53.83%`
- Natural Chinese cases: `24` (`12` retrieval + `12` answer-level)
- Retrieval-heavy formal gate: `250 / 250`
- Isolated local answer-level formal gate: `12 / 12` (`6 / 12` zh-bearing inside the formal gate)
- Live answer-level A/B: `100` real cases, `97` shared wins, `1` Memory Core-only win, `0` builtin-only wins, and `2` shared failures
- Natural-Chinese representative retrieval slice: `5 / 5`
- Natural-Chinese representative answer-level slice: `6 / 6`
- Raw transport watchlist: `3 / 8 raw ok`; the rest are `4` `missing_json_payload` failures and `1` `empty_results`
- Main-path perf baseline: retrieval / assembly `16ms`; raw transport `8061ms`; isolated local answer-level `11200ms`
- Interpretation: the `200+` case buildout, natural-Chinese hardening, watchlist classification, perf-baseline refresh, and the first answer-level gate expansion from `6/6` to `12/12` are complete; the builtin-only regression has now been removed from the `100`-case live A/B, and the next phase should focus on the remaining shared failures before claiming a broader product lead

Supporting evidence:

- [../.codex/status.md](../.codex/status.md)
- [../.codex/plan.md](../.codex/plan.md)
- [generated/openclaw-cli-memory-eval-program-2026-04-14.md](../reports/generated/openclaw-cli-memory-eval-program-2026-04-14.md)
- [generated/openclaw-natural-chinese-watch-and-perf-2026-04-15.md](../reports/generated/openclaw-natural-chinese-watch-and-perf-2026-04-15.md)
- [generated/openclaw-answer-level-gate-expansion-2026-04-15.md](../reports/generated/openclaw-answer-level-gate-expansion-2026-04-15.md)

## Dialogue Working-Set Runtime Snapshot

This block tracks the completed Stage 6 runtime shadow integration.

- Program: `dialogue-working-set-shadow-runtime`
- Status: `completed / shadow-only`
- Runtime shadow replay: `16 / 16`
- Runtime shadow replay average reduction ratio: `0.4368`
- Runtime answer A/B: baseline `5 / 5`, shadow `5 / 5`
- Runtime answer A/B shadow-only wins: `0`
- Runtime answer A/B average prompt reduction ratio: `0.0114`
- Interpretation: runtime shadow integration is now the durable measurement surface, but active prompt mutation remains deferred

Supporting evidence:

- [generated/dialogue-working-set-pruning-feasibility-2026-04-16.md](../reports/generated/dialogue-working-set-pruning-feasibility-2026-04-16.md)
- [generated/dialogue-working-set-shadow-replay-2026-04-16.md](../reports/generated/dialogue-working-set-shadow-replay-2026-04-16.md)
- [generated/dialogue-working-set-answer-ab-2026-04-16.md](../reports/generated/dialogue-working-set-answer-ab-2026-04-16.md)
- [generated/dialogue-working-set-adversarial-2026-04-16.md](../reports/generated/dialogue-working-set-adversarial-2026-04-16.md)
- [generated/dialogue-working-set-validation-2026-04-16.md](../reports/generated/dialogue-working-set-validation-2026-04-16.md)
- [generated/dialogue-working-set-runtime-shadow-2026-04-16.md](../reports/generated/dialogue-working-set-runtime-shadow-2026-04-16.md)
- [generated/dialogue-working-set-runtime-answer-ab-2026-04-16.md](../reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16.md)
- [generated/dialogue-working-set-runtime-shadow-summary-2026-04-16.md](../reports/generated/dialogue-working-set-runtime-shadow-summary-2026-04-16.md)
- [generated/dialogue-working-set-stage6-2026-04-16.md](../reports/generated/dialogue-working-set-stage6-2026-04-16.md)

## Now / Next / Later

| Horizon | Focus | Exit Signal |
| --- | --- | --- |
| Now | treat Stage 6 runtime shadow integration as completed, keep it `default-off` and shadow-only, and resume the deferred shared-fail history cleanup using the new telemetry surface | the deferred history / harder A/B queue is running again with Stage 6 telemetry attached |
| Next | expand harder live A/B and history cases while keeping working-set pruning shadow-only | harder answer-level cases start turning into cleaner UMC wins without active prompt mutation |
| Later | discuss whether an active prompt experiment is justified only after a longer real-session soak | shadow telemetry stays green long enough to justify an explicit promotion decision and rollback gate |

## Current Execution Focus

The current roadmap horizon also maps to the concrete next execution work:

1. keep Stage 6 runtime shadow integration `default-off` and shadow-only
2. resume the deferred `ab100-zh-history-editor-*` cleanup and the harder live A/B expansion with shadow telemetry attached
3. continue treating active prompt mutation as explicitly out of scope until the new measurement surface soaks longer
4. use the runtime export artifacts as the new replayable operator evidence surface

When resuming work:

- use `91` in [reference/unified-memory-core/development-plan.md](reference/unified-memory-core/development-plan.md) for the current execution order
- use [../.codex/plan.md](../.codex/plan.md) and [../.codex/status.md](../.codex/status.md) for the live state

## Milestones

| Milestone | Status | Goal | Depends On | Exit Criteria |
| --- | --- | --- | --- | --- |
| [Stage 1: design baseline](reference/unified-memory-core/development-plan.md#stage-1-design-and-documentation-baseline) | completed | freeze product naming, boundaries, and document stack | none | architecture, module boundaries, and testing surfaces are aligned |
| [Stage 2: local-first baseline](reference/unified-memory-core/development-plan.md#stage-2-local-first-implementation-baseline) | completed | ship one governed local-first end-to-end baseline | Stage 1 | core modules, adapters, standalone CLI, and governance all run |
| [Stage 3: self-learning lifecycle baseline](reference/unified-memory-core/development-plan.md#stage-3-self-learning-lifecycle-baseline) | completed | turn the already-implemented reflection baseline into an explicit lifecycle with promotion, decay, and learning-specific governance | Stage 2 | promotion / decay expectations, learning governance, OpenClaw validation, and local governed loop are all implemented and regression-protected |
| [Stage 4: policy adaptation](reference/unified-memory-core/development-plan.md#stage-4-policy-adaptation-and-multi-consumer-use) | completed | let governed learning outputs influence consumer behavior | Stage 3 | one reversible policy-adaptation loop is proven |
| [Stage 5: product hardening](reference/unified-memory-core/development-plan.md#stage-5-product-hardening-and-independent-operation) | completed | validate split-ready and independent-product operation | Stage 4 | release boundary, reproducibility, maintenance workflows, and split rehearsal are all CLI-verifiable |
| [Stage 6: dialogue working-set shadow integration](reference/unified-memory-core/development-plan.md#stage-6-dialogue-working-set-shadow-integration) | completed | validate and instrument hot-session working-set pruning in runtime shadow mode before any active prompt cutover | Stage 5 | runtime shadow telemetry is now landed default-off, replayable exports exist, and answer-level replay stays green enough to keep the feature shadow-only |

## Milestone Flow

```mermaid
flowchart LR
    A["Stage 1<br/>design baseline"] --> B["Stage 2<br/>local-first baseline"]
    B --> C["Stage 3<br/>self-learning lifecycle"]
    C --> D["Stage 4<br/>policy adaptation"]
    D --> E["Stage 5<br/>product hardening"]
    E --> F["Stage 6<br/>working-set shadow integration"]
```

## Risks and Dependencies

- the current roadmap should not drift away from `.codex/status.md` and `.codex/plan.md`
- `todo.md` should remain personal scratch space, not a competing status source
- the next dependency is no longer Stage 5 implementation; it is keeping release-preflight and deployment evidence stable over time
- registry-root cutover policy remains an operator follow-up, not hidden Stage 5 contract work
- Stage 4 and Stage 5 reports must stay readable while any later service-mode discussion remains deferred
- the primary post-Stage-5 work is now evaluation-driven optimization, so the roadmap and `.codex/plan.md` must keep case expansion, A/B comparison, answer-level regression, transport watchlists, and performance planning visible
- active prompt mutation remains explicitly deferred until runtime shadow telemetry proves the working-set path on real sessions
