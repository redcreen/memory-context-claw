# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T03:16:37.985Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `2`
- guardedCasesOk: `2/2`
- guardedCheckpointPasses: `4/4`
- averageBaselinePeakPromptTokens: `14856`
- averageGuardedPeakPromptTokens: `14915`
- averageBaselinePostSwitchPromptTokens: `14628`
- averageGuardedPostSwitchPromptTokens: `13620`
- averageBaselineRollbackRatio: `0.0146`
- averageGuardedRollbackRatio: `0.0857`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.0688`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## probe-release-then-travel-switch
- description: A long release-planning thread should shrink after switching to travel while preserving the original project codename for a later return.
- baseline peakBeforeSwitch: `14350`
- guarded peakBeforeSwitch: `14363`
- baseline postSwitchMin: `14414`
- guarded postSwitchMin: `13554`
- baseline rollbackRatio: `-0.0045`
- guarded rollbackRatio: `0.0563`
- guarded postSwitch savings vs baseline: `0.0597`
- guarded applied turns in switch window: `3`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`13681` durationMs=`8439`
- t2: promptTokens=`13593` durationMs=`4960`
- t3: promptTokens=`13653` durationMs=`4810`
- t4: promptTokens=`13837` durationMs=`7967`
- t5: promptTokens=`14190` durationMs=`4045`
- t6: promptTokens=`14154` durationMs=`5281`
- t7: promptTokens=`14350` durationMs=`6975`
- t8: promptTokens=`14414` durationMs=`9604`
- t9: promptTokens=`15350` durationMs=`4967`
- t10: promptTokens=`15366` durationMs=`4357`
- t11: promptTokens=`15393` durationMs=`4137`

### Guarded Turns
- t1: promptTokens=`13691` durationMs=`5771` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`13576` durationMs=`8413` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`13686` durationMs=`23048` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.5638`
- t4: promptTokens=`13630` durationMs=`17678` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.6708`
- t5: promptTokens=`13634` durationMs=`17335` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.7793`
- t6: promptTokens=`13605` durationMs=`12921` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.8684`
- t7: promptTokens=`14363` durationMs=`12877` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.7548`
- t8: promptTokens=`13554` durationMs=`15854` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9478`
- t9: promptTokens=`14566` durationMs=`13506` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.8167`
- t10: promptTokens=`14600` durationMs=`14373` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.8249`
- t11: promptTokens=`14444` durationMs=`12527` guardedApplied=`true` relation=`resolve` packageReductionRatio=`0.9083`

### Guarded Checkpoints
- travel-city-recall: turn=`10` passed=`true` answer=你更想住的是 **京都**。
- release-codename-return: turn=`11` passed=`true` answer=`north-star-lantern`

## probe-editor-then-cooking-switch
- description: A long editor/workflow thread should shrink after switching to cooking while preserving the newer current editor fact.
- baseline peakBeforeSwitch: `15362`
- guarded peakBeforeSwitch: `15466`
- baseline postSwitchMin: `14842`
- guarded postSwitchMin: `13686`
- baseline rollbackRatio: `0.0338`
- guarded rollbackRatio: `0.1151`
- guarded postSwitch savings vs baseline: `0.0779`
- guarded applied turns in switch window: `3`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`13681` durationMs=`6712`
- t2: promptTokens=`14179` durationMs=`7800`
- t3: promptTokens=`13796` durationMs=`7479`
- t4: promptTokens=`14051` durationMs=`7072`
- t5: promptTokens=`14465` durationMs=`15209`
- t6: promptTokens=`14567` durationMs=`8980`
- t7: promptTokens=`15362` durationMs=`8670`
- t8: promptTokens=`14842` durationMs=`20231`
- t9: promptTokens=`15451` durationMs=`4763`
- t10: promptTokens=`15534` durationMs=`4425`
- t11: promptTokens=`16090` durationMs=`5060`

### Guarded Turns
- t1: promptTokens=`13701` durationMs=`7311` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`14299` durationMs=`19007` guardedApplied=`false` relation=`resolve` packageReductionRatio=`0.2941`
- t3: promptTokens=`13895` durationMs=`17637` guardedApplied=`true` relation=`resolve` packageReductionRatio=`0.5588`
- t4: promptTokens=`14091` durationMs=`16577` guardedApplied=`true` relation=`resolve` packageReductionRatio=`0.5417`
- t5: promptTokens=`14730` durationMs=`17692` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.3119`
- t6: promptTokens=`14775` durationMs=`15134` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.4357`
- t7: promptTokens=`15466` durationMs=`17447` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.5497`
- t8: promptTokens=`13742` durationMs=`15518` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9124`
- t9: promptTokens=`14386` durationMs=`15531` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.6103`
- t10: promptTokens=`13686` durationMs=`15837` guardedApplied=`true` relation=`resolve` packageReductionRatio=`0.9603`
- t11: promptTokens=`14379` durationMs=`23834` guardedApplied=`true` relation=`resolve` packageReductionRatio=`0.9705`

### Guarded Checkpoints
- cooking-main-protein: turn=`10` passed=`true` answer=牛腩。
- editor-current-value-return: turn=`11` passed=`true` answer=你现在默认编辑器是 **Zed**。

