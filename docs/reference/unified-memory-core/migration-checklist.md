# Unified Memory Core Migration Checklist

[English](migration-checklist.md) | [中文](migration-checklist.zh-CN.md)

## Goal

This checklist records the minimum migration conditions before any repo split or release-boundary change.

## Checklist

1. freeze portable contract paths under `src/unified-memory-core/`
2. keep standalone CLI surfaces stable
3. keep OpenClaw / Codex adapters consuming exports through explicit boundaries
4. preserve unified regression coverage during migration
5. keep docs, tests, and runtime paths aligned

## Required Verification

- run `npm test`
- run `npm run umc:cli -- review independent-execution --format markdown`
- run `npm run umc:cli -- export inspect --consumer generic --format markdown`
- run `npm run umc:cli -- govern audit --format markdown`

## Non-Goals

- do not introduce runtime API work here
- do not introduce multi-host service dependencies here
- do not move adapter logic into product core here
