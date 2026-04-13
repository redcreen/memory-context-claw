# Isolate Compaction Fallback Test From Host Config

## Context

`release-preflight` regressed even though the product baseline itself was still healthy.

The failing check was:

- `npm test`: `363/364`

The broken test was not exposing a product bug. It was exposing an environment coupling:

- `test/engine.test.js` exercised `ContextAssemblyEngine.compact()`
- that path delegated directly to the OpenClaw runtime compaction helper
- the helper loaded the operator's real `~/.openclaw/openclaw.json`
- a stale local plugin path in that host config made the test fail before the fallback-distillation assertion could finish

That made one repo test depend on the maintainer's personal OpenClaw installation state.

## What Changed

Made compaction delegation injectable instead of hardwired.

Implementation changes:

- added `compactFn` as an optional `ContextAssemblyEngine` constructor dependency
- kept the default behavior unchanged by still defaulting `compactFn` to OpenClaw's `delegateCompactionToRuntime`
- updated the compaction fallback unit test to inject a stubbed compact function and assert both:
  - fallback distillation is scheduled
  - the delegated compaction path is still called once

This keeps production behavior the same while making the unit test independent from host-global config.

## Key Decisions

1. Fix the test seam instead of mutating user-local OpenClaw state during repo tests.
2. Keep `ContextAssemblyEngine` production behavior unchanged by preserving the current default delegation path.
3. Treat this as release-preflight hardening, because a release gate must not fail on unrelated local plugin-path drift.

## Verification

- `node --test test/engine.test.js`
- `npm test -- --test-reporter=spec`
- `npm run umc:release-preflight -- --format json`

Final observed results:

- `node --test test/engine.test.js`: `5/5`
- `npm test -- --test-reporter=spec`: `364/364`
- `npm run umc:release-preflight -- --format json`: `pass`

## Outcome

The compaction fallback regression test now verifies repository behavior instead of operator-specific OpenClaw setup.

`release-preflight` is back to a stable green gate, and later enhancement planning remains correctly gated behind a healthy post-Stage-5 baseline.
