# Unified Memory Core Maintenance Workflow

[English](maintenance-workflow.md) | [中文](maintenance-workflow.zh-CN.md)

## 目的

这份文档定义了 Stage 5 的定时 maintenance 路径。

目标是在尽量少人工操作的前提下，持续保持 self-learning、policy adaptation 和 governance 可读、可治理。

## 首选命令

```bash
npm run umc:maintenance -- \
  --registry-dir /tmp/umc-maintenance \
  --tenant local \
  --scope workspace \
  --resource unified-memory-core \
  --key maintenance \
  --sources-file /tmp/umc-sources.json \
  --format markdown
```

同一条流也可以直接走结构化 CLI：

```bash
npm run umc:cli -- maintenance run \
  --registry-dir /tmp/umc-maintenance \
  --tenant local \
  --scope workspace \
  --resource unified-memory-core \
  --key maintenance \
  --sources-file /tmp/umc-sources.json \
  --format markdown
```

## 推荐的 Sources File

```json
{
  "declaredSources": [
    {
      "sourceType": "manual",
      "content": "Remember this: the user prefers concise progress reports."
    },
    {
      "sourceType": "file",
      "path": "/tmp/umc-maintenance/notes.md"
    },
    {
      "sourceType": "url",
      "url": "https://example.com/maintenance",
      "content": "Maintenance workflows should stay scriptable and reproducible."
    },
    {
      "sourceType": "image",
      "path": "/tmp/umc-maintenance/signal.png",
      "altText": "Compact terminal-first maintenance diagram."
    }
  ]
}
```

## 这条 Workflow 会产出什么

- 一条针对给定 sources 的 governed maintenance run
- 复用现有 Stage 3-4 loop 的 lifecycle 与 policy evidence
- namespace audit
- 如果出现 findings，就给出 repair / replay suggestion
- 一份 registry topology 快照，方便 operator 后续跟进

## 升级规则

- 如果 maintenance 输出是 `pass`，继续保持 CLI-first。
- 如果 maintenance 输出是 `followup`，优先跑更窄的 audit、repair、replay 命令，不要先切手工排查。
- 如果问题落在 release boundary 或 split readiness，就转到 [testing/stage5-acceptance.zh-CN.md](testing/stage5-acceptance.zh-CN.md)。
