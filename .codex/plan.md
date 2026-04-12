# Plan

## Current Phase

`governed execution / module-view active`

## Slices

- Slice: `align-code-agent-codex-memory-surface`
  - Objective: 让 OpenClaw `code` agent 和 Codex 共用同一 registry、同一 code-workspace、同一双层 namespace 读写语义，同时不把其他 agent 一起迁进 `code-workspace`
  - Dependencies: `src/openclaw-adapter.js`、`src/plugin/self-learning-service.js`、`src/codex-adapter.js`、OpenClaw live config
  - Risks: 只改全局 `workspaceId` 会误伤所有 agent；Codex 如果仍是单层读取，就和 OpenClaw `code` agent 记忆面不一致
  - Validation: targeted adapter tests、full `npm test`、live OpenClaw config 检查
  - Exit Condition: `code` agent 和 Codex 的最小配置明确，且运行时行为对齐

- Slice: `unify-codex-signals-into-self-learning-ingestion`
  - Objective: 让 Codex task/write-back 信号进入与 OpenClaw conversation 相同的 governed self-learning ingestion，而不是停留在并行写回路径
  - Dependencies: `src/codex-adapter.js`、`src/plugin/self-learning-service.js`、`src/unified-memory-core/daily-reflection.js`、host-neutral-memory workstream
  - Risks: 如果继续只扫 OpenClaw session memory，Codex 的长期学习会长期落后；如果直接把宿主上下文硬灌进 learning，又会让 source 边界变脏
  - Validation: 新 collector / source-type tests、nightly integration tests、full `npm test`
  - Exit Condition: Codex 信号被纳入统一 learning ingestion，且 source provenance 仍清晰可审计

- Slice: `define-host-neutral-registry-contract`
  - Objective: 明确 canonical registry root、config / env override、compat fallback 与 shared / agent / session durability policy
  - Dependencies: `.codex/subprojects/host-neutral-memory.md`、`docs/workstreams/host-neutral-memory/architecture.md`
  - Risks: storage 归属继续和 OpenClaw 宿主混在一起，导致 Codex 共享路径继续漂移
  - Validation: durable 文档和 `.codex` 控制面达成同一边界；首批实现切片与验证方式明确
  - Exit Condition: registry-root contract 和 fallback 顺序固定，不再停留在口头讨论

- Slice: `implement-host-neutral-registry-root`
  - Objective: 让 OpenClaw / Codex 都通过同一 canonical root 解析 registry，并保留兼容旧 OpenClaw-scoped root 的能力
  - Dependencies: `src/config.js`、registry root 解析入口、OpenClaw / Codex adapter
  - Risks: live OpenClaw 本地安装被打断，或出现 adapter-local duplicate store
  - Validation: targeted tests、shared-root resolution tests、live plugin load 检查
  - Exit Condition: 一个 workspace 能被 OpenClaw / Codex 从同一 registry root 读取

- Slice: `add-migration-and-governance-for-shared-root`
  - Objective: 给 host-neutral root 增加 migration/reporting/governance，避免切换期静默丢数据
  - Dependencies: registry、governance-system、standalone CLI / reports
  - Risks: records 虽未丢失，但 operator 无法判断当前 live root 和 fallback 命中情况
  - Validation: migration/reporting 输出可读；治理检查能发现 root / namespace 不一致
  - Exit Condition: storage decoupling 进入可维护状态

- Slice: `advance-openclaw-adapter-recall-quality`
  - Objective: 继续扩稳定事实 / 稳定规则，同时保持 recalled context 干净
  - Dependencies: `.codex/modules/openclaw-adapter.md`、smoke surfaces、promotion helper
  - Risks: supporting context 再次变脏，或 smoke 面扩张过快
  - Validation: `npm run smoke:eval`、相关 targeted tests、`npm run eval:smoke-promotion`
  - Exit Condition: 新 stable facts / rules 进入稳定面，并保持 smoke 质量稳定

- Slice: `stabilize-memory-search-governance`
  - Objective: 继续保持 `memory search` 从“能答对”推进到“上下文纯度稳定”
  - Dependencies: `reports/memory-search-governance-latest.json`、`eval:smoke-promotion`
  - Risks: 新增 case 升格过快，导致 smoke 面变脆
  - Validation: `npm run eval:memory-search:governance -- --write`、`npm run eval:smoke-promotion`
  - Exit Condition: 新 stable fact/rule 的升格有明确建议规则，不靠临时判断

- Slice: `plan-next-learning-phase`
  - Objective: 给 `reflection-system` 主导的下一增强 phase 明确命名、范围和验证方式
  - Dependencies: `.codex/modules/reflection-system.md`、`.codex/modules/projection-system.md`、`.codex/modules/memory-registry.md`、`docs/roadmap.md`
  - Risks: 产品主干长期停留在“等待下一 phase”，后续立项继续模糊
  - Validation: 下一增强 phase 被命名，并有单独的目标与验证方式
  - Exit Condition: 相关模块不再只写“waiting next phase”

## Execution Order

1. `add-migration-and-governance-for-shared-root` 已落地，先观察 live topology
2. 再决定 canonical root 的正式 adoption/cutover 方案
3. 同步维持 `openclaw-adapter` recall quality 与 smoke promotion
4. 为 `reflection-system` 打开下一增强 phase

## Architecture Supervision
- Signal: `yellow`
- Signal Basis: open blockers or architectural risks are still recorded
- Problem Class: active slice governance and architectural fit
- Root Cause Hypothesis: the repo can drift back to local fixes if the current slice loses a visible architectural checkpoint
- Correct Layer: control surface, validators, and reporting
- Rejected Shortcut: letting execution continue without a visible architecture signal
- Escalation Gate: raise but continue

## Current Execution Line
- Objective: 继续扩稳定事实 / 稳定规则，同时保持 recalled context 干净
- Plan Link: advance-openclaw-adapter-recall-quality
- Runway: one active-slice checkpoint covering implementation, validation, and state refresh
- Progress: 9 / 9 tasks complete
- Stop Conditions:
  - blocker requires human direction
  - validation fails and changes the direction
  - business, compatibility, or cost decision requires user judgment
- Validation: `npm run smoke:eval`、相关 targeted tests、quick full governance refresh、`npm run eval:smoke-promotion`

## Execution Tasks
- [x] EL-1 confirm the checkpoint and objective for `advance-openclaw-adapter-recall-quality`: 继续扩稳定事实 / 稳定规则，同时保持 recalled context 干净
- [x] EL-2 verify dependencies and affected boundaries: `.codex/modules/openclaw-adapter.md`、smoke surfaces、promotion helper
- [x] EL-3 confirm architecture signal, root-cause hypothesis, and correct layer still hold
- [x] EL-4 implement the highest-value change for `advance-openclaw-adapter-recall-quality`
- [x] EL-5 address the main execution risk: 补 dedicated family-overview stable card，把 `children-overview` 收口成真正的 single-card，并仅把 same-path two-card 保留为旧卡兜底
- [x] EL-6 update docs, control-surface notes, or contracts touched by this slice
- [x] EL-7 run validation: `node --test test/retrieval.test.js test/assembly.test.js`、`npm run smoke:eval`、targeted `npm run eval:memory-search:cases -- --only children-overview-priority`、quick full `node scripts/eval-memory-search-cases.js --timeout-ms 1000` + governance report sync、`npm run eval:smoke-promotion`
- [x] EL-8 refresh progress, capabilities, next checkpoint, and next 3 actions
- [x] EL-9 capture a devlog entry if the root cause, tradeoff, or rejected shortcut changed

## Development Log Capture
- Trigger Level: high
- Auto-Capture When:
  - the root-cause hypothesis changes
  - a reusable mechanism replaces repeated local fixes
  - a retrofit changes governance, architecture, or release policy
  - a tradeoff or rejected shortcut is likely to matter in future work
- Skip When:
  - the change is mechanical or formatting-only
  - no durable reasoning changed
  - the work simply followed an already-approved path
  - the change stayed local and introduced no durable tradeoff

## Escalation Model

- Continue Automatically: implementation and validation work stay within the current direction and do not alter business behavior
- Raise But Continue: the assistant sees architectural drift or scope pressure but can still converge within the agreed direction
- Require User Decision: product behavior, compatibility, performance, cost, or UX tradeoffs would change the intended direction
