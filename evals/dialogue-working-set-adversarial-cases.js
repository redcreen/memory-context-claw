const cases = [
  {
    id: "adversarial-false-switch-same-topic",
    description: "The user rephrases the same topic; this should stay continue, not switch.",
    transcript: [
      { id: "t1", role: "user", content: "把 context slimming 的核心目标说一下。" },
      { id: "t2", role: "assistant", content: "核心目标是存储 rich、prompt sparse，只把当轮高相关信息送进模型。" },
      { id: "t3", role: "user", content: "换个角度讲：为什么说存储可以 rich，但 prompt 必须 sparse？" }
    ],
    expected: {
      relation: "continue",
      must_keep_turn_ids: ["t1", "t2"],
      must_not_evict_turn_ids: ["t1", "t2"],
      min_reduction_ratio: 0
    }
  },
  {
    id: "adversarial-branch-unfinished-with-side-fact",
    description: "A durable side fact appears while the main task is still open; the main task must stay.",
    transcript: [
      { id: "t1", role: "user", content: "帮我把 Stage 6 验收拆成 3 个部分。" },
      { id: "t2", role: "assistant", content: "可以，先拆成：功能正确性、回退安全、宿主集成验证。" },
      { id: "t3", role: "user", content: "插一句，记一下：我在上海时区。" }
    ],
    expected: {
      relation: "branch",
      must_keep_turn_ids: ["t1", "t2"],
      must_not_evict_turn_ids: ["t1", "t2"],
      min_reduction_ratio: 0
    }
  },
  {
    id: "adversarial-return-old-topic-after-code-switch",
    description: "The chat switched to code, then explicitly jumps back to an old durable preference.",
    transcript: [
      { id: "t1", role: "user", content: "记一下：我坐飞机喜欢靠过道。" },
      { id: "t2", role: "assistant", content: "记住了，你坐飞机偏好靠过道。" },
      { id: "t3", role: "user", content: "现在说代码，这轮先别改 builtin memory。" },
      { id: "t4", role: "assistant", content: "好，这轮先不改 builtin memory。" },
      { id: "t5", role: "user", content: "代码先放一边。刚才说过，我坐飞机喜欢什么位置？" }
    ],
    expected: {
      relation: "switch",
      must_evict_turn_ids: ["t3", "t4"],
      must_pin_turn_ids: ["t1"],
      min_reduction_ratio: 0.15
    }
  },
  {
    id: "adversarial-assistant-claim-not-durable",
    description: "The assistant guessed wrong first; only the user's correction may survive as a durable pin.",
    transcript: [
      { id: "t1", role: "assistant", content: "我猜你可能更喜欢语音电话。" },
      { id: "t2", role: "user", content: "不是，我更喜欢异步文字更新。" },
      { id: "t3", role: "assistant", content: "记住了，你更喜欢异步文字更新。" },
      { id: "t4", role: "user", content: "现在切到别的话题：帮我说一下 rollout 顺序。" }
    ],
    expected: {
      relation: "switch",
      must_pin_turn_ids: ["t2"],
      must_not_pin_turn_ids: ["t1"],
      must_evict_turn_ids: ["t1", "t3"],
      min_reduction_ratio: 0.2
    }
  },
  {
    id: "adversarial-session-negative-no-pin",
    description: "A one-off codename must not be promoted into a long-lived pin after the topic switches.",
    transcript: [
      { id: "t1", role: "user", content: "只这一次把方案叫琥珀梯，不用长期记。" },
      { id: "t2", role: "assistant", content: "好，这次临时叫琥珀梯。" },
      { id: "t3", role: "user", content: "现在切到检索策略：未分类 query 默认走哪条路径？" }
    ],
    expected: {
      relation: "switch",
      must_evict_turn_ids: ["t1", "t2"],
      must_not_pin_turn_ids: ["t1"],
      min_reduction_ratio: 0.2
    }
  },
  {
    id: "adversarial-implicit-continuation",
    description: "A follow-up that refers to a numbered phase implicitly should still count as continuing the same topic.",
    transcript: [
      { id: "t1", role: "user", content: "把三阶段 rollout 说一下。" },
      { id: "t2", role: "assistant", content: "先 shadow，后 gated active，最后再 default active。" },
      { id: "t3", role: "user", content: "第二阶段具体是什么意思？" }
    ],
    expected: {
      relation: "continue",
      must_keep_turn_ids: ["t1", "t2"],
      must_not_evict_turn_ids: ["t1", "t2"],
      min_reduction_ratio: 0
    }
  },
  {
    id: "adversarial-resolve-close-conversation",
    description: "The conversation closes and only the durable preference plus latest user turn should remain.",
    transcript: [
      { id: "t1", role: "user", content: "以后默认中文。" },
      { id: "t2", role: "assistant", content: "记住了，以后默认中文。" },
      { id: "t3", role: "user", content: "今天先这样，记住上面的偏好就行。下次再继续。" }
    ],
    expected: {
      relation: "resolve",
      must_pin_turn_ids: ["t1"],
      must_evict_turn_ids: ["t2"],
      min_reduction_ratio: 0.1
    }
  }
];

export default cases;
export { cases };
