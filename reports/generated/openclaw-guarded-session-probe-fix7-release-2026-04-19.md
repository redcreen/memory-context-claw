# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T05:00:55.494Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `2/2`
- averageBaselinePeakPromptTokens: `14524`
- averageGuardedPeakPromptTokens: `14364`
- averageBaselinePostSwitchPromptTokens: `14545`
- averageGuardedPostSwitchPromptTokens: `13343`
- averageBaselineRollbackRatio: `-0.0014`
- averageGuardedRollbackRatio: `0.0711`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.0826`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## probe-release-then-travel-switch
- description: A long release-planning thread should shrink after switching to travel while preserving the original project codename for a later return.
- baseline peakBeforeSwitch: `14524`
- guarded peakBeforeSwitch: `14364`
- baseline postSwitchMin: `14545`
- guarded postSwitchMin: `13343`
- baseline rollbackRatio: `-0.0014`
- guarded rollbackRatio: `0.0711`
- guarded postSwitch savings vs baseline: `0.0826`
- guarded applied turns in switch window: `1`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`13894` durationMs=`9644`
- t2: promptTokens=`13764` durationMs=`4785`
- t3: promptTokens=`13829` durationMs=`7587`
- t4: promptTokens=`14016` durationMs=`7253`
- t5: promptTokens=`14371` durationMs=`5405`
- t6: promptTokens=`14334` durationMs=`5311`
- t7: promptTokens=`14524` durationMs=`5262`
- t8: promptTokens=`14545` durationMs=`7353`
- t9: promptTokens=`15048` durationMs=`4754`
- t10: promptTokens=`15072` durationMs=`4602`
- t11: promptTokens=`15099` durationMs=`4646`

### Guarded Turns
- t1: promptTokens=`13691` durationMs=`5990` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`13594` durationMs=`5834` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`13661` durationMs=`6855` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t4: promptTokens=`13842` durationMs=`7356` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t5: promptTokens=`14203` durationMs=`6479` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t6: promptTokens=`14167` durationMs=`5709` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t7: promptTokens=`14364` durationMs=`15401` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t8: promptTokens=`13343` durationMs=`9186` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9427`
- t9: promptTokens=`15165` durationMs=`6840` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t10: promptTokens=`15189` durationMs=`4117` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8524`
- t11: promptTokens=`15597` durationMs=`8346` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9816`

### Guarded Checkpoints
- travel-city-recall: turn=`10` passed=`true` answer=你更想住的是 **京都**。
- release-codename-return: turn=`11` passed=`true` answer=发布方案第一页固定代号是 **north-star-lantern**。

如果你要我继续，我也可以顺手把“这个发布方案”的默认回答方式再按你的要求整理成一句固定模板。

