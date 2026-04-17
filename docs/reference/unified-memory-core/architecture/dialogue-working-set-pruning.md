# Dialogue Working-Set Pruning

[English](dialogue-working-set-pruning.md) | [中文](dialogue-working-set-pruning.zh-CN.md)

## Purpose

This document defines a separate runtime layer for long multi-topic chats:

- keep the full session log intact
- keep durable memory ingestion unchanged
- shrink only the next-turn raw prompt working set when the active topic changes

This is not a replacement for:

- [context-slimming-and-budgeted-assembly.md](context-slimming-and-budgeted-assembly.md)
- [../../pre-compaction-memory-distillation-design.md](../../pre-compaction-memory-distillation-design.md)

Instead it fills the gap between them:

- `context slimming` focuses on durable-source retrieval and budgeted assembly
- `pre-compaction distillation` focuses on extracting durable memory before compaction
- `dialogue working-set pruning` focuses on hot session context that should leave the next-turn prompt but remain recoverable

## Problem

Long chats do not stay on one topic.

In practice a conversation often looks like:

1. topic A starts
2. topic B interrupts
3. topic C becomes the real active topic
4. topic A and B still occupy raw prompt space long after they stopped helping

If the runtime keeps carrying all raw turns equally, the model pays for:

- solved blocks
- off-topic status snapshots
- temporary meta exchanges
- old explanation trails

This creates a different problem from durable-memory retrieval:

- retrieval may already be correct
- but the active prompt working set is still too thick

## Product Value Placement

This document is the hot-session half of the first product value:

- `on-demand context loading instead of flat prompt stuffing`

Existing capability is already present:

- the helper, evaluator, replay harness, and runtime shadow path are all landed
- the feature already measures `relation / evict / pins / reduction ratio` in runtime shadow mode
- the current question is no longer whether this layer can exist, but how to evolve it without turning runtime policy into a brittle ruleset

## Non-Goals

This design does not:

- delete session logs
- replace durable-memory governance
- rewrite builtin memory storage
- require every turn to run an extra compaction model call
- let the LLM hard-delete context without runtime guards

## Core Model

The runtime should distinguish four layers:

1. `session log`
   - full raw turns, never deleted by this feature
2. `active working set`
   - the raw turns that are still allowed into the next-turn prompt
3. `thread capsules`
   - archived summaries or semantic pins for older topics
4. `durable memory`
   - governed long-lived facts, rules, and promoted state

The key constraint is:

> working-set pruning may evict raw turns from the next-turn prompt, but it must not destroy the log or silently replace durable memory policy.

## Decision Contract

The LLM should not directly return “delete these turns forever”.

It should return a guarded runtime hint such as:

```json
{
  "relation": "continue | branch | switch | resolve",
  "confidence": 0.92,
  "evict_turn_ids": ["t3", "t4"],
  "pin_turn_ids": ["t1"],
  "archive_summary": "Topic A is complete; keep only the user's reply-style preference as a semantic pin.",
  "reasoning_summary": "The active question moved to plugin config, so solved project-summary turns can leave the raw working set."
}
```

Runtime ownership remains with the system:

- latest user turn is always guarded
- invalid ids are ignored
- evicted raw turns remain in session log
- `pin_turn_ids` preserve semantic content as pins or capsules even when raw turns leave the prompt

## Relation Semantics

- `continue`
  - same active topic; keep the raw block unless there is obvious noise
- `branch`
  - side question while an older task is still open; keep both the main task and the branch anchor
- `switch`
  - active topic changed; old raw block can leave the next-turn prompt, but durable facts or style rules may stay as pins
- `resolve`
  - the conversation mostly closes; keep pins and the latest user turn, archive the rest

## Runtime Policy

The preferred next production shape should be guarded, bounded-call, and LLM-led:

1. hard runtime ownership first
   - latest user turn stays guarded
   - invalid or unsafe evictions are ignored
   - session logs remain intact
2. one bounded structured LLM decision surface when the boundary matters
   - ambiguous topic change
   - conflict between “open loop” and “new task”
   - unclear distinction between durable pin and session-only chatter
3. cheap heuristics only as admission and fallback
   - token pressure
   - explicit topic-shift markers
   - unresolved-task presence
4. soft eviction only
   - remove from next-turn prompt
   - keep in log
   - allow later recall or capsule retrieval

Preferred implementation order:

1. mock evaluator and shadow report
2. runtime shadow mode
3. guarded activation on a small slice
4. only then real integration into assembly

## Daily-Path Goal

The long-term goal of this runtime layer is not to make users depend on `compact / compat` to keep long conversations alive.

The better target is:

- do lightweight working-set management each turn
- move only expired raw turns out of the next prompt
- let long-running conversations continue on the normal hot path without needing compact in most daily use

`compact / compat` can still exist, but it fits better as:

- nightly cleanup
- a background safety net
- a low-frequency fallback under extreme token pressure

## Interaction With Existing Designs

### With Context Slimming

`context slimming and budgeted assembly` controls which durable artifacts are retrieved and assembled.

`dialogue working-set pruning` controls which raw recent turns still deserve prompt space.

These are complementary:

- durable-source slimming answers “which memory artifacts should enter?”
- working-set pruning answers “which recent raw turns can leave?”

### With Pre-Compaction Distillation

`pre-compaction distillation` promotes important information before history is compacted.

`dialogue working-set pruning` is narrower:

- it is about prompt weight during the current chat
- it does not decide durable promotion
- it can happen before the global compaction threshold is reached

## Mock-First Feasibility Path

To avoid touching the current system too early, the first phase should stay isolated:

- evaluation cases: [../../../../evals/dialogue-working-set-pruning-cases.js](../../../../evals/dialogue-working-set-pruning-cases.js)
- pure helper: [../../../../src/dialogue-working-set.js](../../../../src/dialogue-working-set.js)
- real-LLM evaluator: [../../../../scripts/eval-dialogue-working-set-pruning.js](../../../../scripts/eval-dialogue-working-set-pruning.js)
- unit tests: [../../../../test/dialogue-working-set.test.js](../../../../test/dialogue-working-set.test.js)
- generated feasibility report: [../../../../reports/generated/dialogue-working-set-pruning-feasibility-2026-04-16.md](../../../../reports/generated/dialogue-working-set-pruning-feasibility-2026-04-16.md)

The mock phase should prove three things before any production integration:

1. multi-topic chats can be classified into `continue / branch / switch / resolve`
2. old raw blocks can be evicted while durable facts survive as pins
3. token reduction is real without losing unresolved tasks or the latest user turn

## Current Validation Snapshot

This design is now past mock feasibility and past the Stage 6 entry gate; the `default-off` runtime shadow instrumentation is already landed.

- roadmap pointer: [../../../roadmap.md](../../../roadmap.md)
- development-plan pointer: [../development-plan.md](../development-plan.md)
- overall validation summary: [../../../../reports/generated/dialogue-working-set-validation-2026-04-16.md](../../../../reports/generated/dialogue-working-set-validation-2026-04-16.md)
- runtime shadow replay: [../../../../reports/generated/dialogue-working-set-runtime-shadow-2026-04-16.md](../../../../reports/generated/dialogue-working-set-runtime-shadow-2026-04-16.md)
- runtime answer A/B: [../../../../reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16.md](../../../../reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16.md)
- Stage 6 closeout report: [../../../../reports/generated/dialogue-working-set-stage6-2026-04-16.md](../../../../reports/generated/dialogue-working-set-stage6-2026-04-16.md)

Current evidence:

- shadow replay: `9 / 9`
- shadow replay average raw reduction ratio: `0.5722`
- shadow replay average shadow-package reduction ratio: `0.2275`
- answer A/B: baseline `5 / 5`, shadow `5 / 5`, `0` regressions
- answer A/B average estimated prompt reduction ratio: `0.0636`
- adversarial replay: `7 / 7`
- runtime shadow replay: `16 / 16`
- runtime shadow replay average reduction ratio: `0.4368`
- runtime shadow replay average elapsed ms: `18728.3`
- runtime answer A/B: baseline `5 / 5`, shadow `5 / 5`, shadow-only wins `0`

Supporting reports:

- [../../../../reports/generated/dialogue-working-set-pruning-feasibility-2026-04-16.md](../../../../reports/generated/dialogue-working-set-pruning-feasibility-2026-04-16.md)
- [../../../../reports/generated/dialogue-working-set-shadow-replay-2026-04-16.md](../../../../reports/generated/dialogue-working-set-shadow-replay-2026-04-16.md)
- [../../../../reports/generated/dialogue-working-set-answer-ab-2026-04-16.md](../../../../reports/generated/dialogue-working-set-answer-ab-2026-04-16.md)
- [../../../../reports/generated/dialogue-working-set-adversarial-2026-04-16.md](../../../../reports/generated/dialogue-working-set-adversarial-2026-04-16.md)
- [../../../../reports/generated/dialogue-working-set-runtime-shadow-summary-2026-04-16.md](../../../../reports/generated/dialogue-working-set-runtime-shadow-summary-2026-04-16.md)

Interpretation:

- the direction is now strong enough to act as the runtime shadow measurement surface
- the evidence is still not strong enough for active prompt cutover
- the next design review should focus on bounded LLM-led decision shape and operator safety, not on expanding a larger rule table

## Current Runtime Gate

The current runtime boundary stays intentionally narrow:

- keep the feature `default-off`
- record `relation / evict / pins / reduction ratio`
- do not mutate the final prompt in this stage
- do not change builtin memory behavior in this stage
- discuss any guarded active-path experiment only after real-session shadow telemetry stays green

## Acceptance Criteria

At minimum the feasibility phase should show:

1. no hard-delete behavior
   - session log remains intact
   - latest user turn is always guarded
2. case-level decision quality
   - required open-loop turns stay
   - required stale turns are evicted on switch cases
   - durable facts are pinned instead of silently dropped
3. measurable prompt reduction
   - switch cases show visible reduction in kept raw-token estimates
4. real-LLM reproducibility
   - the structured decision can be produced by an actual model, not just handwritten mocks

## Recommendation

This should keep moving as a separate shadow-first workstream, but the minimum Stage 6 runtime wiring is already done.

The short-term target is not “smart deletion”.

The short-term target is:

- guarded soft eviction
- semantic pins for durable facts
- proof that multi-topic prompt working sets can shrink safely before the main system is modified

The current program decision is therefore:

- keep `dialogueWorkingSetShadow` `default-off` and shadow-only
- use runtime shadow telemetry as the new measurement surface for harder A/B and deferred history cleanup
- review the bounded structured LLM-led decision contract before any active-path experiment
- defer active prompt mutation until the promotion gate is explicitly satisfied
