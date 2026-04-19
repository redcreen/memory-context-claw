# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T05:53:11.041Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `2/2`
- averageBaselinePeakPromptTokens: `14054`
- averageGuardedPeakPromptTokens: `14264`
- averageBaselinePostSwitchPromptTokens: `14155`
- averageGuardedPostSwitchPromptTokens: `12458`
- averageBaselineRollbackRatio: `-0.0072`
- averageGuardedRollbackRatio: `0.1266`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.1199`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## stress-release-rollback-after-topic-switch
- description: A denser single-topic release thread should build a much thicker prompt before a topic switch, then reveal whether guarded OpenClaw causes an obvious host-visible prompt rollback.
- baseline peakBeforeSwitch: `14054`
- guarded peakBeforeSwitch: `14264`
- baseline postSwitchMin: `14155`
- guarded postSwitchMin: `12458`
- baseline rollbackRatio: `-0.0072`
- guarded rollbackRatio: `0.1266`
- guarded postSwitch savings vs baseline: `0.1199`
- guarded applied turns in switch window: `1`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`12980` durationMs=`11159`
- t2: promptTokens=`12896` durationMs=`4753`
- t3: promptTokens=`12903` durationMs=`15197`
- t4: promptTokens=`13067` durationMs=`6239`
- t5: promptTokens=`13232` durationMs=`6953`
- t6: promptTokens=`13483` durationMs=`4889`
- t7: promptTokens=`13487` durationMs=`5141`
- t8: promptTokens=`13731` durationMs=`6532`
- t9: promptTokens=`13821` durationMs=`5265`
- t10: promptTokens=`13936` durationMs=`5976`
- t11: promptTokens=`14054` durationMs=`6038`
- t12: promptTokens=`14155` durationMs=`6104`
- t13: promptTokens=`14588` durationMs=`15055`
- t14: promptTokens=`15742` durationMs=`6306`
- t15: promptTokens=`15771` durationMs=`4690`
- t16: promptTokens=`16125` durationMs=`5119`

### Guarded Turns
- t1: promptTokens=`13025` durationMs=`9774` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`12983` durationMs=`5255` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`13003` durationMs=`5088` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t4: promptTokens=`13177` durationMs=`5401` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t5: promptTokens=`13375` durationMs=`6724` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t6: promptTokens=`13649` durationMs=`6642` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t7: promptTokens=`13658` durationMs=`16977` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t8: promptTokens=`13834` durationMs=`8147` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t9: promptTokens=`13997` durationMs=`5135` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t10: promptTokens=`14134` durationMs=`6707` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t11: promptTokens=`14264` durationMs=`5011` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t12: promptTokens=`14370` durationMs=`6235` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t13: promptTokens=`12458` durationMs=`9641` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9640`
- t14: promptTokens=`15141` durationMs=`9650` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t15: promptTokens=`15159` durationMs=`5250` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8595`
- t16: promptTokens=`12822` durationMs=`8787` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9833`

### Guarded Checkpoints
- travel-city-recall: turn=`15` passed=`true` answer=京都。
- release-codename-return: turn=`16` passed=`true` answer=首页固定代号是：**north-star-lantern**。

