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

The first production shape should be rule-first and guarded:

1. cheap signals first
   - token pressure
   - explicit topic-shift markers
   - unresolved-task presence
   - durable-preference detection
2. LLM hint only when needed
   - ambiguous topic change
   - conflict between “open loop” and “new task”
   - unclear distinction between durable pin and session-only chatter
3. soft eviction only
   - remove from next-turn prompt
   - keep in log
   - allow later recall or capsule retrieval

Preferred implementation order:

1. mock evaluator and shadow report
2. runtime shadow mode
3. guarded activation on a small slice
4. only then real integration into assembly

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

This should move forward as a separate shadow-first workstream.

The short-term target is not “smart deletion”.

The short-term target is:

- guarded soft eviction
- semantic pins for durable facts
- proof that multi-topic prompt working sets can shrink safely before the main system is modified
