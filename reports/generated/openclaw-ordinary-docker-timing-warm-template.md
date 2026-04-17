# OpenClaw Ordinary-Conversation Memory-Intent A/B

- generatedAt: `2026-04-17T06:36:48.836Z`
- comparedCases: `3`
- currentPassed: `0`
- legacyPassed: `0`
- bothPass: `0`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `3`
- currentCaptureObserved: `0`
- phaseOrder: `legacy first -> delete isolated legacy state -> current second`
- executionEnvironment: `docker`
- dockerImage: `ghcr.io/openclaw/openclaw:2026.4.2`

## Method

- Each case runs a real `openclaw agent --local` capture turn, then prunes session transcripts before the recall turn.
- The benchmark does not interleave systems case-by-case. It runs all `legacy builtin` cases first in isolated temp state roots, deletes those state roots, and only then runs all `current` Unified Memory Core cases in fresh isolated temp state roots.
- The runner now prebuilds one hermetic `legacy` base state and one hermetic `current` base state per benchmark run, including fixture copy, auth profile placement, and `openclaw.json` generation.
- Each case then clones one of those preconfigured base states instead of regenerating config and directory scaffolding from scratch.
- Each case still gets its own isolated state root so earlier cases cannot leak durable memory into later cases.
- Ordinary-conversation Docker eval does **not** seed from host `~/.openclaw` workspaces or host memory DBs. The only mounted host inputs are the auth profiles file and model/API credentials.
- State roots are built from the repo fixture root `/workspace/evals/openclaw-ordinary-conversation-fixture`, which is intentionally empty except for tracked scaffold files; no prior memory is preloaded.
- This isolates explicit long-memory behavior from short-lived session/bootstrap carry-over.
- `current` means the repo checkout loaded as the OpenClaw `unified-memory-core` context engine, with ordinary-conversation governed `memory_intent` enabled.
- `legacy` means the default `legacy` context engine with no `unified-memory-core` plugin loaded.
- OpenClaw ships a separate `memory-lancedb` plugin, but it is not active in the current host default config, so this focused A/B measures the actual current default host path rather than a hypothetical enabled-autoCapture setup.

## Isolation Checks

- totalRuns: `6`
- uniqueStateRoots: `6`
- duplicateStateRoots: `0`
- uniqueRegistryRoots: `3`
- duplicateRegistryRoots: `0`
- cleanupOk: `6`
- cleanupFailed: `0`
- sessionClearOk: `6`
- sessionClearFailed: `0`
- baseStateReuse: `true`
- legacyBaseStateKey: `legacy-0c28dcbc3c7dbf5d`
- currentBaseStateKey: `current-d0d90e2ef76bcc7a`
- templateCacheRoot: `/workspace/.cache/openclaw-ordinary-state-templates`
- templateCacheHits: legacy=`false`, current=`false`

## Phase Timing

- templatePrepMs: legacy=`81756`, current=`40761`
- legacy avg(ms): clone=`97`, capture=`30137`, wait=`0`, sessionClear=`5`, recall=`30071`, cleanup=`11`, total=`60324`
- legacy max(ms): clone=`118`, capture=`30319`, wait=`0`, sessionClear=`13`, recall=`30122`, cleanup=`14`, total=`60486`
- legacy timeouts: capture=`3`, recall=`3`
- current avg(ms): clone=`347`, capture=`30159`, wait=`12177`, sessionClear=`4`, recall=`30117`, cleanup=`54`, total=`72877`
- current max(ms): clone=`837`, capture=`30318`, wait=`12187`, sessionClear=`5`, recall=`30246`, cleanup=`141`, total=`73167`
- current timeouts: capture=`3`, recall=`3`

- Interpretation:
  - `duplicateStateRoots = 0` means every legacy/current run used a distinct temp OpenClaw state root.
  - `duplicateRegistryRoots = 0` means current-mode governed memory writes did not share registry directories across cases.
  - `cleanupFailed = 0` and `sessionClearFailed = 0` mean the runner both pruned session transcripts before recall and removed the temp state roots after each case.
  - If any of those counters drift, the benchmark should be treated as contaminated until re-run.

## Language Split

### English

- total: `1`
- currentPassed: `0`
- legacyPassed: `0`
- bothPass: `0`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `1`

### Chinese

- total: `2`
- currentPassed: `0`
- legacyPassed: `0`
- bothPass: `0`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `2`

## Category Split

### Durable Rule

- total: `2`
- currentPassed: `0`
- legacyPassed: `0`
- bothPass: `0`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `2`

### Tool Routing Preference

- total: `0`
- currentPassed: `0`
- legacyPassed: `0`
- bothPass: `0`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `0`

### User Profile Fact

- total: `1`
- currentPassed: `0`
- legacyPassed: `0`
- bothPass: `0`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `1`

### Session Constraint

- total: `0`
- currentPassed: `0`
- legacyPassed: `0`
- bothPass: `0`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `0`

### One-Off Instruction

- total: `0`
- currentPassed: `0`
- legacyPassed: `0`
- bothPass: `0`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `0`

## Per-Case Results

### ordinary-ab-en-rule-pr-comments-1

- language: `en`
- category: `durable_rule`
- outcome: `both_fail`
- currentCaptureObserved: `false`
- 设计的问题 -> A user defines a permanent pull-request review rule with the codename `cedar-comments`; recall should return the codename after the session transcript is removed.
- 预期的结果 -> It should answer with `cedar-comments`.
- captureMessage -> Going forward, any time I send a pull request link, first check unresolved review comments. The codename for that default rule is cedar-comments. Please remember it.
- recallMessage -> Based only on your memory for this agent, what codename should you use for my default pull request review rule? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> timeout after 30000ms (`fail`) 
- memory core 实际结果 -> timeout after 30000ms (`fail`) 

### ordinary-ab-zh-rule-hotels-1

- language: `zh`
- category: `durable_rule`
- outcome: `both_fail`
- currentCaptureObserved: `false`
- 设计的问题 -> 用户定义了长期酒店筛选规则，并把它命名为 `松针取消`；跨会话后应能召回这个代号。
- 预期的结果 -> 应答出 `松针取消`。
- captureMessage -> 以后只要我问酒店方案，你先看取消政策；这个默认旅行规则的代号叫做松针取消。记住它。
- recallMessage -> 只根据当前记忆，我默认的酒店筛选规则代号是什么？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> timeout after 30000ms (`fail`) 
- memory core 实际结果 -> timeout after 30000ms (`fail`) 

### ordinary-ab-zh-seat-1

- language: `zh`
- category: `user_profile_fact`
- outcome: `both_fail`
- currentCaptureObserved: `false`
- 设计的问题 -> 用户给出长期的飞行座位偏好；跨会话后应能召回靠过道和尽量前排。
- 预期的结果 -> 应答出靠过道，并最好提到前排。
- captureMessage -> 我坐飞机时更喜欢靠过道，而且尽量前排。记住这个出行偏好。
- recallMessage -> 只根据当前记忆，我坐飞机更喜欢什么位置？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> timeout after 30000ms (`fail`) 
- memory core 实际结果 -> timeout after 30000ms (`fail`) 

## Focused Conclusion

- On this focused realtime-write surface, current and legacy are tied on exclusive wins: `0` each.
- This suite is intentionally different from the earlier 100-case A/B: it tests live ordinary-conversation writing and then removes session transcripts before recall.
- That makes it the first direct probe of whether ordinary conversation itself can create durable recallable memory rather than merely improving consumption of an existing fixture.
