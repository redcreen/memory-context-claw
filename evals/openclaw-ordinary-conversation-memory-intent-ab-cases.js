const cases = [
  {
    id: "ordinary-ab-en-rule-releases-1",
    language: "en",
    category: "durable_rule",
    captureMessage: "From now on, whenever I send a GitHub repository link, use the keyword saffron-releases to remind yourself to check the Releases tab first. Remember this as my default workflow.",
    recallMessage: "Based only on your memory for this agent, what keyword should you use when I send a GitHub repository link? If memory is missing, reply exactly: I don't know based on current memory.",
    expectedAll: ["saffron-releases"],
    forbiddenAny: ["i don't know based on current memory"]
  },
  {
    id: "ordinary-ab-en-tool-tag-1",
    language: "en",
    category: "tool_routing_preference",
    captureMessage: "From now on, whenever I send a Xiaohongshu link, use capture_xiaohongshu_note first and tag the result with amber-card. Remember this.",
    recallMessage: "Based only on your memory for this agent, what tag should you use after handling one of my Xiaohongshu links? If memory is missing, reply exactly: I don't know based on current memory.",
    expectedAll: ["amber-card"],
    forbiddenAny: ["i don't know based on current memory"]
  },
  {
    id: "ordinary-ab-en-timezone-1",
    language: "en",
    category: "user_profile_fact",
    captureMessage: "My timezone is Asia/Shanghai. Remember this for future scheduling.",
    recallMessage: "Based only on your memory for this agent, what is the user's timezone? If memory is missing, reply exactly: I don't know based on current memory.",
    expectedAll: ["asia/shanghai"],
    forbiddenAny: ["i don't know based on current memory"]
  },
  {
    id: "ordinary-ab-en-coffee-1",
    language: "en",
    category: "user_profile_fact",
    captureMessage: "I usually order an oat-milk flat white with no sugar. Remember this.",
    recallMessage: "Based only on your memory for this agent, what coffee order should you assume for the user? If memory is missing, reply exactly: I don't know based on current memory.",
    expectedAll: ["flat white", "no sugar"],
    expectedAny: ["oat", "oat-milk", "oat milk"],
    forbiddenAny: ["i don't know based on current memory"]
  },
  {
    id: "ordinary-ab-en-session-negative-1",
    language: "en",
    category: "session_constraint",
    captureMessage: "For this session only, call the current plan cobalt-ladder and keep replies short.",
    recallMessage: "Based only on your memory for this agent, what codename should you permanently use for my current plan? If memory is missing, reply exactly: I don't know based on current memory.",
    expectedAll: ["i don't know based on current memory"],
    forbiddenAny: ["cobalt-ladder"]
  },
  {
    id: "ordinary-ab-zh-rule-releases-1",
    language: "zh",
    category: "durable_rule",
    captureMessage: "以后只要我发 GitHub 仓库链接，你先看 Releases 页面；我把这个默认规则的代号叫做琥珀Releases。记住这个默认规则。",
    recallMessage: "只根据当前记忆，只要我发 GitHub 仓库链接，这个默认规则的代号是什么？如果没有这条记忆，就只回答：I don't know based on current memory.",
    expectedAll: ["琥珀releases"],
    forbiddenAny: ["i don't know based on current memory"]
  },
  {
    id: "ordinary-ab-zh-tool-tag-1",
    language: "zh",
    category: "tool_routing_preference",
    captureMessage: "以后只要我发小红书链接，你都先用 capture_xiaohongshu_note，并且在结果里打 amber-card 标签。记住这个。",
    recallMessage: "只根据当前记忆，处理我的小红书链接后，你应该打什么标签？如果没有这条记忆，就只回答：I don't know based on current memory.",
    expectedAll: ["amber-card"],
    forbiddenAny: ["i don't know based on current memory"]
  },
  {
    id: "ordinary-ab-zh-updates-1",
    language: "zh",
    category: "user_profile_fact",
    captureMessage: "我平时更喜欢异步文字更新，不喜欢临时语音电话。记住这个偏好。",
    recallMessage: "只根据当前记忆，我更喜欢什么更新方式？如果没有这条记忆，就只回答：I don't know based on current memory.",
    expectedAll: ["异步", "文字"],
    forbiddenAny: ["i don't know based on current memory"]
  },
  {
    id: "ordinary-ab-zh-notebook-1",
    language: "zh",
    category: "user_profile_fact",
    captureMessage: "我平时开会都记在炭灰色 A5 笔记本里。记住这个。",
    recallMessage: "只根据当前记忆，我平时开会用什么笔记本？如果没有这条记忆，就只回答：I don't know based on current memory.",
    expectedAll: ["炭灰色", "a5"],
    forbiddenAny: ["i don't know based on current memory"]
  },
  {
    id: "ordinary-ab-zh-oneoff-negative-1",
    language: "zh",
    category: "one_off_instruction",
    captureMessage: "只这一次把这轮方案叫做琥珀梯，不用记住，也别默认以后都这么叫。",
    recallMessage: "只根据当前记忆，以后默认应该怎么称呼这轮方案？如果没有这条记忆，就只回答：I don't know based on current memory.",
    expectedAll: ["i don't know based on current memory"],
    forbiddenAny: ["琥珀梯"]
  }
];

export default cases;
export { cases };
