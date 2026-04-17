# Stage 9 Closeout

[English](stage9-guarded-smart-path-closeout-2026-04-18.md) | [中文](stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md)

## Goal

Close `Stage 9. Guarded Smart-Path Promotion` **without modifying OpenClaw core** and while keeping the feature `default-off` / opt-in only:

- prove the guarded path is more than an offline answer A/B artifact
- prove real OpenClaw CLI live runs activate on positive cases and stay off on negative cases
- prove rollback remains clean and the feature does not drift into the default path

## What Landed

- a hermetic OpenClaw live A/B entrypoint:
  - [scripts/eval-openclaw-guarded-live-ab.js](../../scripts/eval-openclaw-guarded-live-ab.js)
  - [evals/openclaw-guarded-live-ab-cases.js](../../evals/openclaw-guarded-live-ab-cases.js)
- the comparison surface is now fixed to two modes:
  - `baseline`: current UMC path with `dialogueWorkingSetShadow=false` and `dialogueWorkingSetGuarded=false`
  - `guarded`: `dialogueWorkingSetShadow=true` plus `dialogueWorkingSetGuarded=true`
- unrelated learning / write-path effects are turned off so the comparison stays focused on the context path
- the repo was also redeployed to the local OpenClaw host and the plugin inspect path stays healthy

## Validation

### Code-Level

- `node --check scripts/eval-openclaw-guarded-live-ab.js`
- `node --test test/openclaw-guarded-live-ab-cases.test.js test/openclaw-plugin-manifest.test.js test/structured-decision-runner.test.js test/codex-structured-runner.test.js test/engine-dialogue-working-set-shadow.test.js test/rerank.test.js`
- Result: `22 / 22` pass

### Real OpenClaw CLI Live A/B

Report entry:

- [OpenClaw Guarded Live A/B](openclaw-guarded-live-ab-2026-04-18.md)

Headline result:

- baseline `4 / 4`
- guarded `4 / 4`
- guarded applied `2 / 4`
- activation matched `4 / 4`
- false activations `0`
- missed activations `0`
- average prompt reduction ratio `0.0306`
- average applied-only prompt reduction ratio `0.0067`
- average applied-only raw reduction ratio `0.7422`

Interpretation:

- both positive cases activated the guarded path for real:
  - `guarded-live-language-after-code-detour`
  - `guarded-live-style-pin-survives-detour`
- both negative cases stayed off:
  - `guarded-live-branch-negative`
  - `guarded-live-continue-negative`
- the positive cases kept correct final answers while still reducing live `promptTokens` slightly
- the negative cases still show some run-to-run prompt-token noise because they are separate real agent conversations, but guarded activation itself stayed at `0` false triggers

### Local Host Sync

- `npm run deploy:local`
- `openclaw plugins inspect unified-memory-core --json`
- Result: the host is loading `0.2.1`, and the guarded/shadow config schema plus UI hints are present

## Decision

`Stage 9` can now close.

More precisely:

- the guarded smart path is now a **real-host observable narrow gain**
- it remains a **very narrow, default-off, opt-in only** surface
- this closeout does **not** mean “ship by default”; it means the bounded rollout / rollback contract is now real

The stage-exit criteria are now satisfied:

1. context optimization is no longer shadow telemetry only
2. the guarded experiment seam has a real live A/B surface, with activation matched `4 / 4`
3. rollout / rollback boundaries stay explicit
4. the feature has not drifted into the default path
5. the OpenClaw live runtime seam is no longer the blocker

## Next Boundary

With Stage 9 closed, the remaining mainline is:

1. finish `Stage 7 / 104` (the harder eval matrix)
2. rerun `Context Minor GC` on the same operator scorecard
3. do not widen the guarded opt-in surface until `104` is done
