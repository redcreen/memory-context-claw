function makeSearchSeries(prefix, category, queries, expectedAny, options = {}) {
  return queries.map((query, index) => ({
    id: `${prefix}-${index + 1}`,
    category,
    entrypoint: "memory_search",
    query,
    expectedAny,
    expectedAll: options.expectedAll || [],
    forbiddenAny: options.forbiddenAny || [],
    expectedSources: options.expectedSources || [],
    expectedSourceGroups: options.expectedSourceGroups || [],
    compareLegacy: options.compareLegacy === true,
    attributionKind: options.attributionKind || "retrieval",
    note: options.note || ""
  }));
}

function makeAgentSeries(prefix, category, prompts, expectedAny, options = {}) {
  return prompts.map((message, index) => ({
    id: `${prefix}-${index + 1}`,
    category,
    entrypoint: "agent",
    message,
    expectedAny,
    expectedAll: options.expectedAll || [],
    forbiddenAny: options.forbiddenAny || [],
    expectedSources: options.expectedSources || [],
    compareLegacy: options.compareLegacy === true,
    attributionKind: options.attributionKind || "retrieval",
    note: options.note || ""
  }));
}

function hasChinese(text = "") {
  return /[\u4e00-\u9fff]/.test(String(text || ""));
}

function createChineseMirrorCase(caseDef) {
  if (caseDef.entrypoint === "memory_search") {
    const query = String(caseDef.query || "");
    if (!query || hasChinese(query)) return null;
    return {
      ...caseDef,
      id: `${caseDef.id}-zhmix`,
      query: `请只根据长期记忆检索并回答这个问题：${query}`,
      note: `${caseDef.note ? `${caseDef.note} ` : ""}[zh-mixed mirror]`
    };
  }

  const message = String(caseDef.message || "");
  if (!message || hasChinese(message)) return null;
  return {
    ...caseDef,
    id: `${caseDef.id}-zhmix`,
    message: `请在需要时先使用 memory_search 工具，然后只根据当前 agent 的记忆来回答。${message}`,
    note: `${caseDef.note ? `${caseDef.note} ` : ""}[zh-mixed mirror]`
  };
}

const cases = [
  ...makeSearchSeries(
    "profile-name",
    "profile",
    [
      "preferred name",
      "user preferred name",
      "what name should I use for the user",
      "how should this agent address the user"
    ],
    ["Maya Chen"],
    {
      expectedSources: ["MEMORY.md"],
      attributionKind: "bootstrap"
    }
  ),
  ...makeSearchSeries(
    "profile-role",
    "profile",
    [
      "user role",
      "what does Maya do",
      "independent product engineer clinic analytics assistant"
    ],
    ["independent product engineer", "clinic analytics assistant"],
    {
      expectedSources: ["MEMORY.md"],
      attributionKind: "bootstrap"
    }
  ),
  ...makeSearchSeries(
    "profile-timezone",
    "profile",
    [
      "timezone",
      "user timezone",
      "what timezone is Maya in",
      "Asia/Shanghai"
    ],
    ["Asia/Shanghai"],
    {
      expectedSources: ["MEMORY.md"],
      attributionKind: "bootstrap"
    }
  ),
  ...makeSearchSeries(
    "pref-reply-style",
    "preference",
    [
      "preferred reply style",
      "how should replies be formatted",
      "concise bullets first rationale if needed",
      "reply style concise bullets"
    ],
    ["concise bullets first"],
    {
      expectedSources: ["MEMORY.md"],
      attributionKind: "bootstrap"
    }
  ),
  ...makeSearchSeries(
    "pref-async",
    "preference",
    [
      "avoid voice calls",
      "async written updates",
      "does Maya prefer calls or async text",
      "strong dislike voice calls"
    ],
    ["async", "voice calls"],
    {
      expectedSources: ["MEMORY.md", "notes/personal-profile.md"],
      attributionKind: "bootstrap"
    }
  ),
  ...makeSearchSeries(
    "pref-coffee",
    "preference",
    [
      "coffee order",
      "what coffee does Maya order",
      "oat milk flat white",
      "no sugar coffee preference"
    ],
    ["flat white", "oat milk", "no sugar"],
    {
      expectedSources: ["MEMORY.md"],
      attributionKind: "bootstrap"
    }
  ),
  ...makeSearchSeries(
    "pref-seat",
    "preference",
    [
      "seat preference for flights",
      "flight seat preference",
      "what seat does Maya prefer on flights",
      "aisle seat"
    ],
    ["aisle seat"],
    {
      expectedSources: ["MEMORY.md", "notes/personal-profile.md"],
      attributionKind: "bootstrap"
    }
  ),
  ...makeSearchSeries(
    "pref-carry-on",
    "preference",
    [
      "carry-on travel",
      "does Maya travel with carry-on only",
      "travel preference carry-on",
      "only a carry-on"
    ],
    ["carry-on"],
    {
      expectedSources: ["notes/personal-profile.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "pref-charts",
    "preference",
    [
      "chart readability preference",
      "high contrast charts",
      "how should charts be optimized",
      "readability especially high contrast"
    ],
    ["high contrast", "readability"],
    {
      expectedSources: ["notes/personal-profile.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "pref-exact-tag",
    "preference",
    [
      "exact tag not latest stable vaguely",
      "release notes exact tag preference",
      "when release notes are unclear what does Maya want",
      "exact tag instead of latest stable"
    ],
    ["exact tag", "latest stable"],
    {
      expectedSources: ["notes/personal-profile.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "pref-no-guesses",
    "preference",
    [
      "do not present guesses as facts",
      "guessing policy",
      "Maya does not want guesses as facts",
      "no guesses presented as facts"
    ],
    ["guesses", "facts"],
    {
      expectedSources: ["notes/personal-profile.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "rule-debug",
    "rule",
    [
      "debugging rule",
      "smallest reproducible example",
      "how should debugging start",
      "broad fixes or smallest reproducible example first"
    ],
    ["smallest reproducible example"],
    {
      expectedSources: ["MEMORY.md"],
      attributionKind: "bootstrap"
    }
  ),
  ...makeSearchSeries(
    "rule-release",
    "rule",
    [
      "stable release tag format",
      "what tag format should stable releases use",
      "semantic version tags",
      "vX.Y.Z"
    ],
    ["vX.Y.Z"],
    {
      expectedSources: ["MEMORY.md"],
      attributionKind: "bootstrap"
    }
  ),
  ...makeSearchSeries(
    "rule-no-conflict",
    "rule",
    [
      "if memory is missing or conflicting what should happen",
      "when memory conflicts should the system guess",
      "missing or conflicting memory",
      "conflicting memory should not guess"
    ],
    ["missing", "conflicting"],
    {
      expectedSources: ["MEMORY.md"],
      attributionKind: "bootstrap"
    }
  ),
  ...makeSearchSeries(
    "project-desc",
    "project",
    [
      "Project Lantern",
      "what is Project Lantern",
      "clinic managers analytics assistant",
      "B2B analytics assistant for clinic managers"
    ],
    ["B2B analytics assistant", "clinic managers"],
    {
      expectedSources: ["notes/project-lantern.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "project-codename",
    "project",
    [
      "Lantern codename",
      "project codename",
      "what is the codename for Project Lantern"
    ],
    ["Codename", "Lantern"],
    {
      expectedSources: ["notes/project-lantern.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "project-milestone",
    "project",
    [
      "current milestone",
      "Project Lantern milestone",
      "Stage 2 pilot"
    ],
    ["Stage 2 pilot"],
    {
      expectedSources: ["notes/project-lantern.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "project-kpi",
    "project",
    [
      "primary KPI",
      "weekly active clinics",
      "what KPI matters for Project Lantern"
    ],
    ["weekly active clinics"],
    {
      expectedSources: ["notes/project-lantern.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "project-sla",
    "project",
    [
      "support SLA",
      "pilot customers support SLA",
      "respond within 4 business hours"
    ],
    ["4 business hours"],
    {
      expectedSources: ["notes/project-lantern.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "project-partner",
    "project",
    [
      "design partner",
      "who is the design partner for Project Lantern",
      "Northwind Health"
    ],
    ["Northwind Health"],
    {
      expectedSources: ["notes/project-lantern.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "project-cadence",
    "project",
    [
      "reporting cadence",
      "pilot summary every Friday",
      "when should the pilot summary be sent"
    ],
    ["every Friday"],
    {
      expectedSources: ["notes/project-lantern.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "project-city",
    "project",
    [
      "launch city",
      "pilot launch city",
      "Singapore pilot city"
    ],
    ["Singapore"],
    {
      expectedSources: ["notes/project-lantern.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "project-mixed",
    "project",
    [
      "Project Lantern Stage 2 pilot Singapore",
      "Northwind Health 4 business hours",
      "Lantern weekly active clinics"
    ],
    ["Lantern"],
    {
      expectedSources: ["notes/project-lantern.md"],
      attributionKind: "retrieval"
    }
  ),
  ...makeSearchSeries(
    "cross-source-travel-search",
    "cross-source",
    [
      "Maya carry-on aisle seat",
      "travel preference carry-on and aisle",
      "seat preference plus carry-on habit",
      "aisle seat with only a carry-on"
    ],
    ["carry-on", "aisle"],
    {
      expectedSources: ["MEMORY.md", "notes/personal-profile.md"],
      expectedSourceGroups: [["MEMORY.md"], ["notes/personal-profile.md"]],
      attributionKind: "retrieval",
      note: "cross-source preference retrieval should surface both stable memory and notes"
    }
  ),
  ...makeSearchSeries(
    "cross-source-region-search",
    "cross-source",
    [
      "current deploy region older us-east-1 ignored",
      "deploy region final decision versus older draft",
      "eu-west-1 current and us-east-1 draft",
      "which region is current and what older draft should be ignored"
    ],
    ["eu-west-1", "us-east-1"],
    {
      expectedAll: ["eu-west-1", "us-east-1"],
      expectedSources: ["MEMORY.md", "memory/2026-04-10.md", "memory/2026-04-12.md"],
      expectedSourceGroups: [["MEMORY.md"], ["memory/2026-04-10.md"], ["memory/2026-04-12.md"]],
      attributionKind: "temporal",
      note: "cross-source supersede retrieval should surface current stable, current daily, and old daily"
    }
  ),
  ...makeSearchSeries(
    "supersede-editor-search",
    "supersede",
    [
      "current editor and previous editor",
      "Zed replaced Vim",
      "what editor is current versus older"
    ],
    ["Zed", "Vim"],
    {
      expectedAll: ["Zed", "Vim"],
      expectedSources: ["memory/2026-04-10.md", "memory/2026-04-12.md"],
      expectedSourceGroups: [["memory/2026-04-10.md"], ["memory/2026-04-12.md"]],
      attributionKind: "temporal"
    }
  ),
  ...makeSearchSeries(
    "supersede-demo-search",
    "supersede",
    [
      "clinic demo now versus before",
      "15:00 demo replaced 10:00",
      "current clinic demo time and previous time"
    ],
    ["15:00", "10:00"],
    {
      expectedAll: ["15:00", "10:00"],
      expectedSources: ["memory/2026-04-10.md", "memory/2026-04-12.md"],
      expectedSourceGroups: [["memory/2026-04-10.md"], ["memory/2026-04-12.md"]],
      attributionKind: "temporal"
    }
  ),
  ...makeSearchSeries(
    "current-editor-search",
    "temporal-current",
    [
      "current main editor",
      "what is Maya using as main editor now",
      "switched from Vim to Zed",
      "current editor Zed"
    ],
    ["Zed"],
    {
      expectedSources: ["memory/2026-04-12.md"],
      attributionKind: "temporal"
    }
  ),
  ...makeSearchSeries(
    "current-demo-search",
    "temporal-current",
    [
      "clinic demo moved time",
      "current clinic demo time",
      "next Tuesday 15:00 Shanghai time",
      "demo scheduled now"
    ],
    ["15:00", "Shanghai"],
    {
      expectedSources: ["memory/2026-04-12.md"],
      attributionKind: "temporal"
    }
  ),
  ...makeSearchSeries(
    "current-region-search",
    "temporal-current",
    [
      "current deploy region",
      "default deploy region now",
      "eu-west-1 current region",
      "older us-east-1 should be ignored"
    ],
    ["eu-west-1"],
    {
      expectedSources: ["memory/2026-04-12.md", "MEMORY.md"],
      attributionKind: "temporal"
    }
  ),
  ...makeSearchSeries(
    "current-notebook-search",
    "temporal-current",
    [
      "current notebook for meetings",
      "charcoal A5 notebook",
      "not the old blue pocket notebook",
      "meeting notebook now"
    ],
    ["charcoal A5 notebook"],
    {
      expectedSources: ["memory/2026-04-12.md"],
      attributionKind: "temporal"
    }
  ),
  ...makeSearchSeries(
    "current-keyboard-search",
    "temporal-current",
    [
      "current keyboard preference",
      "tactile switches",
      "linear red switches or tactile"
    ],
    ["tactile switches"],
    {
      expectedSources: ["memory/2026-04-12.md"],
      attributionKind: "temporal"
    }
  ),
  ...makeSearchSeries(
    "history-editor-search",
    "temporal-history",
    [
      "previous editor before Zed",
      "still using Vim",
      "main editor on 2026-04-10"
    ],
    ["Vim"],
    {
      expectedSources: ["memory/2026-04-10.md"],
      attributionKind: "history"
    }
  ),
  ...makeSearchSeries(
    "history-demo-search",
    "temporal-history",
    [
      "clinic demo on 2026-04-10",
      "older demo time 10:00",
      "demo was planned for next Tuesday at 10:00"
    ],
    ["10:00"],
    {
      expectedSources: ["memory/2026-04-10.md"],
      attributionKind: "history"
    }
  ),
  ...makeSearchSeries(
    "history-region-search",
    "temporal-history",
    [
      "draft deploy region before final decision",
      "us-east-1 draft",
      "older deployment region draft"
    ],
    ["us-east-1"],
    {
      expectedSources: ["memory/2026-04-10.md"],
      attributionKind: "history"
    }
  ),
  ...makeAgentSeries(
    "agent-name",
    "agent-profile",
    [
      "Based only on your memory for this agent, what is the user's preferred name? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what name should you use for the user? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Maya Chen"],
    {
      compareLegacy: true,
      attributionKind: "bootstrap"
    }
  ),
  ...makeAgentSeries(
    "agent-timezone",
    "agent-profile",
    [
      "Based only on your memory for this agent, what is the user's timezone? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what timezone should you assume for the user? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Asia/Shanghai"],
    {
      compareLegacy: true,
      attributionKind: "bootstrap"
    }
  ),
  ...makeAgentSeries(
    "agent-project",
    "agent-project",
    [
      "Based only on your memory for this agent, what is Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, who is the design partner for Project Lantern? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Project Lantern", "Northwind Health", "analytics assistant", "clinic managers"],
    {
      compareLegacy: true,
      attributionKind: "retrieval"
    }
  ),
  ...makeAgentSeries(
    "agent-current-editor",
    "agent-temporal",
    [
      "Based only on your memory for this agent, what is the user's current main editor now? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, which editor does the user use now? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Zed"],
    {
      forbiddenAny: ["Vim"],
      compareLegacy: true,
      attributionKind: "temporal"
    }
  ),
  ...makeAgentSeries(
    "agent-current-demo",
    "agent-temporal",
    [
      "Based only on your memory for this agent, when is the clinic demo scheduled now? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what is the current clinic demo time? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["15:00", "Shanghai"],
    {
      forbiddenAny: ["10:00"],
      compareLegacy: true,
      attributionKind: "temporal"
    }
  ),
  ...makeAgentSeries(
    "agent-current-region",
    "agent-temporal",
    [
      "Based only on your memory for this agent, what is the confirmed default deploy region now? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, which deploy region should be used now? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["eu-west-1"],
    {
      forbiddenAny: ["us-east-1"],
      compareLegacy: true,
      attributionKind: "temporal"
    }
  ),
  ...makeAgentSeries(
    "agent-current-notebook",
    "agent-temporal",
    [
      "Based only on your memory for this agent, what notebook does the user currently use for meetings? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what is the user's current meeting notebook now? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["charcoal A5 notebook"],
    {
      forbiddenAny: ["blue pocket notebook"],
      compareLegacy: true,
      attributionKind: "temporal"
    }
  ),
  ...makeAgentSeries(
    "agent-role",
    "agent-profile",
    [
      "Based only on your memory for this agent, what is the user's role? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what does Maya Chen do? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["independent product engineer", "clinic analytics assistant"],
    {
      compareLegacy: true,
      attributionKind: "bootstrap"
    }
  ),
  ...makeAgentSeries(
    "agent-preference-async",
    "agent-preference",
    [
      "Based only on your memory for this agent, does the user prefer async written updates or live voice calls? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, should you avoid voice calls when async text will work? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["async", "voice calls", "yes"],
    {
      attributionKind: "retrieval"
    }
  ),
  ...makeAgentSeries(
    "agent-preference-coffee",
    "agent-preference",
    [
      "Based only on your memory for this agent, what coffee order should you assume for the user? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, how does Maya order coffee? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["flat white", "oat milk", "no sugar"],
    {
      attributionKind: "bootstrap"
    }
  ),
  ...makeAgentSeries(
    "agent-preference-seat",
    "agent-preference",
    [
      "Based only on your memory for this agent, what seat should be preferred for flights? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, does Maya prefer an aisle or window seat? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["aisle"],
    {
      attributionKind: "retrieval"
    }
  ),
  ...makeAgentSeries(
    "agent-preference-carry-on",
    "agent-preference",
    [
      "Based only on your memory for this agent, does the user usually travel with only a carry-on? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what is Maya's carry-on travel preference? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["carry-on", "yes"],
    {
      attributionKind: "retrieval"
    }
  ),
  ...makeAgentSeries(
    "agent-preference-charts",
    "agent-preference",
    [
      "Based only on your memory for this agent, how should charts be optimized for Maya? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what chart style improves readability for the user? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["readability", "high contrast"],
    {
      attributionKind: "retrieval"
    }
  ),
  ...makeAgentSeries(
    "agent-rule-debug",
    "agent-rule",
    [
      "Based only on your memory for this agent, what debugging rule should you follow first? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, should debugging start from broad fixes or the smallest reproducible example? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["smallest reproducible example"],
    {
      attributionKind: "bootstrap"
    }
  ),
  ...makeAgentSeries(
    "agent-rule-release",
    "agent-rule",
    [
      "Based only on your memory for this agent, what tag format should stable releases use? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, how should stable release tags be written? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["vX.Y.Z"],
    {
      attributionKind: "bootstrap"
    }
  ),
  ...makeAgentSeries(
    "agent-rule-no-guess",
    "agent-rule",
    [
      "Based only on your memory for this agent, what should happen if memory is missing or conflicting? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, should you guess when memory conflicts? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["do not guess", "conflicting", "missing"],
    {
      attributionKind: "bootstrap"
    }
  ),
  ...makeAgentSeries(
    "agent-project-codename",
    "agent-project",
    [
      "Based only on your memory for this agent, what is the codename for Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what codename should you associate with the clinic analytics assistant project? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Lantern"],
    {
      attributionKind: "retrieval"
    }
  ),
  ...makeAgentSeries(
    "agent-project-milestone",
    "agent-project",
    [
      "Based only on your memory for this agent, what is the current milestone for Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, which phase is Project Lantern in now? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Stage 2 pilot"],
    {
      attributionKind: "retrieval"
    }
  ),
  ...makeAgentSeries(
    "agent-project-kpi",
    "agent-project",
    [
      "Based only on your memory for this agent, what is the primary KPI for Project Lantern? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, which KPI matters most for the Project Lantern pilot? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["weekly active clinics"],
    {
      attributionKind: "retrieval"
    }
  ),
  ...makeAgentSeries(
    "agent-project-sla",
    "agent-project",
    [
      "Based only on your memory for this agent, what support SLA applies to pilot customers? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, how quickly should pilot customer support respond? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["4 business hours"],
    {
      attributionKind: "retrieval"
    }
  ),
  ...makeAgentSeries(
    "agent-project-reporting",
    "agent-project",
    [
      "Based only on your memory for this agent, when should the pilot summary be sent? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what reporting cadence does Project Lantern use? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Friday", "pilot summary"],
    {
      attributionKind: "retrieval"
    }
  ),
  ...makeAgentSeries(
    "agent-project-city",
    "agent-project",
    [
      "Based only on your memory for this agent, what is the launch city for the pilot? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, where is the Project Lantern pilot launching? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Singapore"],
    {
      attributionKind: "retrieval"
    }
  ),
  ...makeAgentSeries(
    "agent-current-keyboard",
    "agent-temporal",
    [
      "Based only on your memory for this agent, what is the user's current keyboard preference? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, should the user prefer tactile switches or linear red switches now? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["tactile switches"],
    {
      forbiddenAny: ["linear red switches"],
      attributionKind: "temporal"
    }
  ),
  ...makeAgentSeries(
    "agent-history-editor",
    "agent-history",
    [
      "Based only on your memory for this agent, what editor was Maya still using on 2026-04-10? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, before switching to Zed, which editor was the main editor? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["Vim"],
    {
      attributionKind: "history"
    }
  ),
  ...makeAgentSeries(
    "agent-history-demo",
    "agent-history",
    [
      "Based only on your memory for this agent, what time was the clinic demo planned for on 2026-04-10? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, before the latest update, when was the clinic demo scheduled? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["10:00", "Shanghai"],
    {
      attributionKind: "history"
    }
  ),
  ...makeAgentSeries(
    "agent-history-region",
    "agent-history",
    [
      "Based only on your memory for this agent, what draft deploy region appeared before the final decision? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, before eu-west-1 was confirmed, which region was only a draft? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["us-east-1"],
    {
      attributionKind: "history"
    }
  ),
  ...makeAgentSeries(
    "agent-zh-profile",
    "agent-zh",
    [
      "仅根据你当前这个 agent 的记忆，用户希望你怎么称呼她？如果记忆里没有，请直接回答：I don't know based on current memory.",
      "仅根据你当前这个 agent 的记忆，用户的时区是什么？如果记忆里没有，请直接回答：I don't know based on current memory."
    ],
    ["Maya Chen", "Asia/Shanghai"],
    {
      attributionKind: "bootstrap"
    }
  ),
  ...makeAgentSeries(
    "agent-zh-project",
    "agent-zh",
    [
      "仅根据你当前这个 agent 的记忆，Project Lantern 现在的里程碑是什么？如果记忆里没有，请直接回答：I don't know based on current memory.",
      "仅根据你当前这个 agent 的记忆，Project Lantern 的试点城市在哪里？如果记忆里没有，请直接回答：I don't know based on current memory."
    ],
    ["Stage 2 pilot", "Singapore"],
    {
      attributionKind: "retrieval"
    }
  ),
  ...makeAgentSeries(
    "agent-zh-temporal",
    "agent-zh",
    [
      "仅根据你当前这个 agent 的记忆，用户现在主要用什么编辑器？如果记忆里没有，请直接回答：I don't know based on current memory.",
      "仅根据你当前这个 agent 的记忆，用户当前默认部署区域是什么？如果记忆里没有，请直接回答：I don't know based on current memory."
    ],
    ["Zed", "eu-west-1"],
    {
      forbiddenAny: ["Vim", "us-east-1"],
      attributionKind: "temporal"
    }
  ),
  ...makeAgentSeries(
    "agent-negative",
    "negative",
    [
      "Based only on your memory for this agent, what is the user's favorite programming language? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, which hotel chain does the user usually book? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what is the user's hometown? If memory is missing, reply exactly: I don't know based on current memory.",
      "Based only on your memory for this agent, what is the user's birthday? If memory is missing, reply exactly: I don't know based on current memory."
    ],
    ["I don't know based on current memory."],
    {
      attributionKind: "negative"
    }
  )
];

const chineseMirrorCases = cases
  .map((item) => createChineseMirrorCase(item))
  .filter(Boolean);

cases.push(...chineseMirrorCases);

if (cases.length < 100) {
  throw new Error(`Expected at least 100 benchmark cases, got ${cases.length}`);
}

export default cases;
