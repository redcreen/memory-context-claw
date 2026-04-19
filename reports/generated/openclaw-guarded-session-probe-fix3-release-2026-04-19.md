# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T03:50:12.513Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `2/2`
- averageBaselinePeakPromptTokens: `14309`
- averageGuardedPeakPromptTokens: `14378`
- averageBaselinePostSwitchPromptTokens: `14329`
- averageGuardedPostSwitchPromptTokens: `13549`
- averageBaselineRollbackRatio: `-0.0014`
- averageGuardedRollbackRatio: `0.0577`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.0544`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## probe-release-then-travel-switch
- description: A long release-planning thread should shrink after switching to travel while preserving the original project codename for a later return.
- baseline peakBeforeSwitch: `14309`
- guarded peakBeforeSwitch: `14378`
- baseline postSwitchMin: `14329`
- guarded postSwitchMin: `13549`
- baseline rollbackRatio: `-0.0014`
- guarded rollbackRatio: `0.0577`
- guarded postSwitch savings vs baseline: `0.0544`
- guarded applied turns in switch window: `1`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`13681` durationMs=`3633`
- t2: promptTokens=`13566` durationMs=`6432`
- t3: promptTokens=`13601` durationMs=`6077`
- t4: promptTokens=`13790` durationMs=`4403`
- t5: promptTokens=`14153` durationMs=`3206`
- t6: promptTokens=`14118` durationMs=`5046`
- t7: promptTokens=`14309` durationMs=`3843`
- t8: promptTokens=`14329` durationMs=`8044`
- t9: promptTokens=`15111` durationMs=`4064`
- t10: promptTokens=`15131` durationMs=`4723`
- t11: promptTokens=`15158` durationMs=`4468`

### Guarded Turns
- t1: promptTokens=`13691` durationMs=`6465` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`13577` durationMs=`5252` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`13639` durationMs=`4729` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t4: promptTokens=`13828` durationMs=`8198` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t5: promptTokens=`14193` durationMs=`5749` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t6: promptTokens=`14181` durationMs=`9462` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t7: promptTokens=`14378` durationMs=`7898` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t8: promptTokens=`13549` durationMs=`17791` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.8670`
- t9: promptTokens=`15248` durationMs=`4713` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t10: promptTokens=`15272` durationMs=`4651` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t11: promptTokens=`14578` durationMs=`13641` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.7381`

### Guarded Checkpoints
- travel-city-recall: turn=`10` passed=`true` answer=你更想住的是 **京都**。
- release-codename-return: turn=`11` passed=`true` answer=north-star-lantern

