# OpenClaw Adapter Roadmap

[English](openclaw-adapter.md) | [中文](openclaw-adapter.zh-CN.md)

## Goal

Move the current repo shape onto the formal OpenClaw adapter boundary.

Current status:

- `step-8 design package complete`
- implementation is the next phase

## Phases

### Phase 1. Boundary and namespace

- OpenClaw namespace mapping
- adapter consumption contract
- export-loading rules
- local-first multi-agent rules

### Phase 2. Runtime integration

- retrieval integration
- scoring / assembly integration
- adapter compatibility checks
- shared-workspace-safe export consumption

### Phase 3. Hardening

- regression protection
- host-compatibility audits
- migration cleanup from legacy naming and paths
- future shared-registry readiness checks

## Exit Criteria

- OpenClaw consumes product exports only through the adapter boundary
- adapter behavior stays regression-covered
- legacy runtime confusion is removed
- local-first and shared-workspace behavior stay explicit and governed
