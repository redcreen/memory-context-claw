function makeAgentSeries(prefix, category, prompts, expectedAny, options = {}) {
  return prompts.map((message, index) => ({
    id: `${prefix}-${index + 1}`,
    category,
    entrypoint: "agent",
    message,
    expectedAny,
    expectedAll: options.expectedAll || [],
    forbiddenAny: options.forbiddenAny || [],
    compareLegacy: true,
    attributionKind: options.attributionKind || "retrieval",
    note: options.note || ""
  }));
}

const cases = [
  ...makeAgentSeries(
    "ab100-en-name",
    "ab-en-bootstrap",
    [
      "Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what name should you use when addressing the user? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, how should this agent address the user by name? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what is the name you should call the user? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, when you speak to the user directly, what name should you use? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Maya Chen"],
    {
      attributionKind: "bootstrap",
      note: "[ab100][en] bootstrap preferred name"
    }
  ),
  ...makeAgentSeries(
    "ab100-en-role",
    "ab-en-bootstrap",
    [
      "Based only on your memory for this agent, what is the user's role? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what does Maya Chen do? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what kind of work is the user doing? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, how would you describe the user's job in one sentence? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what role should you remember for Maya? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["independent product engineer", "clinic analytics assistant"],
    {
      expectedAll: ["clinic"],
      attributionKind: "bootstrap",
      note: "[ab100][en] bootstrap role"
    }
  ),
  ...makeAgentSeries(
    "ab100-en-timezone",
    "ab-en-bootstrap",
    [
      "Based only on your memory for this agent, what is the user's timezone? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, which timezone should you assume for Maya? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what timezone should planning default to for the user? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, if you need a local time reference for the user, which timezone applies? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what local timezone belongs to the user? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Asia/Shanghai"],
    {
      attributionKind: "bootstrap",
      note: "[ab100][en] bootstrap timezone"
    }
  ),
  ...makeAgentSeries(
    "ab100-en-async",
    "ab-en-retrieval",
    [
      "Based only on your memory for this agent, if async text will work, should you still schedule a voice call? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what communication preference applies when a live call is avoidable? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, does Maya prefer async written updates or voice calls when both are possible? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, when written updates are enough, what should you do about voice calls? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what is the user's preference around avoidable live calls? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["async", "written", "voice calls", "avoid voice", "avoid live", "no."],
    {
      attributionKind: "retrieval",
      note: "[ab100][en] cross-source async-vs-calls preference"
    }
  ),
  ...makeAgentSeries(
    "ab100-en-release-specificity",
    "ab-en-retrieval",
    [
      "Based only on your memory for this agent, when release notes are vague, should you say \"latest stable\" or give the exact tag? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, how should stable versions be named when the notes are ambiguous? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what release-answer style should you use if a changelog does not name the exact version clearly? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, when the release information is fuzzy, should you keep it vague or cite the exact semantic version tag? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what should you do instead of vaguely saying \"latest stable\"? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["exact tag", "vX.Y.Z", "latest stable", "exact semantic version tag"],
    {
      attributionKind: "retrieval",
      note: "[ab100][en] cross-source release specificity"
    }
  ),
  ...makeAgentSeries(
    "ab100-en-project-purpose",
    "ab-en-retrieval",
    [
      "Based only on your memory for this agent, what is Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, who is Project Lantern built for? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what kind of product is Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what problem domain does Project Lantern serve? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, if someone asks what Lantern does, how should you describe it? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Project Lantern", "clinic managers", "analytics assistant", "clinic analytics"],
    {
      attributionKind: "retrieval",
      note: "[ab100][en] project purpose"
    }
  ),
  ...makeAgentSeries(
    "ab100-en-design-partner",
    "ab-en-retrieval",
    [
      "Based only on your memory for this agent, who is the design partner for Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, which organization is the design partner on Lantern? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what partner name should you associate with Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, which clinic organization is collaborating as the design partner? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, who is the named design partner in the Project Lantern notes? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Northwind Health"],
    {
      attributionKind: "retrieval",
      note: "[ab100][en] project design partner"
    }
  ),
  ...makeAgentSeries(
    "ab100-en-current-editor",
    "ab-en-temporal",
    [
      "Based only on your memory for this agent, what is the user's current main editor now? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, which editor does Maya use now? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, after the latest update, what is the current editor? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what editor should you treat as current instead of the old one? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, if you need the present-day editor, which one is correct now? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Zed"],
    {
      forbiddenAny: ["Vim"],
      attributionKind: "temporal",
      note: "[ab100][en] current editor supersedes old editor"
    }
  ),
  ...makeAgentSeries(
    "ab100-en-current-region",
    "ab-en-temporal",
    [
      "Based only on your memory for this agent, what is the confirmed default deploy region now? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, which region should deployment default to now? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, after the final decision, what deploy region is current? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what region should be used now instead of the old draft? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, if an older note mentioned another region, which region is the confirmed one now? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["eu-west-1"],
    {
      forbiddenAny: ["us-east-1"],
      attributionKind: "temporal",
      note: "[ab100][en] current deploy region supersedes old draft"
    }
  ),
  ...makeAgentSeries(
    "ab100-en-negative",
    "ab-en-negative",
    [
      "Based only on your memory for this agent, what is the user's hometown? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what is Maya's birthday? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, which hotel chain does the user book most often? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what is the user's favorite programming language? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what city did the user grow up in? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["I don't know based on current memory."],
    {
      attributionKind: "negative",
      note: "[ab100][en] abstention"
    }
  ),
  ...makeAgentSeries(
    "ab100-zh-name",
    "ab-zh-bootstrap",
    [
      "只根据当前记忆，平时我希望你怎么称呼我？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，之后你一般应该怎么叫我？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，和我直接说话时你应该用什么名字？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，这个 agent 正确称呼用户时应该叫我什么？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，默认情况下你应该怎么称呼我本人？如果没有这条记忆，就只回答：I don't know based on current memory."
    ],
    ["Maya Chen"],
    {
      attributionKind: "bootstrap",
      note: "[ab100][zh] natural Chinese preferred name"
    }
  ),
  ...makeAgentSeries(
    "ab100-zh-timezone",
    "ab-zh-bootstrap",
    [
      "只根据当前记忆，我的时区是什么？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，之后排时间时应该默认按哪个时区看？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，如果你要按我的本地时间来理解安排，应该用什么时区？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，关于我本地时间的默认时区应该是什么？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，我所在的默认 timezone 是哪一个？如果没有这条记忆，就只回答：I don't know based on current memory."
    ],
    ["Asia/Shanghai"],
    {
      attributionKind: "bootstrap",
      note: "[ab100][zh] natural Chinese timezone"
    }
  ),
  ...makeAgentSeries(
    "ab100-zh-async",
    "ab-zh-retrieval",
    [
      "只根据当前记忆，如果异步文字已经够用，我应该继续约语音还是尽量避免语音？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，在可以异步沟通的时候，我对语音通话的偏好到底是什么？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，如果文字能解决，关于 live call 你应该按什么偏好来处理？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，我更希望异步文字更新还是直接打一通语音？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，在不必须开会通话的时候，你应该怎么理解我的沟通偏好？如果没有这条记忆，就只回答：I don't know based on current memory."
    ],
    ["async", "written", "voice", "异步", "避免语音", "避免语音通话", "异步文字", "尽量避免语音"],
    {
      attributionKind: "retrieval",
      note: "[ab100][zh] natural Chinese async-vs-calls preference"
    }
  ),
  ...makeAgentSeries(
    "ab100-zh-project-purpose",
    "ab-zh-retrieval",
    [
      "只根据当前记忆，Project Lantern 到底是在做什么？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，Lantern 这个项目主要是服务谁的？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，如果有人问 Project Lantern 是什么产品，你应该怎么概括？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，Lantern 更像是给谁用的 analytics assistant？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，这个 Project Lantern 的业务定位到底是什么？如果没有这条记忆，就只回答：I don't know based on current memory."
    ],
    ["Project Lantern", "clinic managers", "analytics assistant", "诊所经理", "分析助手"],
    {
      attributionKind: "retrieval",
      note: "[ab100][zh] natural Chinese project purpose"
    }
  ),
  ...makeAgentSeries(
    "ab100-zh-design-partner",
    "ab-zh-retrieval",
    [
      "只根据当前记忆，Project Lantern 的 design partner 是谁？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，Lantern 这个项目现在合作的 design partner 叫什么？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，Project Lantern 对应的设计合作方是哪家机构？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，如果问你 Lantern 的合作设计伙伴是谁，你应该回答哪家？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，这个项目里被记住的 design partner 名字是什么？如果没有这条记忆，就只回答：I don't know based on current memory."
    ],
    ["Northwind Health"],
    {
      attributionKind: "retrieval",
      note: "[ab100][zh] natural Chinese design partner"
    }
  ),
  ...makeAgentSeries(
    "ab100-zh-release-specificity",
    "ab-zh-retrieval",
    [
      "只根据当前记忆，如果 release note 写得含糊，你应该直接说 latest stable，还是给出确切 tag？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，遇到发布说明不清楚时，稳定版本应该怎么表述才符合我的偏好？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，如果版本说明没有写清楚，你应该保持模糊，还是明确点出 exact tag？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，面对不够清晰的 release note，你应该怎么回答稳定版本号？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，在发布文档写得不够准的时候，我更希望你给出 latest stable 这种笼统说法，还是精确语义版本 tag？如果没有这条记忆，就只回答：I don't know based on current memory."
    ],
    ["exact tag", "vX.Y.Z", "latest stable", "确切 tag", "精确 tag", "精确语义版本 tag", "exact semantic version tag", "精确的 tag", "准确的标签"],
    {
      attributionKind: "retrieval",
      note: "[ab100][zh] natural Chinese release specificity"
    }
  ),
  ...makeAgentSeries(
    "ab100-zh-current-editor",
    "ab-zh-temporal",
    [
      "只根据当前记忆，我现在主力编辑器到底换成什么了？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，现在我平时主要用哪个编辑器？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，如果你要说我当前正在用的编辑器，应该说哪个？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，相比旧的编辑器，现在真正应该按哪个编辑器来理解？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，关于我现在的主力编辑器，正确答案到底是哪一个？如果没有这条记忆，就只回答：I don't know based on current memory."
    ],
    ["Zed"],
    {
      forbiddenAny: ["Vim"],
      attributionKind: "temporal",
      note: "[ab100][zh] natural Chinese current editor"
    }
  ),
  ...makeAgentSeries(
    "ab100-zh-current-region",
    "ab-zh-temporal",
    [
      "只根据当前记忆，现在默认部署区域到底应该用哪个？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，部署默认应该落在哪个 region？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，如果旧草稿里写过别的 region，现在真正应该按哪个默认部署区域执行？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，面对旧草稿和当前确认配置冲突时，默认部署区域到底该按哪个？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，如果我要你说当前生效的 deploy region，你应该回答哪个？如果没有这条记忆，就只回答：I don't know based on current memory."
    ],
    ["eu-west-1"],
    {
      forbiddenAny: ["us-east-1"],
      attributionKind: "temporal",
      note: "[ab100][zh] natural Chinese current deploy region"
    }
  ),
  ...makeAgentSeries(
    "ab100-zh-history-editor",
    "ab-zh-history",
    [
      "只根据当前记忆，在改用 Zed 之前，我之前一直用什么编辑器？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，切到现在这个编辑器之前，我原来主力是哪个编辑器？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，如果问旧阶段我还在用什么编辑器，你应该回答哪个？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，现在虽然已经换了编辑器，但之前那段时间主力到底是什么？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，在最新切换发生之前，那个旧的主力编辑器叫什么？如果没有这条记忆，就只回答：I don't know based on current memory."
    ],
    ["Vim"],
    {
      forbiddenAny: ["Zed"],
      attributionKind: "history",
      note: "[ab100][zh] natural Chinese historical editor"
    }
  ),
  ...makeAgentSeries(
    "ab100-zh-negative",
    "ab-zh-negative",
    [
      "只根据当前记忆，我最喜欢的编程语言是什么？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，我老家是哪里？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，我平时最常住哪家酒店集团？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，我最常订哪家航空公司？如果没有这条记忆，就只回答：I don't know based on current memory.",
      "只根据当前记忆，我小时候在哪个城市长大？如果没有这条记忆，就只回答：I don't know based on current memory."
    ],
    ["I don't know based on current memory."],
    {
      attributionKind: "negative",
      note: "[ab100][zh] natural Chinese abstention"
    }
  )
];

export default cases;
