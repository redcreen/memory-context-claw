# Unified Memory Core Stage 3-4 Acceptance

[English](stage3-stage4-acceptance.md) | [中文](stage3-stage4-acceptance.zh-CN.md)

This page is the durable repo-level operator checklist for:

- Stage 3 `Self-Learning lifecycle baseline`
- Stage 4 `Policy Adaptation and multi-consumer use`

Use it when you need the lowest-human-effort repo acceptance path after lifecycle, policy, projection, adapter, or governance changes.

## Preferred Path

Run the one-command acceptance flow first:

```bash
npm run umc:acceptance -- --format markdown
```

Notes:

- If you omit `--registry-dir`, the script creates an isolated temp registry automatically.
- The default sample source is `Remember this: the user prefers concise progress reports.`
- A passing report means the Stage 3 and Stage 4 repo CLI surfaces are green.
- For host-level OpenClaw integration, run [openclaw-cli-integration.md](openclaw-cli-integration.md) next.

Use an explicit namespace and registry when you want reproducible local inspection:

```bash
npm run umc:acceptance -- \
  --registry-dir /tmp/umc-stage34-acceptance \
  --tenant local \
  --scope workspace \
  --resource unified-memory-core \
  --key stage34-acceptance \
  --source-type manual \
  --content "Remember this: the user prefers concise progress reports." \
  --query "summarize the current governed policy" \
  --task-prompt "apply current governed coding policy" \
  --format markdown
```

The implementation lives in [../../../../scripts/run-stage3-stage4-acceptance.js](../../../../scripts/run-stage3-stage4-acceptance.js) and the structured CLI surface lives in [../../../../scripts/unified-memory-core-cli.js](../../../../scripts/unified-memory-core-cli.js).

## What The Acceptance Flow Checks

| Phase | Check | Pass Rule |
| --- | --- | --- |
| Stage 3 | `sources_observed` | at least one source was ingested |
| Stage 3 | `stable_learning_promoted` | at least one learning candidate was promoted to stable |
| Stage 3 | `learning_audit_clean` | learning lifecycle audit has zero findings |
| Stage 3 | `stable_learning_visible` | at least one stable learning artifact is visible in the namespace |
| Stage 3 | `openclaw_consumes_promoted_learning` | OpenClaw consumption sees promoted artifacts |
| Stage 4 | `policy_audit_clean` | policy adaptation audit has zero findings |
| Stage 4 | `shared_policy_sources` | shared governed artifacts feed policy inputs |
| Stage 4 | `policy_exports_present` | `generic`, `openclaw`, and `codex` all receive policy inputs |
| Stage 4 | `rollback_protection_enabled` | no consumer has rollback disabled |
| Stage 4 | `openclaw_policy_context_active` | OpenClaw policy context is enabled and returns adapted candidates |
| Stage 4 | `codex_policy_context_active` | Codex policy inputs and adapted task memory are both present |

## If The Acceptance Report Fails

Use the narrower CLI commands below to isolate the failing layer without switching to heavy manual testing:

```bash
npm run umc:lifecycle -- \
  --registry-dir /tmp/umc-stage34-acceptance \
  --tenant local \
  --scope workspace \
  --resource unified-memory-core \
  --key stage34-acceptance \
  --source-type manual \
  --content "Remember this: the user prefers concise progress reports."
```

```bash
npm run umc:cli -- govern audit-learning \
  --registry-dir /tmp/umc-stage34-acceptance \
  --tenant local \
  --scope workspace \
  --resource unified-memory-core \
  --key stage34-acceptance \
  --format markdown
```

```bash
npm run umc:policy-loop -- \
  --registry-dir /tmp/umc-stage34-acceptance \
  --tenant local \
  --scope workspace \
  --resource unified-memory-core \
  --key stage34-acceptance \
  --source-type manual \
  --content "Remember this: the user prefers concise progress reports." \
  --format markdown
```

```bash
npm run umc:cli -- govern audit-policy \
  --registry-dir /tmp/umc-stage34-acceptance \
  --tenant local \
  --scope workspace \
  --resource unified-memory-core \
  --key stage34-acceptance \
  --format markdown
```

```bash
npm run umc:cli -- export inspect \
  --registry-dir /tmp/umc-stage34-acceptance \
  --tenant local \
  --scope workspace \
  --resource unified-memory-core \
  --key stage34-acceptance \
  --consumer openclaw \
  --format markdown
```

```bash
npm run umc:cli -- export inspect \
  --registry-dir /tmp/umc-stage34-acceptance \
  --tenant local \
  --scope workspace \
  --resource unified-memory-core \
  --key stage34-acceptance \
  --consumer codex \
  --format markdown
```

## Host Integration Next

After `npm run umc:acceptance` passes, the preferred host-level follow-up is:

```bash
npm run umc:openclaw-itest -- --format markdown
```

That OpenClaw CLI smoke replaces most of the old manual host verification work.

## Minimal Human Work

If `npm run umc:acceptance` passes:

1. For repo acceptance only, stop there.
2. For real host integration, run `npm run umc:openclaw-itest -- --format markdown`.
3. Only if you still want extra UI confidence, do one OpenClaw black-box spot check against the real plugin/runtime.

Recommended black-box prompt:

```text
Give me a concise progress update and keep supporting context compact.
```

Expected behavior:

- the reply stays concise
- supporting context does not expand into noisy irrelevant items
- governed preferences and guardrails remain visible in behavior

## Related Docs

- [README.md](README.md)
- [case-matrix.md](case-matrix.md)
- [openclaw-cli-integration.md](openclaw-cli-integration.md)
- [../../../../docs/test-plan.md](../../../../docs/test-plan.md)
