# Unified Memory Core Stage 3-4 Acceptance

[English](stage3-stage4-acceptance.md) | [中文](stage3-stage4-acceptance.zh-CN.md)

这份文档是 Stage 3 和 Stage 4 的长期验收清单，覆盖：

- Stage 3 `Self-Learning lifecycle baseline`
- Stage 4 `Policy Adaptation and multi-consumer use`

当你改了 lifecycle、policy、projection、adapter 或 governance 相关代码时，优先走这里的低人工成本验收流。

## 首选路径

先跑一条一键验收命令：

```bash
npm run umc:acceptance -- --format markdown
```

说明：

- 如果不传 `--registry-dir`，脚本会自动创建隔离的临时 registry。
- 默认样例 source 是 `Remember this: the user prefers concise progress reports.`
- 报告通过，表示 Stage 3 和 Stage 4 的 CLI 面已经是绿的；如果是 release 场景，再补一次 OpenClaw 黑盒 spot check 就够了。

如果你需要固定 namespace 和 registry 便于排查，就用显式参数：

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

脚本入口在 [../../../../scripts/run-stage3-stage4-acceptance.js](../../../../scripts/run-stage3-stage4-acceptance.js)，结构化 CLI 入口在 [../../../../scripts/unified-memory-core-cli.js](../../../../scripts/unified-memory-core-cli.js)。

## 这条验收流会检查什么

| 阶段 | 检查项 | 通过标准 |
| --- | --- | --- |
| Stage 3 | `sources_observed` | 至少 ingest 了一条 source |
| Stage 3 | `stable_learning_promoted` | 至少有一个 learning candidate 被 promote 成 stable |
| Stage 3 | `learning_audit_clean` | learning lifecycle audit 没有 findings |
| Stage 3 | `stable_learning_visible` | namespace 里至少有一个 stable learning artifact |
| Stage 3 | `openclaw_consumes_promoted_learning` | OpenClaw consumption 能看到 promoted artifacts |
| Stage 4 | `policy_audit_clean` | policy adaptation audit 没有 findings |
| Stage 4 | `shared_policy_sources` | shared governed artifacts 确实进入 policy inputs |
| Stage 4 | `policy_exports_present` | `generic`、`openclaw`、`codex` 三个 consumer 都拿到 policy inputs |
| Stage 4 | `rollback_protection_enabled` | 没有 consumer 关闭 rollback protection |
| Stage 4 | `openclaw_policy_context_active` | OpenClaw policy context 已启用，且返回 adapted candidates |
| Stage 4 | `codex_policy_context_active` | Codex policy inputs 和 adapted task memory 都存在 |

## 如果验收报告失败

优先用下面这些更窄的 CLI 命令定位问题，不要先切回重人工测试：

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

## 最少人工工作量

如果 `npm run umc:acceptance` 通过：

1. 如果只是 CLI 级验证，到这里就可以停。
2. 如果是 release 或 runtime rollout，再做一次 OpenClaw 黑盒 spot check。

建议黑盒 prompt：

```text
Give me a concise progress update and keep supporting context compact.
```

预期行为：

- 回复保持简洁
- supporting context 不会膨胀成一堆无关噪声
- governed preferences 和 guardrails 能在行为里体现出来

## 相关文档

- [README.zh-CN.md](README.zh-CN.md)
- [case-matrix.zh-CN.md](case-matrix.zh-CN.md)
- [../../../../docs/test-plan.zh-CN.md](../../../../docs/test-plan.zh-CN.md)
