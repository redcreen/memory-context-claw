const cases = [
  {
    id: "shadow-replay-project-switches",
    description: "One architecture topic continues, then switches to config, then switches again to testing.",
    transcript: [
      { id: "t1", role: "assistant", content: "今天继续哪条线？" },
      { id: "t2", role: "user", content: "以后默认给我中文，回复直接一点。" },
      { id: "t3", role: "assistant", content: "记住了，后面默认中文，结论优先。" },
      { id: "t4", role: "user", content: "说一下 context slimming 的核心目标。" },
      { id: "t5", role: "assistant", content: "核心目标是存储 rich、prompt sparse，让真正进入模型的上下文只保留当轮高相关信息。" },
      { id: "t6", role: "user", content: "那 raw doc default-off 应该先落在哪几类问题上？" },
      { id: "t7", role: "user", content: "现在切到配置：unified-memory-core 的最小 contextEngine 配置怎么写？" },
      { id: "t8", role: "assistant", content: "最小配置应该先只挂 contextEngine，不动写侧。" },
      { id: "t9", role: "user", content: "再切一步：如果只做 shadow mode，报告里至少要看哪些指标？" }
    ],
    checkpoints: [
      {
        turn_id: "t6",
        expected: {
          relation: "continue",
          must_keep_turn_ids: ["t4", "t5"],
          must_evict_turn_ids: [],
          must_pin_turn_ids: [],
          min_reduction_ratio: 0
        }
      },
      {
        turn_id: "t7",
        expected: {
          relation: "switch",
          allowed_relations: ["switch", "branch"],
          must_evict_turn_ids: ["t4", "t5"],
          must_pin_turn_ids: ["t2"],
          min_reduction_ratio: 0.2
        }
      },
      {
        turn_id: "t9",
        expected: {
          relation: "switch",
          allowed_relations: ["switch", "branch", "continue"],
          must_evict_turn_ids: ["t4", "t5", "t6"],
          must_pin_turn_ids: ["t2"],
          min_reduction_ratio: 0.25
        }
      }
    ]
  },
  {
    id: "shadow-replay-open-loop-branch-return",
    description: "An unfinished planning task is interrupted by a side question and then resumed.",
    transcript: [
      { id: "t1", role: "user", content: "把 Stage 6 的验收拆成 3 个部分。" },
      { id: "t2", role: "assistant", content: "可以，先拆成：功能正确性、回退安全、宿主集成验证。" },
      { id: "t3", role: "user", content: "先别展开，我插一句：umc registry migrate 这条命令是做什么的？" },
      { id: "t4", role: "assistant", content: "它更像 UMC 自己 registry root 的迁移，不是 builtin memory 的切换器。" },
      { id: "t5", role: "user", content: "好，回到刚才 Stage 6，那三个部分是什么？" }
    ],
    checkpoints: [
      {
        turn_id: "t3",
        expected: {
          relation: "branch",
          must_keep_turn_ids: ["t1", "t2"],
          must_evict_turn_ids: [],
          must_pin_turn_ids: [],
          min_reduction_ratio: 0
        }
      },
      {
        turn_id: "t5",
        expected: {
          relation: "continue",
          allowed_relations: ["continue", "branch"],
          must_keep_turn_ids: ["t1", "t2"],
          must_evict_turn_ids: ["t3", "t4"],
          min_reduction_ratio: 0.15
        }
      }
    ]
  },
  {
    id: "shadow-replay-family-code-family",
    description: "Durable family facts are captured, the chat switches to code, then the user returns to the old family fact.",
    transcript: [
      { id: "t1", role: "user", content: "记一下：我爱吃牛排。" },
      { id: "t2", role: "assistant", content: "记住了，你爱吃牛排。" },
      { id: "t3", role: "user", content: "再记一下：我坐飞机喜欢靠过道。" },
      { id: "t4", role: "assistant", content: "记住了，你坐飞机偏好靠过道。" },
      { id: "t5", role: "user", content: "家庭这块先这样。现在说代码：这轮先别改 builtin memory。" },
      { id: "t6", role: "assistant", content: "好，这轮先 shadow，再决定是否真正接管主路径。" },
      { id: "t7", role: "user", content: "代码先放一边。刚才说过，我坐飞机喜欢什么位置？" }
    ],
    checkpoints: [
      {
        turn_id: "t5",
        expected: {
          relation: "switch",
          must_evict_turn_ids: ["t1", "t2", "t3", "t4"],
          must_pin_turn_ids: ["t1", "t3"],
          min_reduction_ratio: 0.35
        }
      },
      {
        turn_id: "t7",
        expected: {
          relation: "switch",
          must_evict_turn_ids: ["t6"],
          must_pin_turn_ids: ["t3"],
          min_reduction_ratio: 0.1
        }
      }
    ]
  },
  {
    id: "shadow-replay-status-style-release",
    description: "Status noise and a style preference should yield to two successive task switches.",
    transcript: [
      { id: "t1", role: "assistant", content: "当前状态：OpenClaw 版本 2026.3.31，当前模型 openai-codex/gpt-5.4，上下文占用 158k / 272k，缓存命中率 99%。" },
      { id: "t2", role: "user", content: "以后默认先给我结论，再展开细节。" },
      { id: "t3", role: "assistant", content: "记住了，以后默认先给结论。" },
      { id: "t4", role: "user", content: "现在说 retrieval policy：未分类 query 默认走哪条路径？" },
      { id: "t5", role: "assistant", content: "先走 fast path，不够再补 formal memory。" },
      { id: "t6", role: "user", content: "再切一步：如果要写 release note，第一段应该先说什么？" }
    ],
    checkpoints: [
      {
        turn_id: "t4",
        expected: {
          relation: "switch",
          allowed_relations: ["switch", "continue"],
          must_evict_turn_ids: ["t1", "t3"],
          must_pin_turn_ids: ["t2"],
          min_reduction_ratio: 0.25
        }
      },
      {
        turn_id: "t6",
        expected: {
          relation: "switch",
          must_evict_turn_ids: ["t1", "t4", "t5"],
          must_pin_turn_ids: ["t2"],
          min_reduction_ratio: 0.2
        }
      }
    ]
  }
];

export default cases;
export { cases };
