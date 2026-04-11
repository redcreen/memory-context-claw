# Unified Memory Core Migration Checklist

[English](#english) | [中文](#中文)

## English

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

## 中文

## 目标

这份 checklist 记录任何拆分仓库或调整 release boundary 之前，最少必须满足的迁移条件。

## Checklist

1. 冻结 `src/unified-memory-core/` 下的 portable contract 路径
2. 保持 standalone CLI surfaces 稳定
3. 保持 OpenClaw / Codex adapters 继续通过显式 export 边界消费能力
4. 迁移过程中保留统一回归覆盖
5. 保持 docs、tests、runtime paths 同步

## 必须验证

- 运行 `npm test`
- 运行 `npm run umc:cli -- review independent-execution --format markdown`
- 运行 `npm run umc:cli -- export inspect --consumer generic --format markdown`
- 运行 `npm run umc:cli -- govern audit --format markdown`

## 非目标

- 不在这里引入 runtime API
- 不在这里引入多主机服务依赖
- 不在这里把 adapter logic 搬进 product core
