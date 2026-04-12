# Unified Memory Core Maintenance Workflow

[English](maintenance-workflow.md) | [中文](maintenance-workflow.zh-CN.md)

## Purpose

This page defines the scheduled-job-friendly maintenance path for Stage 5.

The goal is to keep self-learning, policy adaptation, and governance readable without heavy manual work.

## Preferred Command

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

The same flow is available directly through the structured CLI:

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

## Suggested Sources File

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

## What The Workflow Produces

- one governed maintenance run over the provided sources
- lifecycle and policy evidence through the existing Stage 3-4 loop
- namespace audit
- repair and replay suggestions when findings appear
- registry topology snapshot for operator follow-up

## Escalation Rule

- If maintenance output is `pass`, stay in CLI-first mode.
- If maintenance output is `followup`, run the narrower audit, repair, or replay commands before any manual debugging.
- If the failure is about release boundary or split readiness, switch to [testing/stage5-acceptance.md](testing/stage5-acceptance.md).
