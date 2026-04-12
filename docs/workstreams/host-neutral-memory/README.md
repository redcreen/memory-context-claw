# Host-Neutral Memory

[English](#english) | [中文](#中文)

## English

## Purpose

This workstream defines how `Unified Memory Core` stops treating OpenClaw as the long-term memory host and instead becomes a host-neutral shared-memory core.

It focuses on:

- one canonical registry
- logical namespace layering instead of per-host storage ownership
- compatibility between OpenClaw and Codex
- migration from the current OpenClaw-scoped local registry layout

## Read This Workstream When

- you are deciding whether agent namespaces need separate physical storage
- you want OpenClaw and Codex to share the same durable memory base
- you need to plan registry-root decoupling without breaking current local-first behavior

## Documents

- [architecture.md](architecture.md)
- [roadmap.md](roadmap.md)

## 中文

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
