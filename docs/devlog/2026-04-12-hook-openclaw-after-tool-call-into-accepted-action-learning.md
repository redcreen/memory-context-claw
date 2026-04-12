# Hook OpenClaw after_tool_call into accepted-action learning

## Problem

`accepted_action` intake, CLI coverage, and Step 47 field-aware extraction were already implemented, but OpenClaw still lacked a real runtime/task emission seam.

That meant:

- Codex could emit accepted-action evidence from `writeAfterTask(...)`
- CLI could simulate the loop directly
- but OpenClaw host execution still had no automatic path into the same governed intake surface

The gap was not in reflection or governance anymore. It was in adapter-side event emission.

## Decision

Use OpenClaw's async `after_tool_call` hook as the write-side boundary.

Do not use:

- sync `tool_result_persist` for registry writes
- implicit inference from arbitrary successful tool results

Only emit accepted-action evidence when a tool result includes an explicit structured payload:

- `result.accepted_action`
- `result.acceptedAction`

This keeps the integration generic without silently reopening deeper admission or conflict policy.

## What Changed

- added `openclawAdapter.acceptedActions` config with explicit enable/visibility control
- added `src/plugin/accepted-action-hook.js`
  - resolves OpenClaw namespace targeting
  - normalizes structured accepted-action payloads from async tool results
  - persists source artifacts
  - runs reflection with candidate persistence
  - promotes only recommended outputs
- updated `src/plugin/index.js` to register an async `after_tool_call` hook
- kept the write-side boundary explicit:
  - Codex runtime emission stays in `writeAfterTask(...)`
  - OpenClaw runtime emission now lives in async `after_tool_call`
  - both converge on the same governed accepted-action intake surface
- updated architecture, roadmap, configuration, and development-plan docs so the runtime hook boundary is durable and operator-visible

## Verification

- targeted regression:
  - `node --test test/openclaw-plugin-accepted-action.test.js test/openclaw-adapter.test.js test/codex-adapter.test.js test/plugin-self-learning.test.js test/adapter-compatibility.test.js`
- full repo:
  - `npm test`
- full verification gate:
  - `npm run verify`

Key results:

- OpenClaw plugin now registers an async `after_tool_call` hook for accepted-action capture
- structured OpenClaw tool results now enter the governed loop and promote only reusable targets
- non-structured successful tool results are ignored
- full repo tests passed: `363/363`
- `npm run verify` passed
- local deployment was refreshed with `npm run deploy:local`
- deployed-host simulation proved the OpenClaw hook runtime writes one accepted-action source, keeps one stable `target_fact`, and stores it under `demo-workspace.agent.code`
