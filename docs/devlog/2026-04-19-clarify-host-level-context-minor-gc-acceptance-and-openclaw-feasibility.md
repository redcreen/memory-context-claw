# Clarify Host-Level Context Minor GC Acceptance And OpenClaw Feasibility

## Context

Recent Codex manual checks confirmed that repo-local `Context Minor GC` can prune its own working-set block and still keep answers correct on topic-return cases.

That result was not enough for the real product goal.

The user requirement is stricter:

- normal use should show an obvious context-thinning effect after topic switches
- users should not need `compact`
- users should not need to frequently start a new thread just to keep the system usable

The latest discussion forced a more honest separation between:

- project-level working-set pruning
- host-level prompt shrink that users can actually feel

## What We Confirmed

### 1. Codex currently does not satisfy the final product goal

Codex-side helper logic can prune the repo-injected working-set block, but it does not control the main host thread history.

Observed gap:

- `applied=true` and high `promptReductionRatio` can coexist with
- flat or rising host-visible `Context(估算)` and `Context History`

This means the current Codex path proves local prompt-block pruning, not end-to-end host prompt shrink.

### 2. The current Codex success signal is too weak for final acceptance

These are useful diagnostics:

- `applied`
- `relation`
- `promptReductionRatio`

But they are not sufficient final acceptance signals.

Final acceptance must primarily care about:

- host-visible prompt size
- post-switch prompt rollback within a few turns
- answer correctness without user-side `compact`

### 3. OpenClaw has a materially stronger host position than Codex

OpenClaw is not limited to appending a helper block.

The current engine path can:

- replace `params.messages` with `guarded.filteredMessages`
- trim kept messages to a message budget
- merge carry-forward text into the final `systemPromptAddition`

That means OpenClaw already owns the largest dynamic parts of prompt assembly:

- dialogue message history
- retrieval / memory additions

This is enough to treat OpenClaw as the main host for the real product goal.

### 4. OpenClaw still is not proven complete yet

OpenClaw appears to control the largest growing prompt components, but that is still different from proving user-visible host shrink in real long conversations.

What is still unproven:

- whether host-visible prompt size actually drops after topic switches in ongoing long sessions
- whether that drop is large enough to be obvious without reading telemetry
- whether the effect holds without relying on manual `compact`

## Key Decisions

1. Stop treating project-level pruning as final success.
2. Treat Codex as a useful project-layer validation path, not the primary product proof for host-level context shrink.
3. Treat OpenClaw as the primary host where the final user-visible goal is realistically achievable.
4. Reopen acceptance around host-level behavior instead of block-level telemetry.

## Final Acceptance Standard

`Context Minor GC` is not complete unless all of these hold together:

1. Users can keep working normally without manual `compact`.
2. After a clear topic switch, host-visible prompt size falls back within `1-3` turns.
3. The history trend is not monotonic-only growth; it should show visible rollback after pruning-worthy switches.
4. Answer correctness stays intact, including durable facts and newer-value-overwrites-older-value cases.
5. High cache-hit or local block-pruning telemetry cannot be used as a substitute for host-visible shrink.

## Immediate Next Step

Run fresh OpenClaw host testing against this stricter standard and judge it by host-visible prompt rollback, not just guarded telemetry.
