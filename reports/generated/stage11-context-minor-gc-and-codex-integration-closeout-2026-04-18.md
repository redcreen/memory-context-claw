# Stage 11 `Context Minor GC And Codex Integration` Closeout

[English](stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.md) | [中文](stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.zh-CN.md)

## Goal

Close `Stage 11` under the updated bar:

- the full `Context Minor GC` path is usable, not just an OpenClaw-only experiment
- users can see clear benefit, not only shadow telemetry
- rollback remains explicit instead of hiding an implicit default rollout

## Stage 11 Completion Bar

| Bar | Requirement | Current result |
| --- | --- | --- |
| GC is usable | OpenClaw and Codex both consume the same decision contract / shadow / guarded seam | satisfied |
| User benefit is visible | positive cases show material prompt/context reduction without answer regressions | satisfied |
| Boundary stays explicit | `default-off` / opt-in only still holds; guarded path is not widened implicitly | satisfied |

## Evidence

### OpenClaw side

- [Stage 7 / Step 108 closeout](stage7-step108-context-minor-gc-closeout-2026-04-18.md)
  - hermetic gateway `5 / 5 captured`
  - local service smoke `3 / 3 captured`
- [Stage 7 `Context Minor GC` closeout](stage7-context-minor-gc-closeout-2026-04-18.md)
  - harder live matrix `6 / 6`
  - average raw reduction ratio `0.6556`
  - average package reduction ratio `0.4657`
- [Stage 9 closeout](stage9-guarded-smart-path-closeout-2026-04-18.md)
  - baseline `4 / 4`
  - guarded `4 / 4`
  - guarded applied `2 / 4`
  - activation matched `4 / 4`
  - false activations `0`
  - missed activations `0`

### Codex side

- [Codex Context Minor GC Live Matrix](codex-context-minor-gc-live-2026-04-18/report.md)
  - baseline passed `4 / 4`
  - minor-gc passed `4 / 4`
  - guarded applied `2`
  - activation matched `4 / 4`
  - false activations `0`
  - missed activations `0`
  - average prompt reduction ratio `0.1469`
  - applied-only prompt reduction ratio `0.2939`
  - applied-only package reduction ratio `0.3553`

## User Interpretation

Closing `Stage 11` does not mean “every path is now default-light.”
It means:

1. `Context Minor GC` is no longer a research-only line that lives inside OpenClaw.
2. The same bounded decision contract now works in both OpenClaw and Codex consumption paths.
3. Users can already see clear benefit on positive cases:
   - OpenClaw harder live matrix average package reduction ratio `0.4657`
   - Codex positive cases reduced prompt size by `0.4355` and `0.1522`
4. Negative cases do not mis-activate, so this is not “shrink at all costs.”

## Explicit Decision

`Stage 11` can now close.

What that means:

- `Context Minor GC` is now a **usable capability**, not a shadow-only research line
- the new bar of “the full GC is usable and the user can feel the gain” is satisfied
- the guarded seam remains `default-off` / opt-in only
- closing `Stage 11` does not justify an implicit default active-path rollout

## What Stage 11 Does Not Include

These are not unfinished `Stage 11` items:

- broader default rollout
- a more aggressive `Stage 0 Router`
- deeper task-state ledger structure
- the next productization pass for ordinary conversation / `memory_intent`

Those belong to a new later stage, not to `Stage 11`.

## Next Stage

After `Stage 11`, the repo moves to:

- `Stage 12: Realtime Memory Intent Productization`

That means:

- keep `Context Minor GC` green
- but shift the next truly new workstream to realtime governed memory intake and its operator surface
