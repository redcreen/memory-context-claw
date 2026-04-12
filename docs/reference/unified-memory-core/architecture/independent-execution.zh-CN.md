# Independent Execution Architecture

[English](independent-execution.md) | [中文](independent-execution.zh-CN.md)

## 目的

`Independent Execution` 用来定义 `Unified Memory Core` 如何在结构上真正具备“独立产品执行”条件。

它主要关注：

- adapter / core ownership clarity
- repo split readiness
- release boundary clarity
- 长期执行时不再被 plugin-first 口径绑住

相关文档：

- [../repo-layout.md](../repo-layout.md)
- [../development-plan.md](../development-plan.md)
- [../ownership-map.md](../ownership-map.md)
- [../release-boundary.md](../release-boundary.md)
- [../migration-checklist.md](../migration-checklist.md)
- [../../unified-memory-core-architecture.md](../../unified-memory-core-architecture.md)

## 它负责什么

- split-readiness criteria
- repo ownership boundary
- product-vs-adapter release boundary
- migration path documentation

## 它不负责什么

- 第一天就实现 runtime API
- adapter 专属 runtime logic
- source / registry / projection internals

## 核心目标

把“独立出来”这件事收成：

`未来的执行选择，而不是一次架构重写`

## 就绪模型

```mermaid
flowchart LR
    A["One Repo\n孵化"] --> B["Clear Ownership"]
    B --> C["Portable Contracts"]
    C --> D["Standalone Operations"]
    D --> E["Independent Release Boundary"]
    E --> F["Optional Repo Split"]

    classDef stage fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class A,B,C,D,E,F stage;
```

## 必须满足的就绪信号

1. contracts 不是 adapter 私有约定
2. artifacts 可移植
3. standalone operations 可用
4. adapter boundaries 显式
5. 文档把 split path 讲清楚

## 第一阶段实现边界

第一批实现建议先支持：

1. split-readiness checklist
2. ownership map
3. release-boundary note
4. migration checklist draft

## 完成标准

这个模块进入可开发状态的标准是：

- core / adapters ownership 已明确
- split-readiness criteria 已明确
- release planning assumptions 已明确
- repo layout 已体现未来产品形态
