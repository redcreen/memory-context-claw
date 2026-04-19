# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T04:50:42.076Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `2/2`
- averageBaselinePeakPromptTokens: `14445`
- averageGuardedPeakPromptTokens: `14479`
- averageBaselinePostSwitchPromptTokens: `14490`
- averageGuardedPostSwitchPromptTokens: `13544`
- averageBaselineRollbackRatio: `-0.0031`
- averageGuardedRollbackRatio: `0.0646`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.0653`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## probe-release-then-travel-switch
- description: A long release-planning thread should shrink after switching to travel while preserving the original project codename for a later return.
- baseline peakBeforeSwitch: `14445`
- guarded peakBeforeSwitch: `14479`
- baseline postSwitchMin: `14490`
- guarded postSwitchMin: `13544`
- baseline rollbackRatio: `-0.0031`
- guarded rollbackRatio: `0.0646`
- guarded postSwitch savings vs baseline: `0.0653`
- guarded applied turns in switch window: `1`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`13691` durationMs=`5021`
- t2: promptTokens=`13605` durationMs=`4855`
- t3: promptTokens=`13729` durationMs=`16571`
- t4: promptTokens=`13922` durationMs=`4909`
- t5: promptTokens=`14286` durationMs=`3636`
- t6: promptTokens=`14250` durationMs=`3607`
- t7: promptTokens=`14445` durationMs=`3961`
- t8: promptTokens=`14490` durationMs=`11094`
- t9: promptTokens=`15465` durationMs=`7330`
- t10: promptTokens=`15489` durationMs=`8840`
- t11: promptTokens=`15516` durationMs=`4107`

### Guarded Turns
- t1: promptTokens=`13681` durationMs=`7733` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`13592` durationMs=`4703` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`13725` durationMs=`6013` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t4: promptTokens=`13928` durationMs=`15049` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t5: promptTokens=`14315` durationMs=`4688` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t6: promptTokens=`14278` durationMs=`7456` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t7: promptTokens=`14479` durationMs=`7108` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t8: promptTokens=`13544` durationMs=`8919` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9536`
- t9: promptTokens=`15413` durationMs=`4238` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t10: promptTokens=`15419` durationMs=`3962` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8727`
- t11: promptTokens=`13570` durationMs=`3797` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9841`

### Guarded Checkpoints
- travel-city-recall: turn=`10` passed=`true` answer=你更想住的是 **京都**。
- release-codename-return: turn=`11` passed=`true` answer=第一页固定写 **north-star-lantern**。

