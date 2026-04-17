# OpenClaw Guarded Live A/B

- generatedAt: `2026-04-17T19:20:32.257Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `4`
- baselinePassed: `4/4`
- guardedPassed: `4/4`
- guardedApplied: `2/4`
- activationMatched: `4/4`
- falseActivations: `0`
- missedActivations: `0`
- averageBaselinePromptTokens: `14219`
- averageGuardedPromptTokens: `13770`
- averagePromptReductionRatio: `0.0306`
- averageAppliedPromptReductionRatio: `0.0067`
- averageAppliedRawReductionRatio: `0.7422`

## Method

- Every run uses an isolated hermetic `OPENCLAW_STATE_DIR` built from the repo fixture, not host `~/.openclaw` memory.
- `baseline` keeps the current UMC path but leaves `dialogueWorkingSetShadow` and `dialogueWorkingSetGuarded` off.
- `guarded` enables `dialogueWorkingSetShadow` plus the Stage 9 guarded opt-in path.
- Both modes disable unrelated learning/distillation writes so the comparison stays focused on context-path behavior.

## guarded-live-language-after-code-detour
- description: A language preference should survive a short code detour and still answer correctly.
- expectGuardedApplied: `true`
- actualGuardedApplied: `true`
- relation: `resolve`
- guardedReason: `guarded_candidate`
- baseline answer: 中文。
- guarded answer: 你刚才要求我：**以后默认用中文回复**。
- baseline promptTokens: `13583`
- guarded promptTokens: `13447`
- promptReductionRatio: `0.01`
- rawReductionRatio: `0.9011`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/openclaw-guarded-live-ab-2026-04-17/guarded-live-language-after-code-detour-guarded/exports/agent-main-main-shadow-1776453075069-lvd7em.json`

## guarded-live-style-pin-survives-detour
- description: A style preference should survive an unrelated retrieval-policy detour.
- expectGuardedApplied: `true`
- actualGuardedApplied: `true`
- relation: `switch`
- guardedReason: `guarded_candidate`
- baseline answer: 先给结论，再展开细节。
- guarded answer: 先给结论，再展开细节。
- baseline promptTokens: `13649`
- guarded promptTokens: `13602`
- promptReductionRatio: `0.0034`
- rawReductionRatio: `0.5833`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/openclaw-guarded-live-ab-2026-04-17/guarded-live-style-pin-survives-detour-guarded/exports/agent-main-main-shadow-1776453274087-tv371l.json`

## guarded-live-branch-negative
- description: A branch return should stay answer-correct without activating the guarded path.
- expectGuardedApplied: `false`
- actualGuardedApplied: `false`
- relation: `continue`
- guardedReason: `relation_not_allowed`
- baseline answer: - **版本验收**
- **安装验收**
- **回滚验收**
- guarded answer: - **版本验收**
- **安装验收**
- **回滚验收**

如果你要，我也可以把每一部分再展开成检查项。
- baseline promptTokens: `14948`
- guarded promptTokens: `14286`
- promptReductionRatio: `0.0443`
- rawReductionRatio: `0.0759`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/openclaw-guarded-live-ab-2026-04-17/guarded-live-branch-negative-guarded/exports/agent-main-main-shadow-1776453458719-vcuzey.json`

## guarded-live-continue-negative
- description: A same-topic continue turn should not activate guarded pruning.
- expectGuardedApplied: `false`
- actualGuardedApplied: `false`
- relation: `continue`
- guardedReason: `relation_not_allowed`
- baseline answer: 当前新任务是：**写 shadow mode 报告，并明确 rollback boundary**。
- guarded answer: 当前新任务是：**写 shadow mode 报告**。
并且报告里要**明确 rollback boundary**。
- baseline promptTokens: `14694`
- guarded promptTokens: `13743`
- promptReductionRatio: `0.0647`
- rawReductionRatio: `0.0000`
- export: `/Users/redcreen/Project/unified-memory-core/reports/generated/openclaw-guarded-live-ab-2026-04-17/guarded-live-continue-negative-guarded/exports/agent-main-main-shadow-1776453611875-eq62ot.json`
