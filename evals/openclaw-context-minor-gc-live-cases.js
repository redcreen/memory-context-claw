const cases = [
  {
    id: "cmgc-live-zh-language-after-code-detour",
    description: "A durable Chinese-language preference should survive a code detour and come back as the latest answer.",
    turns: [
      "以后默认给我中文回复，尽量一句话。",
      "先切到代码：这轮先别改 OpenClaw core，只能走插件内 overlay。",
      "再切一下：Stage 7 closeout 里 operator scorecard 还要保留。",
      "先不说代码了。我刚才要求你默认用什么语言回复？"
    ],
    expectedAll: ["中文"],
    forbiddenAny: ["英文", "不知道"],
    expectedRelations: ["switch", "resolve", "continue"],
    minRawReductionRatio: 0.12
  },
  {
    id: "cmgc-live-en-seat-after-project-switch",
    description: "A durable travel preference should survive a project-report detour and return correctly.",
    turns: [
      "Remember this durable preference: I prefer aisle seats on flights.",
      "Now switch topics. Stage 7 closeout should keep the operator scorecard and the rollback boundary visible.",
      "Leave the report topic. What seat do I usually prefer on flights?"
    ],
    expectedAll: ["aisle"],
    forbiddenAny: ["window", "i don't know"],
    expectedRelations: ["branch", "switch", "continue", "resolve"],
    minRawReductionRatio: 0.15
  },
  {
    id: "cmgc-live-en-open-loop-return-stage7",
    description: "An unfinished Stage 7 planning thread should survive a side question and then resume cleanly.",
    turns: [
      "Split the Stage 7 closeout into three parts: summary, operator scorecard, and rollback boundary.",
      "Before you expand it, answer this side question: what does `umc registry migrate` do?",
      "Return to the earlier Stage 7 split. Which three parts did I ask for?"
    ],
    expectedAll: ["summary", "scorecard", "rollback"],
    forbiddenAny: ["i don't know"],
    expectedRelations: ["branch", "switch", "continue"],
    minRawReductionRatio: 0.08
  },
  {
    id: "cmgc-live-en-current-editor-conflict",
    description: "A newer current-state fact should win after an unrelated detour.",
    turns: [
      "Remember this old preference: my default editor used to be Vim.",
      "Update it now: my current default editor is Zed.",
      "Switch topics. Give me one short sentence on why shadow mode stays default-off.",
      "Back to the editor fact. What is my current default editor now?"
    ],
    expectedAll: ["zed"],
    forbiddenAny: ["i don't know"],
    expectedRelations: ["switch", "continue", "resolve"],
    minRawReductionRatio: 0.1
  },
  {
    id: "cmgc-live-zh-release-rule-after-detour",
    description: "A durable release-note rule should survive an unrelated detour and remain answerable.",
    turns: [
      "以后涉及 release note，默认先看 GitHub Releases 页面。",
      "现在换个话题，给我 3 个高蛋白早餐。",
      "再回到刚才那条规则：以后做 release note，第一步默认先看哪里？"
    ],
    expectedAll: ["github", "release"],
    forbiddenAny: ["不知道"],
    expectedRelations: ["switch", "continue", "resolve"],
    minRawReductionRatio: 0.12
  },
  {
    id: "cmgc-live-zh-dense-multitopic-return",
    description: "A denser natural-Chinese multi-topic switch should still return to the right travel fact.",
    turns: [
      "我们先聊旅行。记一下：预算 2 万元，更想住京都，最好靠近地铁站。",
      "现在切到代码：给我一个 Python 正则，提取 foo123bar 里的数字。",
      "继续代码：如果只取第一个数字分组，写法怎么更短？",
      "先不聊代码了。刚才旅行那段里，我更想住哪座城市？"
    ],
    expectedAll: ["京都"],
    forbiddenAny: ["大阪", "不知道"],
    expectedRelations: ["switch", "resolve", "continue"],
    minRawReductionRatio: 0.18
  }
];

export default cases;
export { cases };
