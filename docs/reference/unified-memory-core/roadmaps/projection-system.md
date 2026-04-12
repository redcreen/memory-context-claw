[English](projection-system.md) | [中文](projection-system.zh-CN.md)

# Projection System Roadmap

## Goal

Build deterministic exports for adapters and future consumers.

## Phases

### Phase 1. Export contract

- generic export schema
- export versioning
- namespace + visibility filtering

### Phase 2. Consumer projections

- OpenClaw export
- Codex export
- policy projection

### Phase 3. Future-facing surfaces

- generic JSON exports
- API-ready shape planning
- comparison-friendly export diff

## Exit Criteria

- stable records can become deterministic exports
- OpenClaw and Codex can consume distinct projections from one core
- export versions are diffable
