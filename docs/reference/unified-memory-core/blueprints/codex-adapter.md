# Codex Adapter Blueprint

[English](codex-adapter.md) | [中文](codex-adapter.zh-CN.md)

## MVP Shape

- code-memory namespace resolver
- read-before-task loader
- write-after-task event mapper
- compatibility test fixtures
- local-first multi-runtime write serialization

## First Outputs

- Codex-facing memory package
- write-back event artifact shape
- shared code-memory fixtures
- shared-workspace-safe binding rules

## Key Risks

- weak project binding
- noisy write-back events
- cross-tool namespace pollution
- multiple Codex runtimes racing on one namespace
