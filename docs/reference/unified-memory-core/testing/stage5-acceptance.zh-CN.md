# Unified Memory Core Stage 5 Acceptance

[English](stage5-acceptance.md) | [中文](stage5-acceptance.zh-CN.md)

这份文档是 `Stage 5 product hardening` 的长期 operator 验收入口。

适用场景：

- standalone source adapters 加固
- 定时 maintenance workflow
- export reproducibility
- release-boundary validation
- split rehearsal

## 首选路径

先跑这一条一键验收：

```bash
npm run umc:stage5 -- --format markdown
```

说明：

- 如果不传 `--registry-dir`，脚本会自动创建隔离临时 registry。
- 脚本会自动创建隔离的 `file`、`directory`、`url`、`image` fixture。
- 通过后表示 Stage 3-4 回归、Stage 5 hardening 和 split-readiness 检查都在 repo 层通过。
- 如果要做发版前的 host-level 信心检查，再跑 [openclaw-cli-integration.zh-CN.md](openclaw-cli-integration.zh-CN.md)。
- 如果要把“真实安装 + 完整 CLI 验证”一次性收口，再跑 [release-preflight.zh-CN.md](release-preflight.zh-CN.md)。

如果你想复用自己的 fixture，用结构化 CLI：

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

实现入口在 [../../../../scripts/run-stage5-acceptance.js](../../../../scripts/run-stage5-acceptance.js)，结构化 CLI 入口在 [../../../../scripts/unified-memory-core-cli.js](../../../../scripts/unified-memory-core-cli.js)。

## 验收流会检查什么

| 阶段 | 检查项 | 通过标准 |
| --- | --- | --- |
| Stage 5 | `stage34_regression_passes` | Stage 3-4 acceptance 继续保持绿色 |
| Stage 5 | `source_adapter_coverage` | `file`、`directory`、`url`、`image` 四类 source 都被覆盖 |
| Stage 5 | `maintenance_workflow_clean` | 定时 maintenance workflow 没有 follow-up findings |
| Stage 5 | `reproducibility_clean` | 重复构建 `generic`、`openclaw`、`codex` export 时 fingerprint 保持稳定 |
| Stage 5 | `release_boundary_ready` | independent execution 和 release-boundary 检查没有 readiness issue |
| Stage 5 | `split_rehearsal_ready` | repo split rehearsal 和 registry migration dry-run 可 review |

## 缩小范围排查

如果 `npm run umc:stage5` 失败，优先用下面这些 CLI 来定位：

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

## 最少人工工作量

如果 `npm run umc:stage5` 已通过：

1. repo 验收到这里就可以结束。
2. 如果是发版前检查，再跑 `npm run umc:openclaw-itest -- --format markdown`。
3. 如果要做到“只等人类验收”，再跑 `npm run umc:release-preflight -- --format markdown`。
4. 只有你还想补 UI 信心时，才再做一次真实 OpenClaw 黑盒 spot check。

## 相关文档

- [README.zh-CN.md](README.zh-CN.md)
- [stage3-stage4-acceptance.zh-CN.md](stage3-stage4-acceptance.zh-CN.md)
- [openclaw-cli-integration.zh-CN.md](openclaw-cli-integration.zh-CN.md)
- [openclaw-bundle-install.zh-CN.md](openclaw-bundle-install.zh-CN.md)
- [release-preflight.zh-CN.md](release-preflight.zh-CN.md)
- [../maintenance-workflow.zh-CN.md](../maintenance-workflow.zh-CN.md)
- [../runtime-api-prerequisites.zh-CN.md](../runtime-api-prerequisites.zh-CN.md)
- [../../../../docs/test-plan.zh-CN.md](../../../../docs/test-plan.zh-CN.md)
