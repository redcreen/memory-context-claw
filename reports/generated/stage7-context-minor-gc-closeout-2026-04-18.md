# Stage 7 `Context Minor GC` Closeout

[English](stage7-context-minor-gc-closeout-2026-04-18.md) | [中文](stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md)

## Goal

Formally close Stage 7 `Context Minor GC / context loading optimization`:

- move beyond Stage 6 shadow measurement alone
- prove on one operator scorecard that lighter context packages do not damage answer quality
- align Docker / hermetic / local evidence behind one closeout decision

## New Evidence In This Round

- harder live matrix:
  - [openclaw-context-minor-gc-live-2026-04-17.md](openclaw-context-minor-gc-live-2026-04-17.md)
- Step 108 closeout:
  - [stage7-step108-context-minor-gc-closeout-2026-04-18.md](stage7-step108-context-minor-gc-closeout-2026-04-18.md)
- Stage 7 shadow replay:
  - [dialogue-working-set-stage7-shadow-2026-04-17.md](dialogue-working-set-stage7-shadow-2026-04-17.md)
- Stage 7 scorecard:
  - [dialogue-working-set-scorecard-2026-04-17.md](dialogue-working-set-scorecard-2026-04-17.md)

## Closeout Evidence

### Existing baseline

- Stage 7 shadow replay: `15 / 16`
- Stage 7 scorecard: captured `16 / 16`
- average raw reduction ratio: `0.4191`
- average package reduction ratio: `0.1151`
- Step 108 hermetic gateway: `5 / 5` captured
- Step 108 real local service smoke: `3 / 3` captured

### Harder live matrix in this round

- total: `6`
- captured: `6 / 6`
- answerPassed: `6 / 6`
- relationPassed: `6 / 6`
- reductionPassed: `6 / 6`
- passed: `6 / 6`
- averagePromptTokens: `13126`
- averageDurationMs: `33616`
- averageRawReductionRatio: `0.5794`
- averagePackageReductionRatio: `0.3643`
- relationCounts: `switch = 5`, `continue = 1`

The harder case classes now covered are:

- `cross-source`
- `conflict / current-state override`
- `multi-step history`
- `open-loop return`
- denser natural-Chinese multi-topic switching

## Decision

Stage 7 can now be formally closed.

This closeout means:

1. `Context Minor GC` is no longer just “some shadow telemetry”; it now has a formal operator scorecard.
2. The plugin-owned decision runner is sufficient for hermetic and local live evidence; OpenClaw core changes are not required.
3. The harder live matrix now shows that lighter context packages still preserve answer quality on harder case classes.

## Next Boundary

From here, the repo should stop treating “is Stage 7 really stable?” as the first question.

The next mainline becomes Stage 10:

1. shorten install / bootstrap / verify
2. pull package / startup / first-run cost into the `light and fast` evidence surface
3. strengthen product proof for Codex / multi-instance shared foundation
