# Host-Neutral Memory

[English](README.md) | [中文](README.zh-CN.md)

## 目的

这个工作流定义的是：`Unified Memory Core` 如何从“当前部署在 OpenClaw 里的记忆插件”收成“宿主无关的共享记忆核心”。

重点是：

- 一套 canonical registry
- 用逻辑 namespace 分层，而不是按宿主拆物理存储
- OpenClaw / Codex 的共享长期记忆底座
- 从当前 OpenClaw 本地 registry 形态平滑迁移

## 什么时候看这个工作流

- 你在判断 agent namespace 是否要拆独立存储
- 你希望 OpenClaw 和 Codex 共享同一套长期记忆
- 你要规划 registry root 解耦，但不想打断 current local-first 行为

## 文档

- [architecture.md](architecture.md)
- [roadmap.md](roadmap.md)
