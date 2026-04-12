# OpenClaw Adapter Blueprint

[English](openclaw-adapter.md) | [中文](openclaw-adapter.zh-CN.md)

## MVP Shape

- namespace resolver
- export loader
- adapter consumption boundary
- OpenClaw compatibility checks
- local-first multi-agent write rules

## First Outputs

- adapter-side memory package
- retrieval / assembly mapping doc
- compatibility regression fixtures
- shared-workspace-safe loading rules

## Key Risks

- host/runtime coupling leaks
- export contract drift
- legacy path/name confusion
- multi-agent writes polluting governed namespaces
