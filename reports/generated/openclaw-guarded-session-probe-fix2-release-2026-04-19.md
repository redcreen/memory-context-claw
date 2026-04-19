# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T03:42:46.987Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `2/2`
- averageBaselinePeakPromptTokens: `14452`
- averageGuardedPeakPromptTokens: `14551`
- averageBaselinePostSwitchPromptTokens: `14519`
- averageGuardedPostSwitchPromptTokens: `14511`
- averageBaselineRollbackRatio: `-0.0046`
- averageGuardedRollbackRatio: `0.0027`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.0006`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## probe-release-then-travel-switch
- description: A long release-planning thread should shrink after switching to travel while preserving the original project codename for a later return.
- baseline peakBeforeSwitch: `14452`
- guarded peakBeforeSwitch: `14551`
- baseline postSwitchMin: `14519`
- guarded postSwitchMin: `14511`
- baseline rollbackRatio: `-0.0046`
- guarded rollbackRatio: `0.0027`
- guarded postSwitch savings vs baseline: `0.0006`
- guarded applied turns in switch window: `2`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`13701` durationMs=`4500`
- t2: promptTokens=`13597` durationMs=`6362`
- t3: promptTokens=`13664` durationMs=`6715`
- t4: promptTokens=`13847` durationMs=`4987`
- t5: promptTokens=`14207` durationMs=`4230`
- t6: promptTokens=`14251` durationMs=`5381`
- t7: promptTokens=`14452` durationMs=`4033`
- t8: promptTokens=`14519` durationMs=`7706`
- t9: promptTokens=`15184` durationMs=`4097`
- t10: promptTokens=`15198` durationMs=`3866`
- t11: promptTokens=`15227` durationMs=`4786`

### Guarded Turns
- t1: promptTokens=`14065` durationMs=`7943` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`13935` durationMs=`5393` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`14002` durationMs=`11839` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.3839`
- t4: promptTokens=`14192` durationMs=`13009` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.4603`
- t5: promptTokens=`14551` durationMs=`13371` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8000`
- t6: promptTokens=`13980` durationMs=`13696` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.7538`
- t7: promptTokens=`14121` durationMs=`14424` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.7394`
- t8: promptTokens=`14511` durationMs=`18075` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.4884`
- t9: promptTokens=`15784` durationMs=`13762` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8169`
- t10: promptTokens=`14535` durationMs=`20220` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.7574`
- t11: promptTokens=`13893` durationMs=`13282` guardedApplied=`true` relation=`resolve` packageReductionRatio=`0.9235`

### Guarded Checkpoints
- travel-city-recall: turn=`10` passed=`true` answer=你更想住的城市是：**京都**。
- release-codename-return: turn=`11` passed=`true` answer=north-star-lantern

