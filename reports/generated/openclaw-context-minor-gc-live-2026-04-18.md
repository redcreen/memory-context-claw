# OpenClaw Context Minor GC Live Matrix

- generatedAt: `2026-04-18T02:59:44.124Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- timeoutMs: `120000`
- total: `6`
- captured: `6/6`
- answerPassed: `6/6`
- relationPassed: `6/6`
- reductionPassed: `6/6`
- passed: `6/6`
- averagePromptTokens: `14517`
- averageDurationMs: `37548`
- averageRawReductionRatio: `0.6556`
- averagePackageReductionRatio: `0.4657`
- relationCounts: `{"resolve":1,"switch":4,"continue":1}`

## Method

- Run inside a hermetic OpenClaw state with UMC enabled and `dialogueWorkingSetShadow=true`.
- Keep `dialogueWorkingSetGuarded=false`, `ordinaryConversationMemory=false`, and `governedExports=false` so the matrix isolates Stage 7 context optimization telemetry instead of write-path behavior.
- Prewarm the base state once, reset sessions, then clone that warmed template per case.
- Every case is judged by four conditions together: final turn succeeded, shadow event captured, final answer matched the case expectation, and shadow relation/raw-reduction stayed inside the expected band.

## cmgc-live-zh-language-after-code-detour
- description: A durable Chinese-language preference should survive a code detour and come back as the latest answer.
- 设计的问题 -> 先不说代码了。我刚才要求你默认用什么语言回复？
- 预期的结果 -> expected_all=["中文"]; forbidden_any=["英文","不知道"]; relations=["switch","resolve","continue"]; min_raw_reduction=0.12
- 实际结果 -> 中文，尽量一句话。
- captured -> `true`
- relation -> actual `resolve` expected `["switch","resolve","continue"]`
- rawReductionRatio -> actual `0.7818` min `0.12`
- promptTokens -> `13518`
- durationMs -> `31145`
- export -> `/Users/redcreen/Project/unified-memory-core/reports/generated/openclaw-context-minor-gc-live-2026-04-18/cmgc-live-zh-language-after-code-detour/exports/agent-main-main-shadow-1776480524306-dzkuat.json`
- passed -> `true`

## cmgc-live-en-seat-after-project-switch
- description: A durable travel preference should survive a project-report detour and return correctly.
- 设计的问题 -> Leave the report topic. What seat do I usually prefer on flights?
- 预期的结果 -> expected_all=["aisle"]; forbidden_any=["window","i don't know"]; relations=["branch","switch","continue","resolve"]; min_raw_reduction=0.15
- 实际结果 -> Aisle seat.
- captured -> `true`
- relation -> actual `switch` expected `["branch","switch","continue","resolve"]`
- rawReductionRatio -> actual `0.5217` min `0.15`
- promptTokens -> `15297`
- durationMs -> `49401`
- export -> `/Users/redcreen/Project/unified-memory-core/reports/generated/openclaw-context-minor-gc-live-2026-04-18/cmgc-live-en-seat-after-project-switch/exports/agent-main-main-shadow-1776480603415-g2fblw.json`
- passed -> `true`

## cmgc-live-en-open-loop-return-stage7
- description: An unfinished Stage 7 planning thread should survive a side question and then resume cleanly.
- 设计的问题 -> Return to the earlier Stage 7 split. Which three parts did I ask for?
- 预期的结果 -> expected_all=["summary","scorecard","rollback"]; forbidden_any=["i don't know"]; relations=["branch","switch","continue"]; min_raw_reduction=0.08
- 实际结果 -> You asked for:

- Summary
- Operator scorecard
- Rollback boundary
- captured -> `true`
- relation -> actual `continue` expected `["branch","switch","continue"]`
- rawReductionRatio -> actual `0.8743` min `0.08`
- promptTokens -> `16586`
- durationMs -> `41640`
- export -> `/Users/redcreen/Project/unified-memory-core/reports/generated/openclaw-context-minor-gc-live-2026-04-18/cmgc-live-en-open-loop-return-stage7/exports/agent-main-main-shadow-1776480750144-nqq1qy.json`
- passed -> `true`

## cmgc-live-en-current-editor-conflict
- description: A newer current-state fact should win after an unrelated detour.
- 设计的问题 -> Back to the editor fact. What is my current default editor now?
- 预期的结果 -> expected_all=["zed"]; forbidden_any=["i don't know"]; relations=["switch","continue","resolve"]; min_raw_reduction=0.1
- 实际结果 -> Zed.
- captured -> `true`
- relation -> actual `switch` expected `["switch","continue","resolve"]`
- rawReductionRatio -> actual `0.3902` min `0.1`
- promptTokens -> `14398`
- durationMs -> `40263`
- export -> `/Users/redcreen/Project/unified-memory-core/reports/generated/openclaw-context-minor-gc-live-2026-04-18/cmgc-live-en-current-editor-conflict/exports/agent-main-main-shadow-1776480917971-2gw416.json`
- passed -> `true`

## cmgc-live-zh-release-rule-after-detour
- description: A durable release-note rule should survive an unrelated detour and remain answerable.
- 设计的问题 -> 再回到刚才那条规则：以后做 release note，第一步默认先看哪里？
- 预期的结果 -> expected_all=["github","release"]; forbidden_any=["不知道"]; relations=["switch","continue","resolve"]; min_raw_reduction=0.12
- 实际结果 -> GitHub Releases 页面。
- captured -> `true`
- relation -> actual `switch` expected `["switch","continue","resolve"]`
- rawReductionRatio -> actual `0.7143` min `0.12`
- promptTokens -> `13576`
- durationMs -> `31989`
- export -> `/Users/redcreen/Project/unified-memory-core/reports/generated/openclaw-context-minor-gc-live-2026-04-18/cmgc-live-zh-release-rule-after-detour/exports/agent-main-main-shadow-1776481010572-rahhtk.json`
- passed -> `true`

## cmgc-live-zh-dense-multitopic-return
- description: A denser natural-Chinese multi-topic switch should still return to the right travel fact.
- 设计的问题 -> 先不聊代码了。刚才旅行那段里，我更想住哪座城市？
- 预期的结果 -> expected_all=["京都"]; forbidden_any=["大阪","不知道"]; relations=["switch","resolve","continue"]; min_raw_reduction=0.18
- 实际结果 -> 京都
- captured -> `true`
- relation -> actual `switch` expected `["switch","resolve","continue"]`
- rawReductionRatio -> actual `0.6512` min `0.18`
- promptTokens -> `13726`
- durationMs -> `30851`
- export -> `/Users/redcreen/Project/unified-memory-core/reports/generated/openclaw-context-minor-gc-live-2026-04-18/cmgc-live-zh-dense-multitopic-return/exports/agent-main-main-shadow-1776481155002-kmkrvw.json`
- passed -> `true`

