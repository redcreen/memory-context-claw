# Test Plan

[English](test-plan.md) | [中文](test-plan.zh-CN.md)

## Scope and Risk

This repo needs to protect five broad surfaces:

- artifact contracts and namespace correctness
- module behavior across source, reflection, registry, projection, and governance
- adapter compatibility for OpenClaw and Codex
- standalone CLI and independent-execution surfaces
- memory-search and learning-governance regression quality

The highest practical risk is not simple pass/fail breakage. It is quality drift: polluted supporting context, unstable promotion rules, or adapter behavior that still passes tests while degrading user-facing recall quality.

## Acceptance Cases

| Case | Setup | Action | Expected Result |
| --- | --- | --- | --- |
| Plugin installs and loads | stable or local install | run `openclaw plugins list` | `unified-memory-core` appears in loaded plugins |
| Core artifact loop works | repo with workspace memory files | run core tests | source, candidate, stable, and export artifacts stay valid |
| OpenClaw adapter stays usable | repo plus adapter smoke inputs | run `npm run smoke:eval` | smoke surfaces stay green and context remains readable |
| Promotion recommendations stay conservative | repo plus new memory-search cases | run `npm run eval:smoke-promotion` | promotion suggestions do not make smoke brittle |
| Governance remains repairable | repo with governance fixtures | run targeted governance tests and CLI paths | audit, repair, replay, and export inspect remain available |

Detailed case inventory lives in [unified-memory-core/testing/case-matrix.md](reference/unified-memory-core/testing/case-matrix.md).

Preferred Stage 3-4 operator checklist lives in [unified-memory-core/testing/stage3-stage4-acceptance.md](reference/unified-memory-core/testing/stage3-stage4-acceptance.md).

Preferred Stage 5 operator checklist lives in [unified-memory-core/testing/stage5-acceptance.md](reference/unified-memory-core/testing/stage5-acceptance.md).

OpenClaw host-level integration smoke lives in [unified-memory-core/testing/openclaw-cli-integration.md](reference/unified-memory-core/testing/openclaw-cli-integration.md).

OpenClaw release bundle installation is documented in [unified-memory-core/testing/openclaw-bundle-install.md](reference/unified-memory-core/testing/openclaw-bundle-install.md).

The one-command CLI gate that should leave only human acceptance is documented in [unified-memory-core/testing/release-preflight.md](reference/unified-memory-core/testing/release-preflight.md).

## Automation Coverage

Primary automated surfaces:

- `npm run umc:acceptance`
- `npm run umc:stage5`
- `npm run umc:openclaw-itest`
- `npm run umc:build-bundle`
- `npm run umc:openclaw-install-verify`
- `npm run umc:release-preflight`
- `npm test`
- `npm run smoke:eval`
- `npm run eval:smoke-promotion`
- targeted test suites under [../test/unified-memory-core](../test/unified-memory-core)
- adapter integration tests under [../test/openclaw-adapter.test.js](../test/openclaw-adapter.test.js), [../test/codex-adapter.test.js](../test/codex-adapter.test.js), and [../test/adapter-compatibility.test.js](../test/adapter-compatibility.test.js)

Detailed testing stack:

- [unified-memory-core/testing/README.md](reference/unified-memory-core/testing/README.md)
- [unified-memory-core/testing/case-matrix.md](reference/unified-memory-core/testing/case-matrix.md)
- [unified-memory-core/testing/stage3-stage4-acceptance.md](reference/unified-memory-core/testing/stage3-stage4-acceptance.md)
- [unified-memory-core/testing/stage5-acceptance.md](reference/unified-memory-core/testing/stage5-acceptance.md)
- [unified-memory-core/testing/openclaw-cli-integration.md](reference/unified-memory-core/testing/openclaw-cli-integration.md)
- [unified-memory-core/testing/openclaw-bundle-install.md](reference/unified-memory-core/testing/openclaw-bundle-install.md)
- [unified-memory-core/testing/release-preflight.md](reference/unified-memory-core/testing/release-preflight.md)

## Manual Checks

- prefer `npm run umc:acceptance` before any Stage 3-4 manual validation
- prefer `npm run umc:stage5` before any Stage 5 manual validation
- prefer `npm run umc:openclaw-itest` before any host-level OpenClaw manual validation
- prefer `npm run umc:release-preflight -- --format markdown` when you want deployment validation and CLI evidence in one run
- install the plugin from a release tag and verify it loads in OpenClaw; after preflight passes, this becomes a human sanity check instead of another operator checklist
- inspect recalled context quality, not only raw test pass/fail
- confirm stable facts and rules improve recall without adding noisy supporting context
- confirm governance reports are still readable enough to drive promotion decisions
- confirm `.codex/status.md` and `.codex/module-dashboard.md` still match the actual execution focus

## Test Data and Fixtures

Important fixtures and references:

- `workspace/MEMORY.md`
- `workspace/memory/*.md`
- `workspace/notes/*.md`
- governance reports under `reports/`
- module-specific tests under `test/unified-memory-core/`

## Release Gate

Before tagging a stable release, run:

```bash
npm run umc:acceptance -- --format markdown
npm run umc:stage5 -- --format markdown
npm run umc:openclaw-itest -- --format markdown
npm run umc:openclaw-install-verify -- --format markdown
npm run umc:release-preflight -- --format markdown
npm test
npm run smoke:eval
npm run eval:smoke-promotion
```

Then confirm:

- README and docs landing still route users correctly
- release install examples still point at the intended tag
- control-surface docs still describe the real active module and current slice
- no new regression work is being hidden in `todo.md` or reports
