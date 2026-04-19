# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T04:05:38.000Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `2/2`
- averageBaselinePeakPromptTokens: `14659`
- averageGuardedPeakPromptTokens: `15183`
- averageBaselinePostSwitchPromptTokens: `14680`
- averageGuardedPostSwitchPromptTokens: `13603`
- averageBaselineRollbackRatio: `-0.0014`
- averageGuardedRollbackRatio: `0.1041`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.0734`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## probe-release-then-travel-switch
- description: A long release-planning thread should shrink after switching to travel while preserving the original project codename for a later return.
- baseline peakBeforeSwitch: `14659`
- guarded peakBeforeSwitch: `15183`
- baseline postSwitchMin: `14680`
- guarded postSwitchMin: `13603`
- baseline rollbackRatio: `-0.0014`
- guarded rollbackRatio: `0.1041`
- guarded postSwitch savings vs baseline: `0.0734`
- guarded applied turns in switch window: `1`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`14031` durationMs=`8713`
- t2: promptTokens=`13902` durationMs=`4618`
- t3: promptTokens=`13932` durationMs=`5112`
- t4: promptTokens=`14143` durationMs=`5271`
- t5: promptTokens=`14503` durationMs=`3581`
- t6: promptTokens=`14467` durationMs=`6162`
- t7: promptTokens=`14659` durationMs=`4098`
- t8: promptTokens=`14680` durationMs=`7065`
- t9: promptTokens=`15276` durationMs=`6018`
- t10: promptTokens=`15294` durationMs=`3617`
- t11: promptTokens=`15322` durationMs=`3818`

### Guarded Turns
- t1: promptTokens=`14020` durationMs=`8592` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`13915` durationMs=`5139` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`14033` durationMs=`5411` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t4: promptTokens=`14220` durationMs=`8225` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t5: promptTokens=`14572` durationMs=`3840` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t6: promptTokens=`14947` durationMs=`9845` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t7: promptTokens=`15183` durationMs=`7884` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t8: promptTokens=`13603` durationMs=`15001` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9468`
- t9: promptTokens=`16325` durationMs=`3755` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t10: promptTokens=`16350` durationMs=`4733` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t11: promptTokens=`13629` durationMs=`4249` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9826`

### Guarded Checkpoints
- travel-city-recall: turn=`10` passed=`true` answer=京都。
- release-codename-return: turn=`11` passed=`true` answer=north-star-lantern

