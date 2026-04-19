# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T03:21:23.062Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `2/2`
- averageBaselinePeakPromptTokens: `15167`
- averageGuardedPeakPromptTokens: `15160`
- averageBaselinePostSwitchPromptTokens: `15212`
- averageGuardedPostSwitchPromptTokens: `13607`
- averageBaselineRollbackRatio: `-0.003`
- averageGuardedRollbackRatio: `0.1024`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.1055`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## probe-release-then-travel-switch
- description: A long release-planning thread should shrink after switching to travel while preserving the original project codename for a later return.
- baseline peakBeforeSwitch: `15167`
- guarded peakBeforeSwitch: `15160`
- baseline postSwitchMin: `15212`
- guarded postSwitchMin: `13607`
- baseline rollbackRatio: `-0.003`
- guarded rollbackRatio: `0.1024`
- guarded postSwitch savings vs baseline: `0.1055`
- guarded applied turns in switch window: `3`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`14027` durationMs=`8850`
- t2: promptTokens=`13941` durationMs=`6813`
- t3: promptTokens=`14013` durationMs=`4777`
- t4: promptTokens=`14206` durationMs=`6392`
- t5: promptTokens=`14571` durationMs=`4395`
- t6: promptTokens=`14937` durationMs=`13222`
- t7: promptTokens=`15167` durationMs=`5612`
- t8: promptTokens=`15212` durationMs=`7215`
- t9: promptTokens=`15701` durationMs=`4629`
- t10: promptTokens=`15732` durationMs=`6188`
- t11: promptTokens=`15759` durationMs=`4746`

### Guarded Turns
- t1: promptTokens=`14073` durationMs=`10657` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`13962` durationMs=`5692` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`14037` durationMs=`18001` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.6694`
- t4: promptTokens=`14036` durationMs=`13801` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.6916`
- t5: promptTokens=`14038` durationMs=`14747` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.7508`
- t6: promptTokens=`15160` durationMs=`23521` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8065`
- t7: promptTokens=`14640` durationMs=`13596` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.8375`
- t8: promptTokens=`13607` durationMs=`15385` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9510`
- t9: promptTokens=`14111` durationMs=`12995` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9386`
- t10: promptTokens=`14244` durationMs=`15046` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.8437`
- t11: promptTokens=`16151` durationMs=`13537` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8259`

### Guarded Checkpoints
- travel-city-recall: turn=`10` passed=`true` answer=京都。
- release-codename-return: turn=`11` passed=`true` answer=`north-star-lantern`

