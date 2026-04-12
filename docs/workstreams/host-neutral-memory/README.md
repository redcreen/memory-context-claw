# Host-Neutral Memory

[English](README.md) | [中文](README.zh-CN.md)

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

## Current Operator Conclusion

- the canonical root default is `~/.unified-memory-core/registry`
- if runtime resolution is already on the canonical root, cutover is treated as adopted
- `~/.openclaw/unified-memory-core/registry` remains only a compatibility fallback
- when canonical is active, legacy divergence is advisory and does not become an independent hard gate
