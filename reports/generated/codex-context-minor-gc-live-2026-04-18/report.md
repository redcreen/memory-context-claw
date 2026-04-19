# Codex Context Minor GC Live Matrix

- model: `gpt-5.4`
- reasoning effort: `low`
- cases: `6`
- baseline passed: `6`
- minor-gc passed: `6`
- guarded applied: `4`
- activation matched: `6`
- false activations: `0`
- missed activations: `0`
- average prompt reduction ratio: `0.3614`
- applied-only prompt reduction ratio: `0.5421`
- applied-only package reduction ratio: `0.618`

## codex-minor-gc-seat-preference
- description: A durable travel preference should survive a code detour after guarded pruning.
- expectedGuardedApplied: `true`
- actualGuardedApplied: `true`
- relation: `switch`
- baseline answer: 你坐飞机喜欢靠过道。
- minor-gc answer: 你坐飞机喜欢靠过道。
- prompt reduction ratio: `0.4194`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/codex-context-minor-gc-live-2026-04-18/exports/codex-codex-minor-gc-seat-preference-shadow-1776559078952-cuditq.json`

## codex-minor-gc-style-pin-survives-detour
- description: A style preference should survive a short code detour after that detour is explicitly closed.
- expectedGuardedApplied: `true`
- actualGuardedApplied: `true`
- relation: `switch`
- baseline answer: 你刚才要求我默认先给结论，再展开细节。
- minor-gc answer: 你刚才要求我以后默认先给结论，再展开细节。
- prompt reduction ratio: `0.413`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/codex-context-minor-gc-live-2026-04-18/exports/codex-codex-minor-gc-style-pin-survives-detour-shadow-1776559100513-gbgsyd.json`

## codex-minor-gc-branch-negative
- description: A branch return should stay answer-correct without activating the guarded path.
- expectedGuardedApplied: `false`
- actualGuardedApplied: `false`
- relation: `continue`
- baseline answer: 版本、安装、回滚。
- minor-gc answer: 版本、安装、回滚。
- prompt reduction ratio: `0`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/codex-context-minor-gc-live-2026-04-18/exports/codex-codex-minor-gc-branch-negative-shadow-1776559116033-c7e866.json`

## codex-minor-gc-continue-negative
- description: A same-topic continue turn should not activate guarded pruning.
- expectedGuardedApplied: `false`
- actualGuardedApplied: `false`
- relation: `continue`
- baseline answer: 当前新任务是写 shadow mode 报告，并且报告里还要明确 rollback boundary。
- minor-gc answer: 当前新任务是写 shadow mode 报告，并且报告里还要明确 rollback boundary。
- prompt reduction ratio: `0`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/codex-context-minor-gc-live-2026-04-18/exports/codex-codex-minor-gc-continue-negative-shadow-1776559134302-mh4jo5.json`

## codex-minor-gc-current-editor-update-after-detour
- description: A current-state fact update should survive a short detour and return the newer value.
- expectedGuardedApplied: `true`
- actualGuardedApplied: `true`
- relation: `switch`
- baseline answer: 你现在默认编辑器是 Zed。
- minor-gc answer: 你现在默认编辑器是 Zed。
- prompt reduction ratio: `0.6957`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/codex-context-minor-gc-live-2026-04-18/exports/codex-codex-minor-gc-current-editor-update-after-detour-shadow-1776559149531-1kftnf.json`

## codex-minor-gc-zh-dense-multitopic-return
- description: A denser natural-Chinese multi-topic switch should still return to the right travel fact.
- expectedGuardedApplied: `true`
- actualGuardedApplied: `true`
- relation: `switch`
- baseline answer: 京都
- minor-gc answer: 京都
- prompt reduction ratio: `0.6404`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/codex-context-minor-gc-live-2026-04-18/exports/codex-codex-minor-gc-zh-dense-multitopic-return-shadow-1776559170700-h3s9w9.json`

