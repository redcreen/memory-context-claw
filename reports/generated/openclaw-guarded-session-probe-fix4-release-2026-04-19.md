# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T04:05:01.379Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `2/2`
- averageBaselinePeakPromptTokens: `17406`
- averageGuardedPeakPromptTokens: `14367`
- averageBaselinePostSwitchPromptTokens: `17077`
- averageGuardedPostSwitchPromptTokens: `13554`
- averageBaselineRollbackRatio: `0.0189`
- averageGuardedRollbackRatio: `0.0566`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.2063`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## probe-release-then-travel-switch
- description: A long release-planning thread should shrink after switching to travel while preserving the original project codename for a later return.
- baseline peakBeforeSwitch: `17406`
- guarded peakBeforeSwitch: `14367`
- baseline postSwitchMin: `17077`
- guarded postSwitchMin: `13554`
- baseline rollbackRatio: `0.0189`
- guarded rollbackRatio: `0.0566`
- guarded postSwitch savings vs baseline: `0.2063`
- guarded applied turns in switch window: `1`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`14936` durationMs=`9270`
- t2: promptTokens=`14790` durationMs=`4974`
- t3: promptTokens=`14934` durationMs=`6795`
- t4: promptTokens=`15133` durationMs=`5134`
- t5: promptTokens=`15505` durationMs=`4441`
- t6: promptTokens=`16830` durationMs=`19289`
- t7: promptTokens=`17406` durationMs=`4517`
- t8: promptTokens=`17077` durationMs=`9411`
- t9: promptTokens=`17822` durationMs=`5401`
- t10: promptTokens=`17846` durationMs=`4347`
- t11: promptTokens=`17873` durationMs=`4177`

### Guarded Turns
- t1: promptTokens=`13691` durationMs=`4533` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`13578` durationMs=`5471` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`13653` durationMs=`5732` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t4: promptTokens=`13844` durationMs=`6197` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t5: promptTokens=`14207` durationMs=`5059` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t6: promptTokens=`14172` durationMs=`5000` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t7: promptTokens=`14367` durationMs=`5152` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t8: promptTokens=`13554` durationMs=`10544` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9442`
- t9: promptTokens=`15464` durationMs=`5628` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t10: promptTokens=`15484` durationMs=`5143` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t11: promptTokens=`13580` durationMs=`4234` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9821`

### Guarded Checkpoints
- travel-city-recall: turn=`10` passed=`true` answer=你更想住的是 **京都**。
- release-codename-return: turn=`11` passed=`true` answer=north-star-lantern

