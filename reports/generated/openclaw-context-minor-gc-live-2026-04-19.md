# OpenClaw Context Minor GC Live Matrix

- generatedAt: `2026-04-19T01:47:56.236Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- timeoutMs: `120000`
- total: `2`
- captured: `2/2`
- answerPassed: `2/2`
- relationPassed: `2/2`
- reductionPassed: `2/2`
- passed: `2/2`
- averagePromptTokens: `14261`
- averageDurationMs: `13001`
- averageRawReductionRatio: `0.8306`
- averagePackageReductionRatio: `0.7803`
- relationCounts: `{"switch":2}`

## Method

- Run inside a hermetic OpenClaw state with UMC enabled and `dialogueWorkingSetShadow=true`.
- Keep `dialogueWorkingSetGuarded=false`, `ordinaryConversationMemory=false`, and `governedExports=false` so the matrix isolates Stage 7 context optimization telemetry instead of write-path behavior.
- Prewarm the base state once, reset sessions, then clone that warmed template per case.
- Every case is judged by four conditions together: final turn succeeded, shadow event captured, final answer matched the case expectation, and shadow relation/raw-reduction stayed inside the expected band.

## cmgc-live-en-current-editor-conflict
- description: A newer current-state fact should win after an unrelated detour.
- 设计的问题 -> Back to the editor fact. What is my current default editor now?
- 预期的结果 -> expected_all=["zed"]; forbidden_any=["i don't know"]; relations=["switch","continue","resolve"]; min_raw_reduction=0.1
- 实际结果 -> Zed.
- captured -> `true`
- relation -> actual `switch` expected `["switch","continue","resolve"]`
- rawReductionRatio -> actual `0.7468` min `0.1`
- promptTokens -> `14677`
- durationMs -> `11909`
- export -> `/Users/redcreen/Project/unified-memory-core/reports/generated/openclaw-context-minor-gc-live-2026-04-19/cmgc-live-en-current-editor-conflict/exports/agent-main-main-shadow-1776563215277-k5rd04.json`
- passed -> `true`

## cmgc-live-zh-dense-multitopic-return
- description: A denser natural-Chinese multi-topic switch should still return to the right travel fact.
- 设计的问题 -> 先不聊代码了。刚才旅行那段里，我更想住哪座城市？
- 预期的结果 -> expected_all=["京都"]; forbidden_any=["大阪","不知道"]; relations=["switch","resolve","continue"]; min_raw_reduction=0.18
- 实际结果 -> 京都。
- captured -> `true`
- relation -> actual `switch` expected `["switch","resolve","continue"]`
- rawReductionRatio -> actual `0.9143` min `0.18`
- promptTokens -> `13844`
- durationMs -> `14093`
- export -> `/Users/redcreen/Project/unified-memory-core/reports/generated/openclaw-context-minor-gc-live-2026-04-19/cmgc-live-zh-dense-multitopic-return/exports/agent-main-main-shadow-1776563263781-zkrvw5.json`
- passed -> `true`

