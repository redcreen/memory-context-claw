# Unified Memory Core Repo Layout

[English](repo-layout.md) | [中文](repo-layout.zh-CN.md)

## Goal

This document records the future-facing repository structure for incubating `Unified Memory Core` in the current repo.

## Recommended Shape

```text
.
├── README.md
├── unified-memory-core.md
├── unified-memory-core-architecture.md
├── unified-memory-core-roadmap.md
├── code-memory-binding-architecture.md
├── docs/
│   └── unified-memory-core/
│       ├── repo-layout.md
│       ├── deployment-topology.md
│       ├── architecture/
│       ├── roadmaps/
│       ├── blueprints/
│       ├── todo/
│       └── testing/
├── src/
│   ├── adapters/
│   └── unified-memory-core/
├── scripts/
│   ├── adapters/
│   └── unified-memory-core/
├── test/
│   ├── adapters/
│   └── unified-memory-core/
└── evals/
    ├── adapters/
    └── unified-memory-core/
```
