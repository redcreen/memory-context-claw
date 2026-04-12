# Close Stage 3 self-learning lifecycle baseline

- Date: 2026-04-12
- Status: resolved

## Problem

The repo already had a real self-learning baseline, but Stage 3 was still open on paper and in behavior. Promotion existed only as a thin baseline. Decay, conflict handling, lifecycle-specific audit/reporting, OpenClaw validation, and a full local governed `observation -> stable` loop were still incomplete as a coherent phase.

## Thinking

This could not be closed by editing roadmap text alone. The missing work crossed several shared modules:

- Reflection needed lifecycle metadata and richer promotion review output.
- Memory Registry needed explicit promotion / decay / conflict / stable-update behavior.
- Governance needed learning-specific audit, repair/replay planning, and time-window comparison.
- Projection and OpenClaw surfaces needed promoted-artifact consumption validation.
- Runtime / CLI needed one end-to-end governed loop instead of forcing operators to compose multiple steps manually.

The durable fix was to converge these into one Stage 3 slice instead of shipping partial improvements in isolation.

## Solution

Implemented the full Stage 3 lifecycle baseline across the shared modules:

- added lifecycle helper rules for signal typing, polarity, promotion review, decay review, conflict comparison, and window summaries
- upgraded reflection outputs with lifecycle metadata and richer promotion recommendations
- upgraded the registry to support explicit candidate observation transitions, learning decay, conflict supersede behavior, and stable-registry update rules
- added learning-specific governance audit, repair/replay, time-window comparison, and OpenClaw consumption validation
- exposed lifecycle support through standalone runtime, CLI, and `scripts/run-learning-lifecycle.js`
- added regression coverage for registry, governance, runtime, and OpenClaw lifecycle paths
- refreshed control-surface and roadmap/dev-plan docs so Stage 3 is marked complete and Stage 4 is the next entry point

## Validation

Validated the Stage 3 closure with:

- focused lifecycle suite: `42/42`
- full repo test suite: `npm test` => `323/323`
- direct lifecycle script run: `node scripts/run-learning-lifecycle.js --registry-dir /tmp/umc-stage3-validation ...`

## Related Files

- src/unified-memory-core/learning-lifecycle.js
- src/unified-memory-core/memory-registry.js
- src/unified-memory-core/governance-system.js
- src/unified-memory-core/standalone-runtime.js
- src/unified-memory-core/openclaw-consumption.js
- scripts/unified-memory-core-cli.js
- scripts/run-learning-lifecycle.js
- docs/reference/unified-memory-core/development-plan.md
- docs/workstreams/self-learning/roadmap.md
