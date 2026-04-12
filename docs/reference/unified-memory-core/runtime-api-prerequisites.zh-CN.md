# Unified Memory Core Runtime API Prerequisites

[English](runtime-api-prerequisites.md) | [中文](runtime-api-prerequisites.zh-CN.md)

## 目的

这份文档记录了在讨论 runtime API 或 network service mode 之前，必须先满足的前提。

Stage 5 不会实现 runtime API service mode。本页的作用是把前置条件冻结下来，让后续讨论建立在稳定产品证据上，而不是猜测上。

## 必要前提

1. `npm run umc:stage5 -- --format markdown` 通过。
2. 如果需要 host-level 信心，`npm run umc:openclaw-itest -- --format markdown` 也通过。
3. release-boundary 和 migration 文档保持最新。
4. `generic`、`openclaw`、`codex` 三类 export 的 reproducibility 保持稳定。
5. split rehearsal 在不改变公开 contract path 的前提下可 review。
6. registry-root cutover policy 已经足够明确，不会把 storage 边界问题偷偷带进 service-mode 讨论。

## 仍然延后

- runtime API server 实现
- multi-host network service
- network-required deployment 假设
- 从宿主产品层侵入式改写 OpenClaw 内置长期记忆
