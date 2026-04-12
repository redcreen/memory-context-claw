# Unified Memory Core Migration Checklist

[English](migration-checklist.md) | [中文](migration-checklist.zh-CN.md)

## 目标

这份 checklist 记录任何拆分仓库或调整 release boundary 之前，最少必须满足的迁移条件。

## Checklist

1. 冻结 `src/unified-memory-core/` 下的 portable contract 路径
2. 保持 standalone CLI surfaces 稳定
3. 保持 OpenClaw / Codex adapters 继续通过显式 export 边界消费能力
4. 迁移过程中保留统一回归覆盖
5. 保持 docs、tests、runtime paths 同步

## 必须验证

- 运行 `npm run umc:stage5 -- --format markdown`
- 运行 `npm test`
- 运行 `npm run umc:cli -- review independent-execution --format markdown`
- 运行 `npm run umc:cli -- review split-rehearsal --format markdown`
- 运行 `npm run umc:cli -- export inspect --consumer generic --format markdown`
- 运行 `npm run umc:cli -- govern audit --format markdown`

## 非目标

- 不在这里引入 runtime API
- 不在这里引入多主机服务依赖
- 不在这里把 adapter logic 搬进 product core
