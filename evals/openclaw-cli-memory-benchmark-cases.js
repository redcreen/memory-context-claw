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
    ["Project Lantern", "Northwind Health"],
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

if (cases.length < 100) {
  throw new Error(`Expected at least 100 benchmark cases, got ${cases.length}`);
}

export default cases;
