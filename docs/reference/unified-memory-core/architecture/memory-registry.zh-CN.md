# Memory Registry Architecture

[English](memory-registry.md) | [中文](memory-registry.zh-CN.md)

## 目的

`Memory Registry` 是 `Unified Memory Core` 的持久化与生命周期中心。

它负责承接这些层级之间的状态变化：

- source artifacts
- candidate artifacts
- stable artifacts
- superseded / dropped records

## 它负责什么

- artifact storage model
- lifecycle state transitions
- decision trail
- conflict records
- superseded records

## 它不负责什么

- source extraction
- reflection logic
- tool-specific export shapes
- governance report rendering

## 生命周期模型

```mermaid
stateDiagram-v2
    [*] --> source_artifact
    source_artifact --> candidate
    candidate --> stable
    candidate --> observation
    candidate --> dropped
    observation --> stable
    observation --> dropped
    stable --> superseded
    stable --> observation
```

## 主要记录族

1. source artifacts
2. candidate artifacts
3. stable artifacts
4. decision records
5. conflict records
6. superseded records

## 必要字段

每条持久化记录都应该有：

- `record_id`
- `record_type`
- `state`
- `namespace`
- `visibility`
- `evidence_refs`
- `created_at`
- `updated_at`

## Decision Trail

registry 必须保留：

- 为什么这条记录被 promotion
- 为什么它被 reject
- 什么记录替代了它
- 哪个 export version 消费过它

## 依赖规则

- 消费 `Source System` 和 `Reflection System`
- 服务 `Projection System` 和 `Governance System`
- 自身保持 adapter-neutral

## 第一阶段实现边界

第一批实现建议先支持：

1. candidate persistence
2. stable persistence
3. promotion / decay state transitions
4. 基础 conflict tracking

## 完成标准

这个模块进入可开发状态的标准是：

- lifecycle states 已明确
- record families 已明确
- decision trail 已明确
- registry query surfaces 已定义
