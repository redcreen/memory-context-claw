# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T05:18:53.570Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `2/2`
- averageBaselinePeakPromptTokens: `15219`
- averageGuardedPeakPromptTokens: `14360`
- averageBaselinePostSwitchPromptTokens: `15282`
- averageGuardedPostSwitchPromptTokens: `13374`
- averageBaselineRollbackRatio: `-0.0041`
- averageGuardedRollbackRatio: `0.0687`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.1249`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## probe-release-then-travel-switch
- description: A long release-planning thread should shrink after switching to travel while preserving the original project codename for a later return.
- baseline peakBeforeSwitch: `15219`
- guarded peakBeforeSwitch: `14360`
- baseline postSwitchMin: `15282`
- guarded postSwitchMin: `13374`
- baseline rollbackRatio: `-0.0041`
- guarded rollbackRatio: `0.0687`
- guarded postSwitch savings vs baseline: `0.1249`
- guarded applied turns in switch window: `1`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`14095` durationMs=`10127`
- t2: promptTokens=`13967` durationMs=`5225`
- t3: promptTokens=`14045` durationMs=`6870`
- t4: promptTokens=`14235` durationMs=`5195`
- t5: promptTokens=`14589` durationMs=`4072`
- t6: promptTokens=`14997` durationMs=`13008`
- t7: promptTokens=`15219` durationMs=`5201`
- t8: promptTokens=`15282` durationMs=`9309`
- t9: promptTokens=`15974` durationMs=`4985`
- t10: promptTokens=`15999` durationMs=`5482`
- t11: promptTokens=`16026` durationMs=`5982`

### Guarded Turns
- t1: promptTokens=`13681` durationMs=`10629` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`13566` durationMs=`6330` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`13643` durationMs=`6260` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t4: promptTokens=`13838` durationMs=`7824` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t5: promptTokens=`14205` durationMs=`5078` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t6: promptTokens=`14168` durationMs=`6054` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t7: promptTokens=`14360` durationMs=`6102` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t8: promptTokens=`13374` durationMs=`7682` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9412`
- t9: promptTokens=`14908` durationMs=`4169` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t10: promptTokens=`14926` durationMs=`5669` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8277`
- t11: promptTokens=`13611` durationMs=`10099` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9786`

### Guarded Checkpoints
- travel-city-recall: turn=`10` passed=`true` answer=你更想住的是 **京都**。
- release-codename-return: turn=`11` passed=`true` answer=north-star-lantern

