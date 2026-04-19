# OpenClaw Guarded Session Probe

- generatedAt: `2026-04-19T06:24:42.091Z`
- agentModel: `openai-codex/gpt-5.4-mini`
- shadowModel: `gpt-5.4-mini`
- reasoningEffort: `low`
- transport: `codex_exec`
- total: `1`
- guardedCasesOk: `1/1`
- guardedCheckpointPasses: `2/2`
- averageBaselinePeakPromptTokens: `16128`
- averageGuardedPeakPromptTokens: `16519`
- averageBaselinePostSwitchPromptTokens: `16323`
- averageGuardedPostSwitchPromptTokens: `13493`
- averageBaselineRollbackRatio: `-0.0121`
- averageGuardedRollbackRatio: `0.1832`
- averageBaselineThresholdCrossTurn: `16`
- averageGuardedThresholdCrossTurn: `15`
- averageGuardedVsBaselinePostSwitchSavingsRatio: `0.1734`

## Method

- Run each case inside one continuous hermetic OpenClaw session so per-turn `promptTokens` reflect the actual host request payload size seen by the LLM.
- Compare `baseline` and `guarded` using the same long-turn script and the same hermetic fixture state.
- Focus the main metric on prompt rollback after the first explicit topic switch, using the minimum prompt token count inside a `1-3` turn post-switch window.
- No manual `compact` is used anywhere in the probe.

## threshold-release-to-travel-without-compact
- description: A practical near-compaction proxy: keep one dense release thread growing until it crosses a 16k prompt-token threshold, then switch topics and verify guarded pulls the real prompt back below that threshold without manual compact.
- baseline peakBeforeSwitch: `16128`
- guarded peakBeforeSwitch: `16519`
- baseline postSwitchMin: `16323`
- guarded postSwitchMin: `13493`
- baseline rollbackRatio: `-0.0121`
- guarded rollbackRatio: `0.1832`
- guarded postSwitch savings vs baseline: `0.1734`
- compactAvoidedByGuarded: `true`
- guarded applied turns in switch window: `2`
- compact proxy threshold: `16000`
- baseline firstThresholdCrossTurn: `17`
- guarded firstThresholdCrossTurn: `16`
- baseline postSwitchBelowThresholdTurns: `0/4`
- guarded postSwitchBelowThresholdTurns: `2/4`
- baseline turnsAtOrAboveThreshold: `6`
- guarded turnsAtOrAboveThreshold: `4`
- guarded checkpoints: `2/2`
- baseline checkpoints: `2/2`

### Baseline Turns
- t1: promptTokens=`13344` durationMs=`5651`
- t2: promptTokens=`13528` durationMs=`6961`
- t3: promptTokens=`13814` durationMs=`5324`
- t4: promptTokens=`14277` durationMs=`4172`
- t5: promptTokens=`14279` durationMs=`6007`
- t6: promptTokens=`14141` durationMs=`4348`
- t7: promptTokens=`14352` durationMs=`4858`
- t8: promptTokens=`14573` durationMs=`4724`
- t9: promptTokens=`14652` durationMs=`4018`
- t10: promptTokens=`14989` durationMs=`5426`
- t11: promptTokens=`14978` durationMs=`7340`
- t12: promptTokens=`15241` durationMs=`9856`
- t13: promptTokens=`15388` durationMs=`5776`
- t14: promptTokens=`15426` durationMs=`7112`
- t15: promptTokens=`15603` durationMs=`6085`
- t16: promptTokens=`15756` durationMs=`6069`
- t17: promptTokens=`16038` durationMs=`6494`
- t18: promptTokens=`16128` durationMs=`4205`
- t19: promptTokens=`16323` durationMs=`11358`
- t20: promptTokens=`17636` durationMs=`4799`
- t21: promptTokens=`17731` durationMs=`3851`
- t22: promptTokens=`17912` durationMs=`5180`

### Guarded Turns
- t1: promptTokens=`13735` durationMs=`10149` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t2: promptTokens=`13906` durationMs=`4516` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t3: promptTokens=`14038` durationMs=`20761` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.5278`
- t4: promptTokens=`14762` durationMs=`7117` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t5: promptTokens=`14763` durationMs=`7048` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t6: promptTokens=`14625` durationMs=`4941` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t7: promptTokens=`14863` durationMs=`10178` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t8: promptTokens=`15089` durationMs=`5978` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t9: promptTokens=`15140` durationMs=`5003` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t10: promptTokens=`15481` durationMs=`5529` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t11: promptTokens=`15492` durationMs=`4451` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t12: promptTokens=`15749` durationMs=`4822` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t13: promptTokens=`15895` durationMs=`5349` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t14: promptTokens=`15940` durationMs=`4587` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t15: promptTokens=`14909` durationMs=`15778` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.8879`
- t16: promptTokens=`16244` durationMs=`4831` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t17: promptTokens=`16519` durationMs=`3871` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t18: promptTokens=`15376` durationMs=`16691` guardedApplied=`true` relation=`continue` packageReductionRatio=`0.8807`
- t19: promptTokens=`13493` durationMs=`11115` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9581`
- t20: promptTokens=`17870` durationMs=`4928` guardedApplied=`false` relation=`` packageReductionRatio=`0.0000`
- t21: promptTokens=`17918` durationMs=`5201` guardedApplied=`false` relation=`continue` packageReductionRatio=`0.8472`
- t22: promptTokens=`13601` durationMs=`9638` guardedApplied=`true` relation=`switch` packageReductionRatio=`0.9829`

### Guarded Checkpoints
- travel-city-recall: turn=`21` passed=`true` answer=京都。
- release-codename-return: turn=`22` passed=`true` answer=north-star-lantern

