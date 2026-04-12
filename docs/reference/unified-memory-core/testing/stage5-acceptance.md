# Unified Memory Core Stage 5 Acceptance

[English](stage5-acceptance.md) | [中文](stage5-acceptance.zh-CN.md)

This page is the durable repo-level operator checklist for `Stage 5 product hardening`.

Use it when you need one CLI-first acceptance path for:

- hardened standalone source adapters
- scheduled maintenance workflow
- export reproducibility
- release-boundary validation
- split rehearsal

## Preferred Path

Run the one-command acceptance flow first:

```bash
npm run umc:stage5 -- --format markdown
```

Notes:

- If you omit `--registry-dir`, the script creates an isolated temp registry automatically.
- The script also creates isolated `file`, `directory`, `url`, and `image` fixtures automatically.
- A passing report means Stage 3-4 regression, Stage 5 hardening, and split-readiness checks are all green at repo level.
- For host-level confidence before release, run [openclaw-cli-integration.md](openclaw-cli-integration.md) next.
- If you want to close real installation plus full CLI validation in one pass, run [release-preflight.md](release-preflight.md) next.

Use the structured CLI path when you want explicit source control and reusable fixtures:

```bash
npm run umc:cli -- verify stage5 \
  --registry-dir /tmp/umc-stage5-acceptance \
  --tenant local \
  --scope workspace \
  --resource unified-memory-core \
  --key stage5-acceptance \
  --sources-file /tmp/umc-stage5-sources.json \
  --format markdown
```

The implementation lives in [../../../../scripts/run-stage5-acceptance.js](../../../../scripts/run-stage5-acceptance.js), and the structured CLI surface lives in [../../../../scripts/unified-memory-core-cli.js](../../../../scripts/unified-memory-core-cli.js).

## What The Acceptance Flow Checks

| Phase | Check | Pass Rule |
| --- | --- | --- |
| Stage 5 | `stage34_regression_passes` | Stage 3-4 acceptance stays green |
| Stage 5 | `source_adapter_coverage` | `file`, `directory`, `url`, and `image` sources are all exercised |
| Stage 5 | `maintenance_workflow_clean` | scheduled maintenance workflow reports no follow-up findings |
| Stage 5 | `reproducibility_clean` | repeated `generic`, `openclaw`, and `codex` exports stay fingerprint-stable |
| Stage 5 | `release_boundary_ready` | independent execution and release-boundary checks report zero readiness issues |
| Stage 5 | `split_rehearsal_ready` | repo split rehearsal and registry migration dry-run remain reviewable |

## Narrower Commands

If `npm run umc:stage5` fails, isolate the failing layer with these narrower CLI paths:

```bash
npm run umc:cli -- maintenance run \
  --registry-dir /tmp/umc-stage5-acceptance \
  --tenant local \
  --scope workspace \
  --resource unified-memory-core \
  --key stage5-acceptance \
  --sources-file /tmp/umc-stage5-sources.json \
  --format markdown
```

```bash
npm run umc:cli -- export reproducibility \
  --registry-dir /tmp/umc-stage5-acceptance \
  --tenant local \
  --scope workspace \
  --resource unified-memory-core \
  --key stage5-acceptance \
  --format markdown
```

```bash
npm run umc:cli -- review independent-execution --repo-root . --format markdown
```

```bash
npm run umc:cli -- review split-rehearsal \
  --registry-dir /tmp/umc-stage5-acceptance \
  --source-dir /tmp/umc-stage5-acceptance \
  --target-dir /tmp/umc-stage5-split \
  --format markdown
```

## Minimal Human Work

If `npm run umc:stage5` passes:

1. For repo acceptance, stop there.
2. For release preparation, run `npm run umc:openclaw-itest -- --format markdown`.
3. If you want the repo to stop at “only human acceptance remains”, run `npm run umc:release-preflight -- --format markdown`.
4. Only if you still want extra UI confidence, do one real OpenClaw black-box spot check.

## Related Docs

- [README.md](README.md)
- [stage3-stage4-acceptance.md](stage3-stage4-acceptance.md)
- [openclaw-cli-integration.md](openclaw-cli-integration.md)
- [openclaw-bundle-install.md](openclaw-bundle-install.md)
- [release-preflight.md](release-preflight.md)
- [../maintenance-workflow.md](../maintenance-workflow.md)
- [../runtime-api-prerequisites.md](../runtime-api-prerequisites.md)
- [../../../../docs/test-plan.md](../../../../docs/test-plan.md)
