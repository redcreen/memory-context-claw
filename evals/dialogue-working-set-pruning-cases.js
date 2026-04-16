const cases = [
  {
    id: "continue-context-slimming-followup",
    description: "A follow-up narrows the same architecture topic; old turns should largely stay in the working set.",
    transcript: [
      { id: "t1", role: "assistant", content: "今天继续哪条线？" },
      { id: "t2", role: "user", content: "以后默认给我中文，回复直接一点。" },
      { id: "t3", role: "assistant", content: "记住了，后面默认中文，结论优先。" },
      { id: "t4", role: "user", content: "说一下 context slimming 的核心目标。" },
      { id: "t5", role: "assistant", content: "核心目标是存储 rich、prompt sparse，让真正进入模型的上下文只保留当轮高相关信息。" },
      { id: "t6", role: "user", content: "那 raw doc default-off 应该先落在哪几类问题上？" }
    ],
    expected: {
      relation: "continue",
      must_keep_turn_ids: ["t4", "t5"],
      must_evict_turn_ids: [],
      must_pin_turn_ids: [],
      min_reduction_ratio: 0
    }
  },
  {
    id: "branch-keep-open-loop-stage6",
    description: "A side question interrupts an unfinished planning task; the original task turns must remain available.",
    transcript: [
      { id: "t1", role: "user", content: "把 Stage 6 的验收拆成 3 个部分。" },
      { id: "t2", role: "assistant", content: "可以，先拆成：功能正确性、回退安全、宿主集成验证。" },
      { id: "t3", role: "user", content: "先别展开，我插一句：umc registry migrate 这条命令是做什么的？" }
    ],
    expected: {
      relation: "branch",
      must_keep_turn_ids: ["t1", "t2"],
      must_evict_turn_ids: [],
      must_pin_turn_ids: [],
      min_reduction_ratio: 0
    }
  },
  {
    id: "switch-project-to-config-with-pins",
    description: "The project-summary topic is closed, a durable travel preference is added, and the conversation then switches to plugin config.",
    transcript: [
      { id: "t1", role: "user", content: "以后默认给我中文，回复直接一点。" },
      { id: "t2", role: "assistant", content: "记住了。" },
      { id: "t3", role: "user", content: "帮我概括一下 Project Lantern 是做什么的。" },
      { id: "t4", role: "assistant", content: "Project Lantern 主要是在做面向真实场景的 AI 记忆与上下文治理。" },
      { id: "t5", role: "user", content: "这块先到这。另一个长期偏好记一下：我坐飞机喜欢靠过道。" },
      { id: "t6", role: "assistant", content: "记住了，你坐飞机偏好靠过道。" },
      { id: "t7", role: "user", content: "现在切到配置：unified-memory-core 的最小 contextEngine 配置怎么写？" }
    ],
    expected: {
      relation: "switch",
      must_keep_turn_ids: [],
      must_evict_turn_ids: ["t3", "t4", "t5", "t6"],
      must_pin_turn_ids: ["t1", "t5"],
      min_reduction_ratio: 0.3
    }
  },
  {
    id: "switch-family-to-code-with-durable-pins",
    description: "Family facts are captured, then the user explicitly switches to code architecture; old family turns should leave the raw working set but stay pinned semantically.",
    transcript: [
      { id: "t1", role: "user", content: "记一下：我爱吃牛排。" },
      { id: "t2", role: "assistant", content: "记住了，你爱吃牛排。" },
      { id: "t3", role: "user", content: "再记一下：我女儿现在五年级。" },
      { id: "t4", role: "assistant", content: "记住了，你女儿现在五年级。" },
      { id: "t5", role: "user", content: "家庭这块先这样。现在说代码：OpenClaw adapter 读取 governed exports 的顺序是什么？" }
    ],
    expected: {
      relation: "switch",
      must_keep_turn_ids: [],
      must_evict_turn_ids: ["t1", "t2", "t3", "t4"],
      must_pin_turn_ids: ["t1", "t3"],
      min_reduction_ratio: 0.45
    }
  },
  {
    id: "switch-prune-status-noise-keep-style-pin",
    description: "A status snapshot and a temporary meta exchange should be dropped once the user switches to retrieval policy, while the durable reply-style rule stays pinned.",
    transcript: [
      { id: "t1", role: "assistant", content: "当前状态：OpenClaw 版本 2026.3.31，当前模型 openai-codex/gpt-5.4，上下文占用 158k / 272k，缓存命中率 99%。" },
      { id: "t2", role: "user", content: "以后默认先给我结论，再展开细节。" },
      { id: "t3", role: "assistant", content: "记住了，以后默认先给结论。" },
      { id: "t4", role: "user", content: "刚才那个先记住就行。现在说 retrieval policy：未分类 query 默认走哪条路径？" }
    ],
    expected: {
      relation: "switch",
      must_keep_turn_ids: [],
      must_evict_turn_ids: ["t1", "t3"],
      must_pin_turn_ids: ["t2"],
      min_reduction_ratio: 0.25
    }
  }
];

export default cases;
