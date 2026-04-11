# Codex Adapter Blueprint

[English](#english) | [中文](#中文)

## English

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

## 中文

## MVP 形态

- code-memory namespace resolver
- read-before-task loader
- write-after-task event mapper
- compatibility test fixtures
- local-first 的多 runtime 写串行化

## 第一批产出

- Codex-facing memory package
- write-back event artifact shape
- shared code-memory fixtures
- shared-workspace-safe 的 binding rules

## 关键风险

- weak project binding
- noisy write-back events
- cross-tool namespace pollution
- 多个 Codex runtime 对同一 namespace 竞争写入
