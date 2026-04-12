# Governance System Architecture

[English](governance-system.md) | [中文](governance-system.zh-CN.md)

## 目的

`Governance System` 负责让产品保持：

- 可 review
- 可 repair
- 可 replay
- 有 regression 保护

## 它负责什么

- audit surfaces
- repair flows
- replay flows
- diff / comparison views
- regression ownership

## 它不负责什么

- source ingestion
- candidate extraction
- adapter runtime behavior

## 主要治理能力

1. audit
2. repair
3. replay
4. diff / history
5. regression baselines

## 主流程

```mermaid
flowchart LR
    A["Registry / exports"] --> B["Audit"]
    B --> C["Findings"]
    C --> D["Repair"]
    D --> E["Replay"]
    E --> F["Regression result"]

    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class A,B,C,D,E,F ops;
```

## 必须满足的性质

每个治理动作都应该：

- 可归因
- 可复现
- 可比对 diff
- 默认非破坏性

## 依赖规则

- 消费 `Memory Registry` 和 `Projection System`
- 给 adapters 和产品维护者提供反馈
- 自身不能绑死在某一个 consumer 上

## 第一阶段实现边界

第一批实现建议先支持：

1. audit report shape
2. repair record shape
3. replay run shape
4. regression ownership map

## 完成标准

这个模块进入可开发状态的标准是：

- governance primitives 已明确
- repair 边界已明确
- replay 输入输出已明确
- test ownership 已明确
