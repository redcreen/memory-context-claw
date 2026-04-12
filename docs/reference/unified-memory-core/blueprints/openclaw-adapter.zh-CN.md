# OpenClaw Adapter Blueprint

[English](openclaw-adapter.md) | [中文](openclaw-adapter.zh-CN.md)

## MVP 形态

- namespace resolver
- export loader
- adapter consumption boundary
- OpenClaw compatibility checks
- local-first 的多 agent 写规则

## 第一批产出

- adapter-side memory package
- retrieval / assembly mapping doc
- compatibility regression fixtures
- shared-workspace-safe 的 loading rules

## 关键风险

- host/runtime coupling leaks
- export contract drift
- legacy path/name confusion
- 多 agent 写入污染 governed namespace
