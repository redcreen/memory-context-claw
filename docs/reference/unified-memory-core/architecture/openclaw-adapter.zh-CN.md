# OpenClaw Adapter Architecture

[English](openclaw-adapter.md) | [中文](openclaw-adapter.zh-CN.md)

## 目的

`OpenClaw Adapter` 负责把 `Unified Memory Core` 的 exports 接进 OpenClaw 的 retrieval 和 context assembly。

它是下面两层之间的边界：

- 产品级共享记忆
- OpenClaw 专属运行时行为

相关文档：

- [../deployment-topology.md](../deployment-topology.md)
- [../../code-memory-binding-architecture.md](../../code-memory-binding-architecture.md)

## 它负责什么

- OpenClaw namespace mapping
- OpenClaw export consumption
- OpenClaw-specific retrieval / assembly hooks
- OpenClaw accepted-action runtime hook
- adapter-side compatibility rules
- OpenClaw 多 agent 运行时协调规则

## 它不负责什么

- shared artifact truth
- source ingestion
- generic export building

## 核心职责

1. 把 OpenClaw session 映射到产品 namespace
2. 消费相关产品 exports
3. 在需要时把 adapter 逻辑和宿主 retrieval 路径结合起来
4. 当结构化 tool result 出现时，通过异步 OpenClaw runtime hook 发出 governed accepted-action 证据
5. 保持行为有 regression 保护
6. 同时兼容 local-first 与后续 shared-service 演进

## 主流程

```mermaid
sequenceDiagram
    autonumber
    participant Host as OpenClaw Host
    participant Adapter as OpenClaw Adapter
    participant Core as Unified Memory Core

    Host->>Adapter: 请求 context assembly
    Adapter->>Core: 解析 namespace 并加载 exports
    Core-->>Adapter: 返回 stable exports
    Adapter->>Adapter: 执行 retrieval / scoring / assembly
    Adapter-->>Host: 返回 final context package
```

## 运行模式

这个 adapter 的前期实现应支持两种运行模式：

1. `local adapter mode`
2. `shared-workspace adapter mode`

同时要保持对后续：

3. `shared-registry service mode`

的兼容性。

```mermaid
flowchart LR
    A["OpenClaw Host"] --> B["OpenClaw Adapter"]
    B --> C["本地 Exports / 共享 Workspace"]
    C --> D["Unified Memory Core Artifacts"]

    E["未来 Shared Registry Service"] -. later .-> B

    classDef adapter fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    class A,B adapter;
    class C,D,E core;
```

## 面向网络演进的边界

这个 adapter 不应该假设：

- 只有一个 host
- 只有一个 OpenClaw 进程
- 只有一个 agent

所以 adapter 边界必须保留：

- 显式 namespace resolution
- 可重复的 export loading
- 带 visibility 的 artifact 选择
- 对 adapter 回写事件做按 namespace 串行化

## 多 Agent 说明

对于 `一个 OpenClaw 下多个 agent`，推荐规则是：

- 共用一套受治理的 namespace resolver
- 允许并发读取
- adapter 侧写入按 namespace 串行化
- agent 本地 scratch state 不进入 governed exports

## Accepted-Action Hook 边界

OpenClaw adapter 现在拥有一条写侧接缝：

- 异步 `after_tool_call`
- 只有当 tool result 里带有显式结构化 accepted-action payload 时才触发
- registry 写入、reflection 和 promotion 仍然留在 `Unified Memory Core` 内部，不回退到宿主本地 scratch 逻辑

它有意不做这些事：

- 不把同步 `tool_result_persist` 当作 registry 写入口
- 不对任意“成功工具结果”做隐式推断

## 必须守住的边界

这个 adapter 必须清楚分开：

- host runtime behavior
- product artifacts
- adapter-side heuristics

## 第一阶段实现边界

第一批实现建议先支持：

1. namespace mapping
2. export consumption contract
3. retrieval / assembly integration
4. adapter compatibility tests
5. local-first 模式下的 multi-agent-safe 读写规则

## 完成标准

这个模块进入可开发状态的标准是：

- OpenClaw boundary 已明确
- export consumption contract 已明确
- namespace mapping rules 已明确
- adapter test surfaces 已定义
- local-first 与 shared-workspace 部署规则已明确
