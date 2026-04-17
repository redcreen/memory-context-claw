# OpenClaw Ordinary-Conversation Memory-Intent A/B

- generatedAt: `2026-04-17T10:02:57.666Z`
- comparedCases: `40`
- currentPassed: `32`
- legacyPassed: `17`
- bothPass: `15`
- umcOnly: `17`
- legacyOnly: `2`
- bothFail: `6`
- currentCaptureObserved: `29`
- phaseOrder: `legacy first -> delete isolated legacy state -> current second`
- executionEnvironment: `docker`
- runnerMode: `gateway-steady`
- shardCount: `4`
- fastFailCapture: `true`
- dockerImage: `ghcr.io/openclaw/openclaw:2026.4.2`
- totalWallClockMs: `1347259`

## Method

- Each shard now boots one warmed `openclaw gateway run` process and reuses it across multiple cases instead of spawning `openclaw agent --local` for every turn.
- The benchmark still does not interleave systems case-by-case. It runs all `legacy builtin` shards first, then all `current` Unified Memory Core shards second.
- Each shard owns one isolated temp state root cloned from a warmed hermetic base state.
- Before every case, the shard state is reset back to the warmed base snapshot for `agentDir`, `workspace`, `sessions`, and `registry` so earlier cases cannot leave durable memory behind.
- Capture and recall both go through `gateway call agent`, which removes the worst `agent --local` CLI tail latency while keeping the same isolated Docker substrate.
- Ordinary-conversation Docker eval does **not** seed from host `~/.openclaw` workspaces or host memory DBs. The only mounted host inputs are the auth profiles file and model/API credentials.
- State roots are built from the repo fixture root `/workspace/evals/openclaw-ordinary-conversation-fixture`, which is intentionally empty except for tracked scaffold files; no prior memory is preloaded.
- This isolates explicit long-memory behavior from short-lived session/bootstrap carry-over.
- `current` means the repo checkout loaded as the OpenClaw `unified-memory-core` context engine, with ordinary-conversation governed `memory_intent` enabled.
- `legacy` means the default `legacy` context engine with no `unified-memory-core` plugin loaded.
- OpenClaw ships a separate `memory-lancedb` plugin, but it is not active in the current host default config, so this focused A/B measures the actual current default host path rather than a hypothetical enabled-autoCapture setup.

## Isolation Checks

- totalRuns: `80`
- uniqueStateRoots: `8`
- duplicateStateRoots: `72`
- uniqueRegistryRoots: `4`
- duplicateRegistryRoots: `36`
- cleanupOk: `80`
- cleanupFailed: `0`
- sessionClearOk: `80`
- sessionClearFailed: `0`
- preCaseResetOk: `80`
- preCaseResetFailed: `0`
- baseStateReuse: `true`
- legacyBaseStateKey: `legacy-ca9f1284bff4f0d4`
- currentBaseStateKey: `current-88cd89e0103c02a9`
- templateCacheRoot: `/workspace/.cache/openclaw-ordinary-state-templates`
- templateCacheHits: legacy=`true`, current=`true`

## Phase Timing

- templatePrepMs: legacy=`47`, current=`34`
- legacy avg(ms): clone=`0`, reset=`307`, capture=`37264`, wait=`0`, sessionClear=`31`, recall=`20900`, cleanup=`0`, total=`58504`
- legacy max(ms): clone=`0`, reset=`1611`, capture=`65065`, wait=`0`, sessionClear=`156`, recall=`29296`, cleanup=`0`, total=`91927`
- legacy timeouts: capture=`5`, recall=`0`
- current avg(ms): clone=`0`, reset=`358`, capture=`37761`, wait=`2`, sessionClear=`11`, recall=`21602`, cleanup=`0`, total=`59733`
- current max(ms): clone=`0`, reset=`1514`, capture=`65066`, wait=`8`, sessionClear=`61`, recall=`38734`, cleanup=`0`, total=`90460`
- current timeouts: capture=`3`, recall=`0`

- Interpretation:
  - In `gateway-steady` mode, duplicate state roots are expected inside each shard because one warmed shard state is reused across multiple cases.
  - The hard isolation guard moves to `preCaseResetFailed = 0`: every case must start from a restored baseline for agent/workspace/session/registry state.
  - `cleanupFailed = 0` and `sessionClearFailed = 0` mean the runner both pruned session transcripts before recall and removed the temp state roots after each case or shard.
  - If any of those counters drift, the benchmark should be treated as contaminated until re-run.

## Language Split

### English

- total: `20`
- currentPassed: `13`
- legacyPassed: `9`
- bothPass: `8`
- umcOnly: `5`
- legacyOnly: `1`
- bothFail: `6`

### Chinese

- total: `20`
- currentPassed: `19`
- legacyPassed: `8`
- bothPass: `7`
- umcOnly: `12`
- legacyOnly: `1`
- bothFail: `0`

## Category Split

### Durable Rule

- total: `8`
- currentPassed: `4`
- legacyPassed: `0`
- bothPass: `0`
- umcOnly: `4`
- legacyOnly: `0`
- bothFail: `4`

### Tool Routing Preference

- total: `8`
- currentPassed: `6`
- legacyPassed: `1`
- bothPass: `0`
- umcOnly: `6`
- legacyOnly: `1`
- bothFail: `1`

### User Profile Fact

- total: `8`
- currentPassed: `7`
- legacyPassed: `0`
- bothPass: `0`
- umcOnly: `7`
- legacyOnly: `0`
- bothFail: `1`

### Session Constraint

- total: `8`
- currentPassed: `8`
- legacyPassed: `8`
- bothPass: `8`
- umcOnly: `0`
- legacyOnly: `0`
- bothFail: `0`

### One-Off Instruction

- total: `8`
- currentPassed: `7`
- legacyPassed: `8`
- bothPass: `7`
- umcOnly: `0`
- legacyOnly: `1`
- bothFail: `0`

## Per-Case Results

### ordinary-ab-en-rule-releases-1

- language: `en`
- category: `durable_rule`
- outcome: `both_fail`
- currentCaptureObserved: `false`
- 设计的问题 -> A user states a long-lived GitHub workflow rule and gives it the keyword `saffron-releases`; after session pruning, the agent should still recall the keyword.
- 预期的结果 -> It should answer with the keyword `saffron-releases` rather than refusing.
- captureMessage -> From now on, whenever I send a GitHub repository link, use the keyword saffron-releases to remind yourself to check the Releases tab first. Remember this as my default workflow.
- recallMessage -> Based only on your memory for this agent, what keyword should you use when I send a GitHub repository link? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> skipped_due_to_capture_failure (`fail`)
- memory core 实际结果 -> skipped_due_to_capture_failure (`fail`)

### ordinary-ab-en-rule-pr-comments-1

- language: `en`
- category: `durable_rule`
- outcome: `both_fail`
- currentCaptureObserved: `true`
- 设计的问题 -> A user defines a permanent pull-request review rule with the codename `cedar-comments`; recall should return the codename after the session transcript is removed.
- 预期的结果 -> It should answer with `cedar-comments`.
- captureMessage -> Going forward, any time I send a pull request link, first check unresolved review comments. The codename for that default rule is cedar-comments. Please remember it.
- recallMessage -> Based only on your memory for this agent, what codename should you use for my default pull request review rule? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> skipped_due_to_capture_failure (`fail`)
- memory core 实际结果 -> I don't know based on current memory. (`fail`)

### ordinary-ab-en-rule-csv-1

- language: `en`
- category: `durable_rule`
- outcome: `both_fail`
- currentCaptureObserved: `true`
- 设计的问题 -> A user defines a durable CSV review rule with the keyword `silver-headers`; recall should preserve that named rule.
- 预期的结果 -> It should answer with `silver-headers`.
- captureMessage -> From now on, whenever I ask you to review a CSV export, first compare the column headers before anything else. The keyword for that default workflow is silver-headers. Remember this.
- recallMessage -> Based only on your memory for this agent, what keyword should you use for my default CSV review workflow? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> skipped_due_to_capture_failure (`fail`)
- memory core 实际结果 -> for (`fail`)

### ordinary-ab-en-rule-hotels-1

- language: `en`
- category: `durable_rule`
- outcome: `both_fail`
- currentCaptureObserved: `true`
- 设计的问题 -> A user defines a stable hotel-planning rule with the codename `pine-cancel`; recall should return the codename later.
- 预期的结果 -> It should answer with `pine-cancel`.
- captureMessage -> Going forward, whenever I ask for hotel options, show me the cancellation policy first. The codename for that default travel rule is pine-cancel. Remember it.
- recallMessage -> Based only on your memory for this agent, what codename should you use for my default hotel-planning rule? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> for (`fail`)

### ordinary-ab-en-tool-tag-1

- language: `en`
- category: `tool_routing_preference`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> A user gives a persistent Xiaohongshu tool-routing preference and a stable tag; later recall should return the tag.
- 预期的结果 -> It should answer with `amber-card`.
- captureMessage -> From now on, whenever I send a Xiaohongshu link, use capture_xiaohongshu_note first and tag the result with amber-card. Remember this.
- recallMessage -> Based only on your memory for this agent, what tag should you use after handling one of my Xiaohongshu links? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> amber-card (`pass`)

### ordinary-ab-en-tool-slack-1

- language: `en`
- category: `tool_routing_preference`
- outcome: `both_fail`
- currentCaptureObserved: `true`
- 设计的问题 -> A user states a durable Slack-thread routing rule with a specific tool and tag; recall should return the tag.
- 预期的结果 -> It should answer with `olive-thread`.
- captureMessage -> Going forward, whenever I send you a Slack thread URL, use summarize_slack_thread first and mark the result with olive-thread. Please remember that default routing rule.
- recallMessage -> Based only on your memory for this agent, what tag should you use after handling one of my Slack thread URLs? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> skipped_due_to_capture_failure (`fail`)
- memory core 实际结果 -> I don't know based on current memory. (`fail`)

### ordinary-ab-en-tool-receipt-1

- language: `en`
- category: `tool_routing_preference`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> A user sets a default tool choice for receipt screenshots; recall should preserve the tool name.
- 预期的结果 -> It should answer with `extract_receipt_fields`.
- captureMessage -> From now on, whenever I send a receipt screenshot, use extract_receipt_fields first. Remember that as the default tool choice.
- recallMessage -> Based only on your memory for this agent, what tool should you use first when I send a receipt screenshot? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> skipped_due_to_capture_failure (`fail`)
- memory core 实际结果 -> extract_receipt_fields first (`pass`)

### ordinary-ab-en-tool-notion-1

- language: `en`
- category: `tool_routing_preference`
- outcome: `legacy_only`
- currentCaptureObserved: `false`
- 设计的问题 -> A user defines a durable Notion-export routing rule with a tag; recall should preserve that tag.
- 预期的结果 -> It should answer with `copper-notion`.
- captureMessage -> Going forward, whenever I send a Notion export package, use parse_notion_export first and tag the result copper-notion. Remember this default workflow.
- recallMessage -> Based only on your memory for this agent, what tag should you use after handling one of my Notion export packages? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> copper-notion (`pass`)
- memory core 实际结果 -> skipped_due_to_capture_failure (`fail`)

### ordinary-ab-en-timezone-1

- language: `en`
- category: `user_profile_fact`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> A user shares a durable timezone fact for future scheduling; later recall should preserve the timezone.
- 预期的结果 -> It should answer with `Asia/Shanghai` or an equivalent GMT+8 form.
- captureMessage -> My timezone is Asia/Shanghai. Remember this for future scheduling.
- recallMessage -> Based only on your memory for this agent, what is the user's timezone? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> Asia/Shanghai (`pass`)

### ordinary-ab-en-coffee-1

- language: `en`
- category: `user_profile_fact`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> A user shares a stable coffee preference; recall should preserve the durable preference details.
- 预期的结果 -> It should answer with flat white, no sugar, and oat milk.
- captureMessage -> I usually order an oat-milk flat white with no sugar. Remember this.
- recallMessage -> Based only on your memory for this agent, what coffee order should you assume for the user? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> Oat-milk flat white with no sugar. (`pass`)

### ordinary-ab-en-updates-1

- language: `en`
- category: `user_profile_fact`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> A user states a durable communication preference; recall should preserve the preference for async written updates.
- 预期的结果 -> It should answer with async written updates rather than calls.
- captureMessage -> I prefer async written updates and do not like surprise voice calls. Please remember that preference.
- recallMessage -> Based only on your memory for this agent, what update style does the user prefer? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> Async written updates. (`pass`)

### ordinary-ab-en-seat-1

- language: `en`
- category: `user_profile_fact`
- outcome: `both_fail`
- currentCaptureObserved: `false`
- 设计的问题 -> A user shares a stable travel preference; recall should preserve the seat preference details.
- 预期的结果 -> It should answer with an aisle seat and ideally mention the front.
- captureMessage -> When I fly, I prefer an aisle seat near the front. Remember that travel preference.
- recallMessage -> Based only on your memory for this agent, what seat should you assume the user prefers on flights? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> skipped_due_to_capture_failure (`fail`)

### ordinary-ab-en-session-negative-1

- language: `en`
- category: `session_constraint`
- outcome: `both_pass`
- currentCaptureObserved: `true`
- 设计的问题 -> A session-only codename should not become durable memory after transcript pruning.
- 预期的结果 -> It should refuse and answer `I don't know based on current memory.`
- captureMessage -> For this session only, call the current plan cobalt-ladder and keep replies short.
- recallMessage -> Based only on your memory for this agent, what codename should you permanently use for my current plan? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-en-session-negative-2

- language: `en`
- category: `session_constraint`
- outcome: `both_pass`
- currentCaptureObserved: `true`
- 设计的问题 -> A chat-local dashboard nickname should stay session-scoped and not be treated as durable memory.
- 预期的结果 -> It should refuse and answer `I don't know based on current memory.`
- captureMessage -> In this chat only, keep replies in bullets and refer to the dashboard as linen-board.
- recallMessage -> Based only on your memory for this agent, what permanent nickname should you use for my dashboard? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-en-session-negative-3

- language: `en`
- category: `session_constraint`
- outcome: `both_pass`
- currentCaptureObserved: `true`
- 设计的问题 -> A project-local temporary city choice should not turn into durable recallable memory.
- 预期的结果 -> It should refuse and answer `I don't know based on current memory.`
- captureMessage -> Only in this project, treat the demo city as Hangzhou and keep using that placeholder until we finish this task.
- recallMessage -> Based only on your memory for this agent, what city should you permanently assume for my demos? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-en-session-negative-4

- language: `en`
- category: `session_constraint`
- outcome: `both_pass`
- currentCaptureObserved: `true`
- 设计的问题 -> A session-only GitHub keyword should remain scoped to the current chat and not survive as durable memory.
- 预期的结果 -> It should refuse and answer `I don't know based on current memory.`
- captureMessage -> For this session only, when I send a GitHub repository link, use the keyword temporary-releases and keep it local to this chat.
- recallMessage -> Based only on your memory for this agent, what permanent keyword should you use for my GitHub repository links? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-en-oneoff-negative-1

- language: `en`
- category: `one_off_instruction`
- outcome: `both_pass`
- currentCaptureObserved: `false`
- 设计的问题 -> A one-off Xiaohongshu routing instruction should not become durable memory.
- 预期的结果 -> It should refuse and answer `I don't know based on current memory.`
- captureMessage -> Just this once, use capture_xiaohongshu_note first and tag the result oneoff-amber. Do not remember that as my default.
- recallMessage -> Based only on your memory for this agent, what tag should you permanently use after handling my Xiaohongshu links? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-en-oneoff-negative-2

- language: `en`
- category: `one_off_instruction`
- outcome: `both_pass`
- currentCaptureObserved: `false`
- 设计的问题 -> A single-use draft codename should not be promoted into durable memory.
- 预期的结果 -> It should refuse and answer `I don't know based on current memory.`
- captureMessage -> Only this time, call the draft amber-comet. Do not remember that codename for later.
- recallMessage -> Based only on your memory for this agent, what codename should you permanently use for my draft? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-en-oneoff-negative-3

- language: `en`
- category: `one_off_instruction`
- outcome: `both_pass`
- currentCaptureObserved: `false`
- 设计的问题 -> A one-off travel assumption should not become a durable default airport fact.
- 预期的结果 -> It should refuse and answer `I don't know based on current memory.`
- captureMessage -> For today only, assume my default departure airport is Narita while we book this flight. Do not remember that as my usual airport.
- recallMessage -> Based only on your memory for this agent, what airport should you permanently assume as the user's default departure airport? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-en-oneoff-negative-4

- language: `en`
- category: `one_off_instruction`
- outcome: `both_pass`
- currentCaptureObserved: `false`
- 设计的问题 -> A one-off reply-format instruction should not become the default style in durable memory.
- 预期的结果 -> It should refuse and answer `I don't know based on current memory.`
- captureMessage -> Just for today, write the status update in English bullets. No need to remember that as my default style.
- recallMessage -> Based only on your memory for this agent, what permanent status-update format should you assume for the user? If memory is missing, reply exactly: I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-zh-rule-releases-1

- language: `zh`
- category: `durable_rule`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> 用户在普通对话里定义了长期 GitHub 工作流规则，并给出代号 `琥珀Releases`；跨会话后应该还能答出这个代号。
- 预期的结果 -> 应答出 `琥珀Releases`，而不是拒答。
- captureMessage -> 以后只要我发 GitHub 仓库链接，你先看 Releases 页面；我把这个默认规则的代号叫做琥珀Releases。记住这个默认规则。
- recallMessage -> 只根据当前记忆，只要我发 GitHub 仓库链接，这个默认规则的代号是什么？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> 琥珀Releases (`pass`)

### ordinary-ab-zh-rule-pr-comments-1

- language: `zh`
- category: `durable_rule`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> 用户定义了长期 PR 审阅规则，并把它命名为 `雪松评论`；跨会话后应能召回这个代号。
- 预期的结果 -> 应答出 `雪松评论`。
- captureMessage -> 以后只要我发 PR 链接，你先看 unresolved comments；这个默认审阅规则的代号叫做雪松评论。记住它。
- recallMessage -> 只根据当前记忆，我默认的 PR 审阅规则代号是什么？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> 雪松评论 (`pass`)

### ordinary-ab-zh-rule-csv-1

- language: `zh`
- category: `durable_rule`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> 用户定义了长期 CSV 检查规则，并给出关键词 `银表头`；跨会话后应能召回该关键词。
- 预期的结果 -> 应答出 `银表头`。
- captureMessage -> 以后只要我让你检查 CSV 导出，你先核对表头；这个默认流程的关键词叫银表头。记住这个规则。
- recallMessage -> 只根据当前记忆，我默认的 CSV 检查流程关键词是什么？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> 叫银表头。 (`pass`)

### ordinary-ab-zh-rule-hotels-1

- language: `zh`
- category: `durable_rule`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> 用户定义了长期酒店筛选规则，并把它命名为 `松针取消`；跨会话后应能召回这个代号。
- 预期的结果 -> 应答出 `松针取消`。
- captureMessage -> 以后只要我问酒店方案，你先看取消政策；这个默认旅行规则的代号叫做松针取消。记住它。
- recallMessage -> 只根据当前记忆，我默认的酒店筛选规则代号是什么？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> 松针取消 (`pass`)

### ordinary-ab-zh-tool-tag-1

- language: `zh`
- category: `tool_routing_preference`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> 用户给出长期的小红书工具路由偏好和标签；跨会话后应能召回该标签。
- 预期的结果 -> 应答出 `amber-card`。
- captureMessage -> 以后只要我发小红书链接，你都先用 capture_xiaohongshu_note，并且在结果里打 amber-card 标签。记住这个。
- recallMessage -> 只根据当前记忆，处理我的小红书链接后，你应该打什么标签？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> amber-card (`pass`)

### ordinary-ab-zh-tool-slack-1

- language: `zh`
- category: `tool_routing_preference`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> 用户给出长期的 Slack 线程工具路由规则和标签；跨会话后应能召回该标签。
- 预期的结果 -> 应答出 `olive-thread`。
- captureMessage -> 以后只要我发 Slack 线程链接，你都先用 summarize_slack_thread，并且在结果里打 olive-thread 标签。记住这个默认规则。
- recallMessage -> 只根据当前记忆，处理我的 Slack 线程链接后，你应该打什么标签？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> olive-thread (`pass`)

### ordinary-ab-zh-tool-receipt-1

- language: `zh`
- category: `tool_routing_preference`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> 用户给出长期的发票截图工具选择；跨会话后应能召回对应的工具名。
- 预期的结果 -> 应答出 `extract_receipt_fields`。
- captureMessage -> 以后只要我发发票截图，你都先用 extract_receipt_fields。记住这是默认工具选择。
- recallMessage -> 只根据当前记忆，我发发票截图时你应该先用什么工具？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> extract_receipt_fields (`pass`)

### ordinary-ab-zh-tool-notion-1

- language: `zh`
- category: `tool_routing_preference`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> 用户给出长期的 Notion 导出处理规则和标签；跨会话后应能召回该标签。
- 预期的结果 -> 应答出 `copper-notion`。
- captureMessage -> 以后只要我发 Notion 导出包，你都先用 parse_notion_export，并且在结果里打 copper-notion 标签。记住这个默认规则。
- recallMessage -> 只根据当前记忆，处理我的 Notion 导出包后，你应该打什么标签？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> copper-notion (`pass`)

### ordinary-ab-zh-updates-1

- language: `zh`
- category: `user_profile_fact`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> 用户在普通对话里声明长期沟通偏好；跨会话后应能召回“异步文字更新”。
- 预期的结果 -> 应答出更喜欢异步、文字更新，而不是临时语音电话。
- captureMessage -> 我平时更喜欢异步文字更新，不喜欢临时语音电话。记住这个偏好。
- recallMessage -> 只根据当前记忆，我更喜欢什么更新方式？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> 你更喜欢**异步文字更新**，**不喜欢临时语音电话**。 (`pass`)

### ordinary-ab-zh-notebook-1

- language: `zh`
- category: `user_profile_fact`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> 用户给出长期的开会笔记本偏好；跨会话后应能召回这个稳定事实。
- 预期的结果 -> 应答出炭灰色 A5 笔记本。
- captureMessage -> 我平时开会都记在炭灰色 A5 笔记本里。记住这个。
- recallMessage -> 只根据当前记忆，我平时开会用什么笔记本？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> 炭灰色 A5 笔记本。 (`pass`)

### ordinary-ab-zh-timezone-1

- language: `zh`
- category: `user_profile_fact`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> 用户给出长期的时区事实；跨会话后应能召回 Asia/Shanghai 或等价表述。
- 预期的结果 -> 应答出 `Asia/Shanghai`、北京时间或等价 GMT+8 表述。
- captureMessage -> 我的时区是 Asia/Shanghai，也就是北京时间。记住这个，以后排时间按这个来。
- recallMessage -> 只根据当前记忆，我的时区是什么？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> Asia/Shanghai，也就是北京时间。 (`pass`)

### ordinary-ab-zh-seat-1

- language: `zh`
- category: `user_profile_fact`
- outcome: `umc_only`
- currentCaptureObserved: `true`
- 设计的问题 -> 用户给出长期的飞行座位偏好；跨会话后应能召回靠过道和尽量前排。
- 预期的结果 -> 应答出靠过道，并最好提到前排。
- captureMessage -> 我坐飞机时更喜欢靠过道，而且尽量前排。记住这个出行偏好。
- recallMessage -> 只根据当前记忆，我坐飞机更喜欢什么位置？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`fail`)
- memory core 实际结果 -> 靠过道，而且尽量前排。 (`pass`)

### ordinary-ab-zh-session-negative-1

- language: `zh`
- category: `session_constraint`
- outcome: `both_pass`
- currentCaptureObserved: `true`
- 设计的问题 -> 会话级方案代号不应被当成长期记忆保存。
- 预期的结果 -> 应拒答，只回答 `I don't know based on current memory.`
- captureMessage -> 这轮会话里把当前方案叫做琥珀梯，而且回复尽量短。
- recallMessage -> 只根据当前记忆，以后默认应该怎么称呼这轮方案？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-zh-session-negative-2

- language: `zh`
- category: `session_constraint`
- outcome: `both_pass`
- currentCaptureObserved: `true`
- 设计的问题 -> 项目内临时演示城市不应被长期固化为稳定记忆。
- 预期的结果 -> 应拒答，只回答 `I don't know based on current memory.`
- captureMessage -> 在这个项目里，先把演示城市都当成杭州，等这轮任务结束再说。
- recallMessage -> 只根据当前记忆，以后默认应该把我的演示城市当成哪里？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-zh-session-negative-3

- language: `zh`
- category: `session_constraint`
- outcome: `both_pass`
- currentCaptureObserved: `true`
- 设计的问题 -> 本轮临时 GitHub 关键词不应升级成长期默认规则。
- 预期的结果 -> 应拒答，只回答 `I don't know based on current memory.`
- captureMessage -> 本轮只要我发 GitHub 仓库链接，你都先用临时Releases 这个关键词，但只在这个会话里生效。
- recallMessage -> 只根据当前记忆，以后默认处理 GitHub 仓库链接时应该用什么长期关键词？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-zh-session-negative-4

- language: `zh`
- category: `session_constraint`
- outcome: `both_pass`
- currentCaptureObserved: `true`
- 设计的问题 -> 项目内临时看板代号不应转成长久记忆。
- 预期的结果 -> 应拒答，只回答 `I don't know based on current memory.`
- captureMessage -> 只在这个项目里，把当前看板叫做蓝梯，离开这个项目就不用了。
- recallMessage -> 只根据当前记忆，以后默认应该怎么称呼这个看板？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-zh-oneoff-negative-1

- language: `zh`
- category: `one_off_instruction`
- outcome: `both_pass`
- currentCaptureObserved: `false`
- 设计的问题 -> 一次性的小红书工具路由要求不应被保存成长期记忆。
- 预期的结果 -> 应拒答，只回答 `I don't know based on current memory.`
- captureMessage -> 只这一次处理小红书链接时，先用 capture_xiaohongshu_note，再打 oneoff-amber 标签；不用记住，也别默认以后这样。
- recallMessage -> 只根据当前记忆，以后处理我的小红书链接时应该固定打什么标签？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-zh-oneoff-negative-2

- language: `zh`
- category: `one_off_instruction`
- outcome: `both_pass`
- currentCaptureObserved: `false`
- 设计的问题 -> 一次性的草案代号不应被提升为长期记忆。
- 预期的结果 -> 应拒答，只回答 `I don't know based on current memory.`
- captureMessage -> 只这一次把草案叫做赤铜彗星，不用记住，也别默认以后都这么叫。
- recallMessage -> 只根据当前记忆，以后默认应该怎么称呼这份草案？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> I don't know based on current memory. (`pass`)

### ordinary-ab-zh-oneoff-negative-3

- language: `zh`
- category: `one_off_instruction`
- outcome: `legacy_only`
- currentCaptureObserved: `false`
- 设计的问题 -> 一次性的出发机场假设不应变成长期默认机场事实。
- 预期的结果 -> 应拒答，只回答 `I don't know based on current memory.`
- captureMessage -> 这一次先假设我默认出发机场是成田机场，方便订今天的航班；不要把这个记成长期默认机场。
- recallMessage -> 只根据当前记忆，以后默认应该把我的出发机场当成哪里？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> 只根据当前记忆，这一次可以先当成**成田机场**；但这**不是长期默认**。 (`fail`)

### ordinary-ab-zh-oneoff-negative-4

- language: `zh`
- category: `one_off_instruction`
- outcome: `both_pass`
- currentCaptureObserved: `false`
- 设计的问题 -> 一次性的回复格式要求不应变成长期默认偏好。
- 预期的结果 -> 应拒答，只回答 `I don't know based on current memory.`
- captureMessage -> 今天这一次全部用英文 bullet 回复就行，不要默认以后也这样。
- recallMessage -> 只根据当前记忆，以后默认应该用什么格式给我发状态更新？如果没有这条记忆，就只回答：I don't know based on current memory.
- builtin 实际结果 -> I don't know based on current memory. (`pass`)
- memory core 实际结果 -> - I don't know based on current memory. (`pass`)

## Focused Conclusion

- On this focused realtime-write surface, Unified Memory Core wins more cases than the legacy default path: `17` UMC-only vs `2` legacy-only.
- This suite is intentionally different from the earlier 100-case A/B: it tests live ordinary-conversation writing and then removes session transcripts before recall.
- That makes it the first direct probe of whether ordinary conversation itself can create durable recallable memory rather than merely improving consumption of an existing fixture.
