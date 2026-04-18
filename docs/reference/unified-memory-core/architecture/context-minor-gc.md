# Context Minor GC

[English](context-minor-gc.md) | [中文](context-minor-gc.zh-CN.md)

## Purpose

This document turns the per-turn context optimization line into one explicit program name:

- `Context Minor GC`

It also makes one status change explicit:

- `Stage 11: Context Minor GC And Codex Integration` is now complete

So this page no longer answers “what is still unfinished inside Minor GC?”
It now answers:

1. what `Context Minor GC` actually finished
2. why it can now be treated as closed
3. how it differs from `compact / compat`
4. why the next stage has moved elsewhere

Related documents:

- [context-slimming-and-budgeted-assembly.md](context-slimming-and-budgeted-assembly.md)
- [dialogue-working-set-pruning.md](dialogue-working-set-pruning.md)
- [plugin-owned-context-decision-overlay.md](plugin-owned-context-decision-overlay.md)
- [../development-plan.md](../development-plan.md)
- [../../../roadmap.md](../../../roadmap.md)

## Current Status

Read this section first.

| Item | Current State |
| --- | --- |
| Stage 6 shadow runtime | completed; stays `default-off` + shadow-only |
| Stage 7 / Step 108 | completed; decision transport runs without modifying OpenClaw core |
| Stage 7 / `104` harder eval matrix | completed; live matrix `6 / 6` |
| Stage 9 guarded smart path | completed; stays `default-off` / opt-in only |
| Codex Context Minor GC live matrix | completed; `4 / 4` |
| `Context Minor GC` | closed |
| Stage 11 | completed |
| Current stage | `Stage 12: Realtime Memory Intent Productization` |

Short version:

`Context Minor GC` now completed the “can run, can be measured, can roll back, can close out” loop across both OpenClaw and Codex.

## Why Stage 11 Can Close

The new closeout bar for `Stage 11` is simple:

1. the full GC path is usable
2. users can see a clear benefit
3. rollback boundaries remain explicit

Current result:

| Bar | Result |
| --- | --- |
| GC is usable | OpenClaw + Codex both consume the same decision contract / shadow / guarded seam |
| User benefit is visible | OpenClaw positive cases reached average package reduction ratio `0.4657`; Codex positive cases reached prompt reduction ratios `0.4355` / `0.1522` |
| Rollback boundary stays explicit | guarded remains `default-off` / opt-in only |

That is why `Stage 11` is now closed instead of still being current.

## Reading Order

If you only want to understand Minor GC progress and the final answer, read in this order:

1. this page
2. [Stage 7 / Step 108 closeout](../../../../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.md)
3. [Stage 7 `Context Minor GC` closeout](../../../../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.md)
4. [Stage 9 closeout](../../../../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.md)
5. [Codex Context Minor GC Live Matrix](../../../../reports/generated/codex-context-minor-gc-live-2026-04-18/report.md)
6. [Stage 11 closeout report](../../../../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.md)

## Short Conclusion

The `GC` here is not literal memory destruction. It means:

- reclaim raw context that no longer deserves prompt space on the hot path
- keep archive refresh / full compact / compat as low-frequency background safety nets

The goal is not to compact more often. It is the opposite:

- normal long sessions should not depend on `compact / compat`
- lighter per-turn context management should keep them alive

## Naming Definition

| Term | Meaning Here | What It Is Not |
| --- | --- | --- |
| `Context Minor GC` | lightweight per-turn reclamation and reshaping of the next-turn prompt working set | not permanent log deletion and not durable-memory deletion |
| `Full Compact / Compat` | low-frequency nightly or background cleanup, summarization, archiving, and safety fallback | not the default day-to-day survival mechanism |
| `Task State` | current task, open loops, unresolved constraints, carry-forward pins | not one ever-growing chat summary |
| `Thread Capsule` | archived topic summary, topic archive, or semantic pin that left the hot path | not a replacement for durable memory |

## Why The GC Analogy Helps

The analogy is useful because it:

1. separates per-turn hot-path pruning from low-frequency background cleanup
2. keeps the system focused on `minor` instead of jumping to `full compact` under pressure
3. forces `task state` to become a first-class layer instead of hiding inside bloated summaries
4. compresses the product goal into one sentence:
   `normal sessions should survive through Context Minor GC while compact / compat stays in the background`

## Layer Mapping

| Concept Layer | UMC Mapping | Current Status |
| --- | --- | --- |
| `L0 Hot Window` | recent raw turns / active working set | landed |
| `L1 Warm Topic Cache` | task-state ledger / current-topic summary / carry-forward pins | can still evolve, but no longer blocks closeout |
| `L2 Cold Topic Archive` | thread capsules / archived topic summaries | valid future enhancement |
| `L3 Durable Memory` | governed registry / stable cards / rule cards | landed |
| `Minor GC` | per-turn working-set pruning + bounded local completion | closed |
| `Full Compact` | nightly or background compat / compact / archive refresh | retained as low-frequency safety net |

## What The Hot Path Should Look Like

The long-term target is still:

- `direct`
- `local_complete`
- `full_assembly`

```mermaid
flowchart LR
    U["User Turn"] --> R["Stage 0 Router"]
    R --> D["direct"]
    R --> L["local_complete"]
    R --> F["full_assembly"]
    D --> P["prompt package"]
    L --> M["Context Minor GC decision"]
    F --> A["retrieval / rerank / budgeted assembly"]
    A --> M
    M --> P
    P --> X["executor model"]
    B["background only"] --> C["full compact / compat / archive refresh"]
```

Important:

- this is the long-term target shape
- it is not required for the already-finished closeout
- router / task-state expansion is still future work

## The Former Main Blocker Is Closed

The hard blocker used to be decision transport and seam stability:

```text
OpenClaw run
  -> contextEngine.assemble()
     -> captureDialogueWorkingSetShadow()
        -> runWorkingSetShadowDecision()
           -> runtime.subagent.run()
              -> requires gateway request scope
              -> throw
```

That blocker is now closed through the plugin-owned decision runner:

- decision transport no longer depends on host `runtime.subagent`
- Step 108 is closed
- OpenClaw core does not need a forced change for this line

So the question “can Minor GC run without modifying OpenClaw core?” is already answered:
yes.

## Adopted Shape

The landed shape is:

- `Context Minor GC` owns the hot-path working-set control plane
- `plugin-owned context decision overlay` unties decision transport from the host seam
- `guarded smart path` provides a very narrow opt-in user gain
- `compact / compat` stays in the background

## Evidence

This route now has formal closeout evidence:

- Stage 6 runtime shadow replay: `16 / 16`
- Stage 7 scorecard: captured `16 / 16`
- Stage 7 / Step 108 hermetic gateway: `5 / 5`
- Stage 7 / Step 108 local service smoke: `3 / 3`
- Stage 7 / `104` harder live matrix: `6 / 6`
- Stage 9 guarded live A/B: baseline `4 / 4`, guarded `4 / 4`
- Stage 9 guarded applied: `2 / 4`
- Codex live matrix: baseline `4 / 4`, minor-gc `4 / 4`
- Codex guarded applied: `2`
- Codex applied-only prompt reduction ratio: `0.2939`

Together these numbers mean:

- the Minor GC direction is stable
- the OpenClaw side is no longer a blocker
- the Codex bridge is no longer a blocker
- `Stage 11` can close

## What Still Remains

What remains should no longer be written as “finish Minor GC”.

The real remaining work is:

1. keep the OpenClaw-side and Codex-side `Context Minor GC` evidence green
2. keep the guarded seam `default-off` / opt-in only
3. move the genuinely new work into `Stage 12`: realtime memory intent productization

## Final Judgment

The shortest judgment is:

- `Context Minor GC` as a capability is done
- `Stage 11` as an umbrella stage is also done
- the line is now in hold-green maintenance, not the current feature stage
