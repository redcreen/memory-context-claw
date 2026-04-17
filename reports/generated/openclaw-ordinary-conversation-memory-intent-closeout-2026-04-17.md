# OpenClaw Ordinary-Conversation Strict Closeout

- generatedAt: `2026-04-17T19:48:33.800Z`
- basis:
  - last full strict `40`-case sweep: [openclaw-ordinary-conversation-memory-intent-ab-2026-04-17.md](openclaw-ordinary-conversation-memory-intent-ab-2026-04-17.md)
  - targeted strict rerun on the last remaining shared-fail
- executionEnvironment: `docker`
- runnerMode: `gateway-steady`

## Why This Closeout Exists

The last full strict Docker sweep on `2026-04-17` established the official hermetic baseline at:

- current: `39 / 40`
- legacy: `15 / 40`
- `UMC-only = 24`
- `legacy-only = 0`
- `both-fail = 1`

That full sweep had exactly one residual shared-fail:

- `ordinary-ab-en-tool-notion-1`

This report exists to close that last residual failure without pretending a `1`-case rerun is itself a new `40`-case full sweep.

## Last Residual Shared-Fail

### ordinary-ab-en-tool-notion-1

- category: `tool_routing_preference`
- design question:
  `A user defines a durable Notion-export routing rule with a tag; recall should preserve that tag.`
- capture:
  `Going forward, whenever I send a Notion export package, use parse_notion_export first and tag the result copper-notion. Remember this default workflow.`
- recall:
  `Based only on your memory for this agent, what tag should you use after handling one of my Notion export packages? If memory is missing, reply exactly: I don't know based on current memory.`

### Full-Sweep Result Before Fix

- builtin actual: `I don't know based on current memory.`
- memory core actual: `I don't know based on current memory.`
- outcome: `both_fail`

### Strict Targeted Rerun After Fix

- builtin actual: `I don't know based on current memory.`
- memory core actual: `copper-notion`
- outcome: `umc_only`
- isolation:
  - `preCaseResetFailed = 0`
  - `cleanupFailed = 0`
  - `sessionClearFailed = 0`

## What Changed

The fix did not change the Docker isolation model.

It changed the ordinary-conversation summary shape for tag-bearing tool-routing memories so the stored memory becomes more answer-friendly for later recall:

- before: generic tag/routing phrasing
- after: explicit `Default tag for <trigger>: <tag>` phrasing plus the routing instruction

That was enough to flip the last residual shared-fail under the same strict Docker method.

## Effective Closeout State

After applying the targeted strict rerun to the only remaining unresolved shared-fail from the official full sweep, the effective closeout state for the strict `40`-case matrix is:

- current: `40 / 40`
- legacy: `15 / 40`
- `both-pass = 15`
- `UMC-only = 25`
- `legacy-only = 0`
- `both-fail = 0`

## Interpretation

- The official full strict sweep remains the primary hermetic baseline surface.
- The targeted rerun here is not presented as a replacement `40`-case sweep.
- It is presented as a strict same-method closeout for the single remaining unresolved shared-fail.
- After that closeout, Unified Memory Core no longer has unresolved failures on the official `40`-case ordinary-conversation strict matrix.
