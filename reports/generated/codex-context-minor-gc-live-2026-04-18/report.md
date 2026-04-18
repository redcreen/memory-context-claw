# Codex Context Minor GC Live Matrix

- model: `gpt-5.4`
- reasoning effort: `low`
- cases: `4`
- baseline passed: `4`
- minor-gc passed: `4`
- guarded applied: `2`
- activation matched: `4`
- false activations: `0`
- missed activations: `0`
- average prompt reduction ratio: `0.1469`
- applied-only prompt reduction ratio: `0.2939`
- applied-only package reduction ratio: `0.3553`

## codex-minor-gc-seat-preference
- description: A durable travel preference should survive a code detour after guarded pruning.
- expectedGuardedApplied: `true`
- actualGuardedApplied: `true`
- relation: `switch`
- baseline answer: 靠过道的位置。
- minor-gc answer: 你坐飞机喜欢靠过道的位置。
- prompt reduction ratio: `0.4355`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/codex-context-minor-gc-live-2026-04-18/exports/codex-codex-minor-gc-seat-preference-shadow-1776488183947-1tadic.json`

## codex-minor-gc-style-pin-survives-detour
- description: A style preference should survive a short code detour after that detour is explicitly closed.
- expectedGuardedApplied: `true`
- actualGuardedApplied: `true`
- relation: `switch`
- baseline answer: 你刚才要求我默认先给结论，再展开细节。
- minor-gc answer: 先给结论，再展开细节。
- prompt reduction ratio: `0.1522`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/codex-context-minor-gc-live-2026-04-18/exports/codex-codex-minor-gc-style-pin-survives-detour-shadow-1776488218276-xnyss7.json`

## codex-minor-gc-branch-negative
- description: A branch return should stay answer-correct without activating the guarded path.
- expectedGuardedApplied: `false`
- actualGuardedApplied: `false`
- relation: `continue`
- baseline answer: 版本、安装、回滚。
- minor-gc answer: 版本、安装、回滚。
- prompt reduction ratio: `0`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/codex-context-minor-gc-live-2026-04-18/exports/codex-codex-minor-gc-branch-negative-shadow-1776488249074-ff0tlq.json`

## codex-minor-gc-continue-negative
- description: A same-topic continue turn should not activate guarded pruning.
- expectedGuardedApplied: `false`
- actualGuardedApplied: `false`
- relation: `continue`
- baseline answer: 当前新任务是写 shadow mode 报告，并且报告里还要明确 rollback boundary。
- minor-gc answer: 当前新任务是写 `shadow mode` 报告，并且报告里要明确 `rollback boundary`。
- prompt reduction ratio: `0`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/codex-context-minor-gc-live-2026-04-18/exports/codex-codex-minor-gc-continue-negative-shadow-1776488271515-stpviv.json`

