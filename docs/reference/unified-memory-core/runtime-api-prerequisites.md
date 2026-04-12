# Unified Memory Core Runtime API Prerequisites

[English](runtime-api-prerequisites.md) | [中文](runtime-api-prerequisites.zh-CN.md)

## Purpose

This page records what must be true before discussing a runtime API or network service mode.

Stage 5 does not implement runtime API service mode. It freezes the prerequisite checklist so later discussion starts from stable product evidence instead of guesswork.

## Required Preconditions

1. `npm run umc:stage5 -- --format markdown` passes.
2. `npm run umc:openclaw-itest -- --format markdown` passes when host-level confidence is required.
3. release-boundary and migration documents remain current.
4. export reproducibility stays stable for `generic`, `openclaw`, and `codex`.
5. split rehearsal remains reviewable without changing public contract paths.
6. registry-root cutover policy is explicit enough that service-mode discussion does not hide unresolved storage ambiguity.

## Still Deferred

- runtime API server implementation
- multi-host network service
- network-required deployment assumptions
- host-side invasive changes to OpenClaw builtin memory
