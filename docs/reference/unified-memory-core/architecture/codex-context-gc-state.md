# Codex Context GC Current State

[English](codex-context-gc-state.md) | [中文](codex-context-gc-state.zh-CN.md)

## Question

`When Codex uses GC now, has it actually achieved context GC?`

## Short Answer

The answer depends on the layer:

- `project-level Context Minor GC`: `yes`
- `host-level thread context GC`: `not yet`
- `user-visible “obvious on-demand context loading”`: `not yet`

So the accurate statement is:

`repo-local working-set GC is already real and can apply, but it still does not make the full Codex host thread visibly thin end-to-end.`

## What Is Already Working

The Codex path in this repo is no longer shadow-only.

There are three concrete apply points:

1. `buildCodexContextMinorGcPackage(...)` switches `effectiveContextBlock` to the pruned packaged block when the guard passes, instead of keeping the baseline block, in [src/codex-context-minor-gc.js](./../../../../src/codex-context-minor-gc.js:193).
2. The VS Code helper now allows `continue` relations into the apply path by default, not just `switch` / `resolve`, in [src/codex-vscode-context-minor-gc.js](./../../../../src/codex-vscode-context-minor-gc.js:518).
3. `renderCodexVscodeContextMinorGcPrompt(...)` emits the pruned `effectiveContextBlock` whenever `applied=true`, in [src/codex-vscode-context-minor-gc.js](./../../../../src/codex-vscode-context-minor-gc.js:565).

Telemetry also shows that this has really happened in live runs.

For example, [reports/generated/codex-vscode-context-minor-gc/codex-telemetry.jsonl](./../../../../reports/generated/codex-vscode-context-minor-gc/codex-telemetry.jsonl:51) includes entries such as:

- `applied=true`
- `relation=continue`
- `baseline_context_estimate=579`
- `effective_context_estimate=131`
- `prompt_reduction_ratio=0.7737`

That means:

- the project-level context block is not only “theoretically reducible”
- it has already been replaced by a smaller working set in real execution

## What Is Not Working Yet

What is still missing is `host-level context GC`.

The current implementation mainly prunes:

- the repo-local `Context Minor GC Working Set` that this project prepares for prompt injection

It does not:

- reclaim long Codex host thread history that has already accumulated, including commentary, final answers, tool traces, and large repeated prefixes

That boundary is visible in the implementation:

1. the helper reads recent session messages and then performs repo-local working-set pruning, in [src/codex-vscode-context-minor-gc.js](./../../../../src/codex-vscode-context-minor-gc.js:497)
2. the footer host metric is only an estimate based on `last_token_usage.input_tokens`, not a host-context rewrite mechanism, in [src/codex-vscode-context-minor-gc.js](./../../../../src/codex-vscode-context-minor-gc.js:607)
3. the packaged block still carries `Active raw turns` plus `Semantic pins`, which means project-level carry-forward is still raw-turn-biased rather than fully summary-first task-state, in [src/codex-context-minor-gc.js](./../../../../src/codex-context-minor-gc.js:107)

So the current state is:

- `project-level` pruning can happen
- `host-level` slimming does not automatically happen because of this helper

## Why The UX Still Does Not Feel Obvious

The gap is a combination of three things:

1. `host history is not reclaimable from this layer`
   the repo helper cannot rewrite the full Codex host thread history
2. `project-level carry-forward is still conservative`
   it keeps a small amount of raw turns plus pins, instead of the smallest possible task-state
3. `debugging can keep polluting the same thread`
   if large diagnostics, session dumps, and long analysis stay in the same thread, host context will keep growing anyway

This is why:

- `GC can already apply`
- but the user can still honestly feel that `context did not obviously get smaller`

## How To Judge “Done”

The answer changes with the acceptance criterion.

### Criterion A: does the repo really perform working-set GC?

Answer:

- `yes`

This is the strongest proven layer right now.

### Criterion B: will an already-heavy old thread suddenly become much lighter?

Answer:

- `no`

This is not host-level full compaction and not a thread-history rewrite.

### Criterion C: can the user already feel obvious on-demand context loading?

Answer:

- `not reliably yet`

Especially on already-heavy old threads, the improvement usually will not feel dramatic.

## Product-Level Judgment

The most accurate product judgment right now is:

- `Context Minor GC` is real as a repo-local capability
- `experience-grade context GC` is still not closed as a host-level product behavior

So the problem is no longer “Minor GC has not been built yet”.

It is:

`Minor GC is already real and can apply, but the last host-visible product loop is still missing.`

## What Should Be Built Next

If the goal is for users to clearly feel “this is truly on-demand context loading now”, the right priority order is:

1. `summary-first carry-forward`
   keep task-state first and only a tiny amount of raw turns
2. `separate operator diagnostics from live thread continuation`
   write deep diagnostics to artifacts and keep the active thread short
3. `limit heavy debugging output inside the thread`
   avoid inflating host context while trying to observe GC

## Final Reusable Answer

If someone asks:

`Codex now has GC enabled. Does that mean context GC is already done?`

The shortest accurate answer is:

`Partially. Repo-local working-set GC is already real, but host-thread-level and user-visible context GC are not fully done yet.`
