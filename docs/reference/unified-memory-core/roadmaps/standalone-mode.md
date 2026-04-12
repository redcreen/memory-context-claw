# Standalone Mode Roadmap

[English](standalone-mode.md) | [中文](standalone-mode.zh-CN.md)

## Goal

Make `Unified Memory Core` operable without OpenClaw host participation.

Current status:

- `step-11 design package complete`
- implementation is the next phase

## Phases

### Phase 1. Command Boundary

- command family definition
- source registration flow
- dry-run / inspect mode

### Phase 2. Operational Loop

- reflect/export/govern command flow
- scheduled-job assumptions
- artifact-path conventions

### Phase 3. Hardening

- repeatable local execution
- shared-workspace compatibility
- future runtime-API readiness checks

## Exit Criteria

- one ingest -> reflect -> export path runs without host participation
- audit / repair commands are explicit
- standalone outputs match governed artifact contracts
