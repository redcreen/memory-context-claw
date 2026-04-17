# Stage 7 / Step 108 Closeout

[English](stage7-step108-context-minor-gc-closeout-2026-04-18.md) | [中文](stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)

## Goal

Close `Stage 7 / Step 108` without modifying OpenClaw core:

- replace the host-bound `runtime.subagent` decision transport
- keep `Context Minor GC` inside the plugin layer
- prove that a real OpenClaw gateway session can emit shadow decisions again

## Implemented

- landed a plugin-owned structured decision runner that supports:
  - inline test runner
  - `codex_exec`
  - legacy `runtime_subagent` fallback
- rewired `Context Minor GC` shadow decisions to use the new runner
- rewired LLM rerank to the same transport surface
- added codex-exec recovery logic:
  - recover structured payloads from `stdout` even when the child process exits with a shell-level failure
  - retry `codex_exec` once with a fresh minimal `CODEX_HOME`
- exposed the new transport / reasoning config in `openclaw.plugin.json`

## Validation

### Code-Level

- `node --check src/codex-structured-runner.js src/structured-decision-runner.js src/dialogue-working-set-runtime-shadow.js src/rerank.js src/engine.js src/config.js`
- `node --test test/codex-structured-runner.test.js test/structured-decision-runner.test.js test/engine-dialogue-working-set-shadow.test.js test/rerank.test.js test/openclaw-plugin-manifest.test.js`
- result: `19 / 19` pass

### Hermetic OpenClaw Gateway

- environment:
  - isolated `OPENCLAW_STATE_DIR`
  - foreground gateway with `OPENCLAW_DISABLE_BONJOUR=1`
  - plugin config: `dialogueWorkingSetShadow.enabled=true`, `transport=codex_exec`, `model=gpt-5.4-mini`
- live soak:
  - `5 / 5` captured
  - relations: `switch`, `resolve`, `resolve`, `resolve`, `continue`
  - average raw reduction ratio: `0.5817`
  - average package reduction ratio: `0.4827`
  - average total elapsed: `18479.2ms`
- local artifact directory:
  - `reports/generated/openclaw-hermetic-context-minor-gc-2026-04-18/`

### Real Local OpenClaw Service

- deployed current repo with `npm run deploy:local`
- restarted the local gateway service and reran live calls through the real service endpoint
- latest service smoke:
  - `3 / 3` captured
  - relations: `continue`, `resolve`, `continue`
  - average reduction ratio: `0.5096`
  - average total elapsed: `20016.7ms`
- local artifact directory:
  - `reports/generated/openclaw-gateway-context-minor-gc-2026-04-18/`

## Decision

`Stage 7 / Step 108` is now closed.

What changed:

- `108.a` completed: the plugin-owned `decision runner` contract exists
- `108.b` completed: the `Context Minor GC` working-set decision transport no longer depends on host `runtime.subagent`
- `108.c` completed: real gateway live soak rerun is green (`5 / 5` captured in hermetic gateway, `3 / 3` captured in local service smoke)
- `108.d` completed: the repository can continue Stage 7 without modifying OpenClaw core

What this does **not** mean:

- Stage 7 as a whole is not fully closed yet
- the next harder eval matrix (`104`) is still open
- Stage 9 remains `default-off` / opt-in only

## Next Boundary

The remaining Stage 7 work is no longer “break the host seam.”
It is now:

1. design and land the next harder eval matrix
2. keep `Context Minor GC` measured through the same operator scorecard
3. only widen guarded experiments after the harder matrix stays green
