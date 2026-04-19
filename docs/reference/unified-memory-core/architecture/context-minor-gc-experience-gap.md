# Context Minor GC Experience Gap

[English](context-minor-gc-experience-gap.md) | [中文](context-minor-gc-experience-gap.zh-CN.md)

## Purpose

This document answers one product-facing question:

`why does Context Minor GC look closed on paper while users still do not feel obvious “on-demand context loading” inside VS Code Codex?`

It no longer treats this as a post-Stage-11 theme.

Its judgment is:

- the user-visible acceptance bar for `Stage 11` was declared too early
- this gap still belongs inside `Stage 11`
- `Stage 12` should not be merged into the same stage

Related documents:

- [context-minor-gc.md](context-minor-gc.md)
- [codex-context-gc-state.md](codex-context-gc-state.md)
- [../development-plan.md](../development-plan.md)
- [../../../workstreams/project/roadmap.md](../../../workstreams/project/roadmap.md)

## Short Judgment

By the standard “does the project layer perform some working-set pruning?”, the answer is:

- `partly yes`

By the standard “can the user clearly feel that the real model-bound context is now much smaller?”, the answer is:

- `no`

So the user intuition “this still does not feel like true on-demand loading” is correct.

## Current Evidence

The numbers below come from the same live Codex VS Code session.

### 1. The host layer barely shrinks

In one representative recent observation:

- `hostActualInputTokens = 148009`
- `hostOriginalInputTokens = 148227`

The net difference is only:

- `218 tokens`

Meaning:

- even when the project layer prunes something, the host-visible net reduction is almost negligible

### 2. The project layer does sometimes prune

In the same round the project-layer observation showed:

- `baseline_context_estimate = 927`
- `effective_context_estimate = 710`
- `prompt_reduction_ratio = 0.2352`

Meaning:

- the repo-owned `Context Minor GC Working Set` did undergo local pruning

### 3. The host thread still replays a huge prefix

The latest session token snapshot showed:

- `last_input_tokens = 133875`
- `cached_input_tokens = 133120`
- `cached_ratio = 0.9944`

Meaning:

- most of the request prefix is still being replayed, even if it is cache-hit at the provider
- `high cache hit` is not the same thing as `small on-demand context`

### 4. The current working set still keeps long raw assistant turns

The current packaged working set still carries multiple long assistant raw turns instead of aggressively summarizing them first.

Meaning:

- even the project-layer “on-demand” behavior is still conservative

## Layered Diagnosis

### L1. Host layer

This is the layer users actually feel.

Problem:

- the Codex host accumulates tool traces, long commentary, long final answers, and debugging output
- the repo helper cannot rewrite the already-accumulated host history

Conclusion:

- optimizing only the repo-injected block cannot materially shrink the host mainline

### L2. Project layer

The project layer currently:

- reads recent `user_message`
- reads `final_answer`
- runs the dialogue working-set decision
- emits a `Context Minor GC Working Set`

Problem:

- it still reads up to the latest `48` messages by default
- carry-forward is still raw-turn-heavy
- true apply still depends on reduction / evict / relation guard checks

Conclusion:

- the project layer is “prunable”, but not yet “minimal”

### L3. Observation layer

The footer currently reports:

- `last_token_usage.input_tokens`

That means:

- recent request input size

It does not mean:

- current VS Code status-bar occupancy

Conclusion:

- the observation layer helps diagnose
- it does not prove end-to-end user-visible success

## This Is Not One Bug, But Three Gaps

1. **Host irreclaimability gap**
   the repo helper can prune only the injected block, not the already-materialized Codex host history
2. **Project conservatism gap**
   the packaged block still favors raw-turn carry-forward over minimal task-state carry-forward
3. **Debug pollution gap**
   when debugging uses raw session dumps and long tool output inside the same thread, the host layer gets pushed up directly

## Feasibility Of The User Goal

This has to be split into three goals.

### Goal A: make context growth visibly slower in new or continuing sessions

Feasibility:

- `high`

Why:

- this mainly depends on controlling growth sources
- shorter commentary, summary-first carry-forward, and moving heavy diagnostics off-thread are all within repo control

Expected result:

- ordinary sessions should stop growing so quickly
- the user should feel “only complex turns grow a lot” instead of “every turn gets much heavier”

### Goal B: make the current already-heavy old thread shrink dramatically right now

Feasibility:

- `low`

Why:

- the host history is already materialized
- the repo helper cannot force-delete or rewrite the host-retained thread state

Expected result:

- minor bleeding control is possible
- dramatic immediate shrinkage is not realistic

### Goal C: make users clearly feel that on-demand loading is real

Feasibility:

- `medium-high`

But only if:

1. the goal is not defined as “make old threads instantly thin”
2. it is defined as “stop future complex turns from linearly bloating the thread”
3. the project layer moves from raw-turn carry-forward to summary-first carry-forward

## Recommended Solution

### Option 1: control growth sources first

Highest priority.

Do:

- force short commentary
- stop dumping raw session content and heavy tool output into the active thread
- write heavy diagnostics to artifacts and send only short summaries back into the thread

Value:

- directly reduces host-layer growth

### Option 2: make the project layer summary-first

Second priority.

Do:

- stop preferring long assistant raw turns
- compress the current topic into task-state summaries
- keep only the last tiny set of truly necessary raw turns

Value:

- makes `Context Minor GC Working Set` closer to a minimal sufficient state

### Option 3: separate operator observability from thread continuation

Third priority.

Do:

- keep `gc header/footer` extremely short
- write detailed diagnosis into artifacts
- reference only conclusions in the active thread

Value:

- prevents the helper from becoming a fresh context pollution source

## Wrong Directions To Avoid

1. treating larger windows as if they solved the problem
2. continuing to tune only header/footer wording
3. merging `Stage 12` into `Stage 11` and turning two different themes back into one mixed stage

## Stage 11 Boundary Correction

So the right framing is not:

- “Minor GC is still unfinished”
- “split it into another new stage”

It is:

- `Minor GC core capability closed`
- `host-visible context loading experience still not acceptable`
- `that experience gap still belongs inside Stage 11`

At the same time:

- `Stage 12` should remain separate and should not be merged into `Stage 11`

Why:

- `Stage 11` is about `Context Minor GC + Codex integration + user-visible context loading experience`
- `Stage 12` is about `realtime memory intent productization`
- those are not the same theme

Its relationship to `Stage 11` is:

- the earlier part of `Stage 11` already proved capability viability
- the remaining work is to complete that same `Stage 11` into an obvious user-facing experience

## Recommended Stage 11 Supplemental Exit Criteria

To claim that `Stage 11` is finally closed, all of the following should be true:

1. ordinary multi-turn sessions no longer show easy linear host-input growth
2. diagnostic turns no longer dump large raw payloads back into the active thread by default
3. project-layer carry-forward is summary-first instead of raw-turn-first
4. users can clearly observe that similar-complexity turns are materially thinner than before

## Final Judgment

Shortest version:

- the target is realistic
- but it is not reachable through a small helper wording tweak
- for new and continuing sessions, feasibility is `medium-high`
- for already-heavy old threads, immediate dramatic shrinkage feasibility is `low`

So the right strategy is:

- do not promise instant slimming for old threads
- do fix future growth sources plus project-layer carry-forward
- and write visible user feel back into the real `Stage 11` closeout bar
