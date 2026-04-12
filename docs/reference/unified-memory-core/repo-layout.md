# Unified Memory Core Repo Layout

[English](repo-layout.md) | [中文](repo-layout.zh-CN.md)

## Goal

This document records the future-facing repository structure for incubating `Unified Memory Core` in the current repo.

## Recommended Shape

```text
.
├── README.md
├── README.zh-CN.md
├── release.md
├── RELEASE.zh-CN.md
├── .codex/
├── docs/
│   ├── README.md
│   ├── architecture.md
│   ├── roadmap.md
│   ├── test-plan.md
│   ├── module-map.md
│   ├── reference/
│   │   └── unified-memory-core/
│   ├── workstreams/
│   ├── devlog/
│   └── archive/
├── src/
│   ├── unified-memory-core/
│   └── ...
├── scripts/
│   ├── unified-memory-core/
│   └── ...
├── test/
│   └── unified-memory-core/
├── evals/
└── reports/
```
