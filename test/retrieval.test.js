import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  buildStableMemoryCardsFromMarkdown,
  buildCardArtifactCandidates,
  classifyWorkspaceNoteCardEligibility,
  buildConfigCardsFromMarkdown,
  buildPolicyCardsFromMarkdown,
  buildProjectCardsFromMarkdown,
  extractJsonPayload,
  readCardArtifactCandidates,
  retrieveMemoryCandidates
} from "../src/retrieval.js";
import { shouldExcludeMemoryPath } from "../src/utils.js";
import { resolvePluginConfig } from "../src/config.js";

test("extractJsonPayload parses pure json output", () => {
  const parsed = extractJsonPayload('{"results":[{"path":"MEMORY.md"}]}');
  assert.deepEqual(parsed, { results: [{ path: "MEMORY.md" }] });
});

test("extractJsonPayload ignores leading plugin log lines", () => {
  const parsed = extractJsonPayload(
    [
      "[plugins] [task-system] plugin loaded (enabled=true)",
      "[plugins] [unified-memory-core] loaded (enabled=true)",
      '{"results":[{"path":"memory/2026-04-04.md","score":0.82}]}'
    ].join("\n")
  );

  assert.deepEqual(parsed, {
    results: [{ path: "memory/2026-04-04.md", score: 0.82 }]
  });
});

test("shouldExcludeMemoryPath filters plugin repo paths", () => {
  assert.equal(
    shouldExcludeMemoryPath(
      "../../Project/unified-memory-core/README.md",
      ["/unified-memory-core/"]
    ),
    true
  );
  assert.equal(
    shouldExcludeMemoryPath("workspace/MEMORY.md", ["/unified-memory-core/"]),
    false
  );
});

test("resolvePluginConfig enables query rewrite by default", () => {
  const config = resolvePluginConfig({});
  assert.equal(config.queryRewrite.enabled, true);
  assert.equal(config.queryRewrite.maxQueries, 4);
  assert.equal(
    config.excludePaths.includes("/unified-memory-core-enabled-vs-disabled-report.md"),
    true
  );
});

test("resolvePluginConfig merges default and preset exclude paths", () => {
  const config = resolvePluginConfig({
    excludePaths: ["/custom-report.md"]
  });
  assert.equal(config.excludePaths.includes("/unified-memory-core-enabled-vs-disabled-report.md"), true);
  assert.equal(config.excludePaths.includes("/custom-report.md"), true);
});

test("buildCardArtifactCandidates promotes matching fact cards into retrieval candidates", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "饮食偏好",
      fact: "你爱吃牛排",
      tags: ["long-term", "preference"],
      sourcePath: "memory/2026-04-05-food-preference.md",
      sourceChannel: "assistant-fact",
      recommendation: { action: "review-memory-md", confidence: "medium" }
    },
    {
      title: "记忆机制理解",
      fact: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。",
      tags: ["long-term", "memory"],
      sourcePath: "memory/2026-04-05-memory-rule.md",
      sourceChannel: "assistant-conclusion",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    }
  ], "我爱吃什么", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "memory/2026-04-05-food-preference.md");
  assert.match(candidates[0].snippet, /你爱吃牛排/);
  assert.equal(candidates[0].source, "cardArtifact");
});

test("buildStableMemoryCardsFromMarkdown derives identity and style cards from MEMORY.md", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    [
      "# MEMORY.md - 长期记忆",
      "",
      "## 用户",
      "- **姓名**: 刘超（超哥）",
      "- **时区**: GMT+8（北京时间）",
      "- **饮食偏好**: 牛排",
      "- **出生年份说明**: 实际出生年份为 1983；身份证登记生日年份为 1982（历史登记错误，但证件信息客观如此）",
      "- **沟通风格**: 直接、实用、不废话"
    ].join("\n"),
    "MEMORY.md"
  );

  assert.ok(cards.some((card) => card.title === "身份与称呼" && /刘超.*超哥/.test(card.fact)));
  assert.ok(cards.some((card) => card.title === "时区信息" && /GMT\+8（北京时间）/.test(card.fact)));
  assert.ok(cards.some((card) => card.title === "饮食偏好" && /你爱吃牛排/.test(card.fact)));
  assert.ok(cards.some((card) => card.title === "身份信息说明" && /实际出生年份是1983.*身份证登记生日年份是1982/.test(card.fact)));
  assert.ok(cards.some((card) => card.title === "稳定规则" && /直接、实用、不废话/.test(card.fact)));
});

test("buildCardArtifactCandidates promotes timezone cards for timezone queries", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    "- **时区**: GMT+8（北京时间）",
    "MEMORY.md"
  );

  const candidates = buildCardArtifactCandidates(cards, "我的时区是什么", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].source, "cardArtifact");
  assert.match(candidates[0].snippet, /GMT\+8|北京时间/);
});

test("buildCardArtifactCandidates promotes style cards for communication-style queries", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    "- **沟通风格**: 直接、实用、不废话",
    "MEMORY.md"
  );

  const candidates = buildCardArtifactCandidates(cards, "你应该怎么跟我沟通", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].source, "cardArtifact");
  assert.match(candidates[0].snippet, /直接、实用、不废话/);
});

test("buildStableMemoryCardsFromMarkdown derives birthday and family cards from daily memory", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    [
      "# 2026-04-05",
      "- 用户新增家庭与生日信息：超哥生日为 1983-02-06；农历生日为腊月二十四。",
      "- 用户确认：实际出生年份为 1983；身份证登记生日年份为 1982。这是历史登记错误，但作为身份证件信息属于客观事实。",
      "- 用户女儿名叫刘子妍，生日为 2014-12-29，当前上五年级。",
      "- 用户儿子名叫刘子暄，生日为 2007-07-25，当前上高三。",
      "- 用户说明一条待校验信息：\"身份证是19282年2月6日\"。该表述明显存在笔误或歧义，暂不作为已确认身份信息使用，后续需用户再次确认真实含义。"
    ].join("\n"),
    "memory/2026-04-05.md"
  );

  assert.ok(cards.some((card) => /你的生日是1983-02-06/.test(card.fact)));
  assert.ok(cards.some((card) => /实际出生年份是1983.*身份证登记生日年份是1982/.test(card.fact)));
  assert.ok(cards.some((card) => /你女儿叫刘子妍/.test(card.fact)));
  assert.ok(cards.some((card) => /你儿子叫刘子暄/.test(card.fact)));
  assert.ok(cards.some((card) => /你有一儿一女，孩子情况是：女儿叫刘子妍.*儿子叫刘子暄/.test(card.fact)));
  assert.ok(cards.some((card) => /身份证生日信息待确认.*暂不作为已确认身份信息使用/.test(card.fact)));
  assert.ok(cards.every((card) => !/19282年2月6日/.test(card.fact)));
});

test("buildCardArtifactCandidates promotes MEMORY.md identity cards for identity queries", () => {
  const memoryCards = buildStableMemoryCardsFromMarkdown(
    "- **姓名**: 刘超（超哥）\n- **沟通风格**: 直接、实用、不废话",
    "MEMORY.md"
  );

  const candidates = buildCardArtifactCandidates(memoryCards, "你怎么称呼我", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "MEMORY.md");
  assert.equal(candidates[0].source, "cardArtifact");
  assert.match(candidates[0].snippet, /刘超|超哥/);
});

test("buildCardArtifactCandidates promotes rule cards for rule-style queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "饮食偏好",
      fact: "你爱吃牛排",
      tags: ["long-term", "preference"],
      sourcePath: "memory/2026-04-05-food-preference.md",
      sourceChannel: "assistant-fact",
      recommendation: { action: "review-memory-md", confidence: "medium" }
    },
    {
      title: "记忆机制理解",
      fact: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。",
      tags: ["long-term", "memory", "rule", "workflow"],
      sourcePath: "memory/2026-04-05-memory-rule.md",
      sourceChannel: "assistant-conclusion",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    }
  ], "MEMORY.md 应该放什么内容", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "memory/2026-04-05-memory-rule.md");
  assert.match(candidates[0].snippet, /长期稳定|反复复用/);
  assert.equal(candidates[0].source, "cardArtifact");
});

test("buildCardArtifactCandidates prefers stable MEMORY.md rule cards over session-derived rule cards", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "稳定规则",
      fact: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。",
      tags: ["long-term", "memory", "rule", "workflow"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    },
    {
      title: "记忆机制理解",
      fact: "MEMORY.md 里通常放长期稳定、之后还会反复用到的规则和偏好。",
      tags: ["long-term", "memory", "rule", "workflow"],
      sourcePath: "sessions/103587ff-4d67-4598-8de7-ba361cf96fca.jsonl",
      sourceChannel: "assistant-conclusion",
      recommendation: { action: "review-memory-md", confidence: "medium" }
    }
  ], "MEMORY.md 应该放什么内容", 6);

  assert.ok(candidates.length >= 2);
  assert.equal(candidates[0].path, "MEMORY.md");
  assert.match(candidates[0].snippet, /长期稳定|反复复用/);
});

test("buildCardArtifactCandidates prefers formal policy rule cards over session-derived rule cards", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "正式记忆准入规则",
      fact: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。",
      tags: ["long-term", "memory", "rule", "workflow", "policy"],
      sourcePath: "formal-memory-policy.md",
      sourceChannel: "formal-policy",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "记忆机制理解",
      fact: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。",
      tags: ["long-term", "memory", "rule", "workflow"],
      sourcePath: "sessions/103587ff-4d67-4598-8de7-ba361cf96fca.jsonl",
      sourceChannel: "assistant-conclusion",
      recommendation: { action: "review-memory-md", confidence: "medium" }
    }
  ], "MEMORY.md 应该放什么内容", 6);

  assert.ok(candidates.length >= 2);
  assert.equal(candidates[0].path, "formal-memory-policy.md");
});

test("buildCardArtifactCandidates promotes background cards for background-style queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "饮食偏好",
      fact: "你爱吃牛排",
      tags: ["long-term", "preference"],
      sourcePath: "memory/2026-04-05-food-preference.md",
      sourceChannel: "assistant-fact",
      recommendation: { action: "review-memory-md", confidence: "medium" }
    },
    {
      title: "职业背景",
      fact: "你2025年8月开始做毛绒玩具工厂，从互联网转型到实体制造业。",
      tags: ["long-term", "work", "background"],
      sourcePath: "memory/2026-04-05-work-background.md",
      sourceChannel: "assistant-fact",
      recommendation: { action: "review-memory-md", confidence: "medium" }
    }
  ], "你现在做什么行业", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "memory/2026-04-05-work-background.md");
  assert.match(candidates[0].snippet, /毛绒玩具工厂|实体制造业/);
  assert.equal(candidates[0].source, "cardArtifact");
});

test("buildCardArtifactCandidates promotes project cards for project-style queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "饮食偏好",
      fact: "你爱吃牛排",
      tags: ["long-term", "preference"],
      sourcePath: "memory/2026-04-05-food-preference.md",
      sourceChannel: "assistant-fact",
      recommendation: { action: "review-memory-md", confidence: "medium" }
    },
    {
      title: "项目定位",
      fact: "Unified Memory Core 是共享记忆产品层，也是 OpenClaw 的 context engine adapter；它把长期记忆里的稳定事实和规则投影成当前轮可用的上下文。",
      tags: ["long-term", "project", "memory"],
      sourcePath: "memory/2026-04-05-project-positioning.md",
      sourceChannel: "assistant-conclusion",
      recommendation: { action: "review-memory-md", confidence: "medium" }
    }
  ], "这个项目主要解决什么问题", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "memory/2026-04-05-project-positioning.md");
  assert.match(candidates[0].snippet, /共享记忆产品层|OpenClaw adapter|投影成当前轮可用上下文/);
  assert.equal(candidates[0].source, "cardArtifact");
});

test("buildStableMemoryCardsFromMarkdown derives reminder-channel card from MEMORY.md", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    "- 当用户说“提醒”时，默认使用飞书任务 + 苹果日历双通道。",
    "MEMORY.md"
  );

  assert.ok(cards.some((card) => /提醒/.test(card.title) && /飞书任务/.test(card.fact) && /苹果日历/.test(card.fact)));
});

test("buildCardArtifactCandidates prefers reminder cards for reminder queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "提醒通道偏好",
      fact: "当你说提醒时，默认使用飞书任务 + 苹果日历双通道。",
      tags: ["long-term", "workflow", "rule", "reminder"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    },
    {
      title: "身份与称呼",
      fact: "你叫刘超，我平时记你是超哥",
      tags: ["long-term", "identity"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    }
  ], "我说提醒时默认用什么", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "MEMORY.md");
  assert.match(candidates[0].snippet, /飞书任务|苹果日历/);
});

test("buildStableMemoryCardsFromMarkdown derives execution-rule card from MEMORY.md", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    "2. **默认推进，风险动作再确认**：纯内部、低风险、可逆操作，收到明确任务后可直接执行；只有对外发送、删除/覆盖、付款、提交、不可逆操作等高风险动作，才必须先确认。",
    "MEMORY.md"
  );

  assert.ok(cards.some((card) => /执行原则/.test(card.title) && /低风险/.test(card.fact) && /先确认/.test(card.fact)));
});

test("buildCardArtifactCandidates prefers execution-rule cards for execution prompts", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "执行原则",
      fact: "收到明确任务后，纯内部、低风险、可逆操作可直接执行；高风险动作才先确认。",
      tags: ["long-term", "workflow", "rule", "execution"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    },
    {
      title: "身份与称呼",
      fact: "你叫刘超，我平时记你是超哥",
      tags: ["long-term", "identity"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    }
  ], "收到明确任务后，低风险可逆操作应该怎么做", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "MEMORY.md");
  assert.match(candidates[0].snippet, /低风险|可直接执行|先确认/);
});

test("buildStableMemoryCardsFromMarkdown derives OpenViking role card from MEMORY.md", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    "- **OpenViking**: 主要长期记忆检索补充工具，用于查询个人信息、偏好、历史片段等。",
    "MEMORY.md"
  );

  assert.ok(cards.some((card) => /OpenViking/.test(card.fact) && /长期记忆检索补充工具/.test(card.fact)));
});

test("buildCardArtifactCandidates prefers OpenViking role cards for tool-role prompts", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "记忆系统分工",
      fact: "OpenViking 是主要长期记忆检索补充工具，用于查询个人信息、偏好、历史片段等。",
      tags: ["long-term", "tool", "role", "memory"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    },
    {
      title: "身份与称呼",
      fact: "你叫刘超，我平时记你是超哥",
      tags: ["long-term", "identity"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    }
  ], "OpenViking 是做什么的", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "MEMORY.md");
  assert.match(candidates[0].snippet, /OpenViking|长期记忆检索补充工具/);
});

test("buildStableMemoryCardsFromMarkdown derives agent-role card from MEMORY.md", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    "- **编程工作** → `code` Agent",
    "MEMORY.md"
  );

  assert.ok(cards.some((card) => /Agent 分工/.test(card.title) && /编程工作默认交给 code Agent/.test(card.fact)));
});

test("buildCardArtifactCandidates prefers agent-role cards for routing prompts", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "Agent 分工",
      fact: "编程工作默认交给 code Agent。",
      tags: ["long-term", "workflow", "rule", "agent-role", "routing"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    },
    {
      title: "身份与称呼",
      fact: "你叫刘超，我平时记你是超哥",
      tags: ["long-term", "identity"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    }
  ], "编程工作应该交给哪个 Agent", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "MEMORY.md");
  assert.match(candidates[0].snippet, /编程工作默认交给 code Agent/);
});

test("buildStableMemoryCardsFromMarkdown derives main-boundary card from MEMORY.md", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    "- main 负责总协调、任务判断、任务分派、结果汇总。",
    "MEMORY.md"
  );

  assert.ok(cards.some((card) => /main 边界/.test(card.title) && /main 负责总协调、任务判断、任务分派、结果汇总/.test(card.fact)));
});

test("buildCardArtifactCandidates prefers main-boundary cards for boundary prompts", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "main 边界",
      fact: "main 负责总协调、任务判断、任务分派、结果汇总。",
      tags: ["long-term", "workflow", "rule", "main-boundary", "routing"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    },
    {
      title: "身份与称呼",
      fact: "你叫刘超，我平时记你是超哥",
      tags: ["long-term", "identity"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    }
  ], "main 负责什么", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "MEMORY.md");
  assert.match(candidates[0].snippet, /main 负责总协调、任务判断、任务分派、结果汇总/);
});

test("buildStableMemoryCardsFromMarkdown derives main negative-boundary card from MEMORY.md", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    "- main 不长期承接明确属于专业 Agent 的具体执行。",
    "MEMORY.md"
  );

  assert.ok(cards.some((card) => /main 边界/.test(card.title) && /main 不负责长期承接明确属于专业 Agent 的具体执行/.test(card.fact)));
});

test("buildCardArtifactCandidates prefers main negative-boundary cards for negative boundary prompts", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "main 边界",
      fact: "main 不负责长期承接明确属于专业 Agent 的具体执行。",
      tags: ["long-term", "workflow", "rule", "main-boundary", "routing"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    },
    {
      title: "身份与称呼",
      fact: "你叫刘超，我平时记你是超哥",
      tags: ["long-term", "identity"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    }
  ], "main 不负责什么", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "MEMORY.md");
  assert.match(candidates[0].snippet, /main 不负责长期承接明确属于专业 Agent 的具体执行/);
});

test("buildStableMemoryCardsFromMarkdown derives status-rule card from MEMORY.md", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    '- “已开始” = 已经发出实际工具调用、后台任务或明确执行动作',
    "MEMORY.md"
  );

  assert.ok(cards.some((card) => /状态词规则/.test(card.title) && /“已开始”表示已经发出实际工具调用、后台任务或明确执行动作/.test(card.fact)));
});

test("buildCardArtifactCandidates prefers status-rule cards for status prompts", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "状态词规则",
      fact: "“已开始”表示已经发出实际工具调用、后台任务或明确执行动作",
      tags: ["long-term", "workflow", "rule", "status-rule"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    },
    {
      title: "身份与称呼",
      fact: "你叫刘超，我平时记你是超哥",
      tags: ["long-term", "identity"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    }
  ], "已开始是什么意思", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "MEMORY.md");
  assert.match(candidates[0].snippet, /“已开始”表示已经发出实际工具调用、后台任务或明确执行动作/);
});

test("buildConfigCardsFromMarkdown derives provider-role config card", () => {
  const cards = buildConfigCardsFromMarkdown(
    [
      "memorySearch: {",
      "  provider: \"local\",",
      "  local: {",
      "    modelPath: \"/ABSOLUTE/PATH/TO/embeddinggemma-300m-qat-Q8_0.gguf\"",
      "  }",
      "}"
    ].join("\n"),
    "configuration.md"
  );

  assert.ok(cards.some((card) => /memorySearch\.provider/.test(card.fact) && /embedding/.test(card.fact)));
});

test("buildCardArtifactCandidates prefers provider-role config cards for provider queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "memorySearch provider 角色",
      fact: "memorySearch.provider 决定长期记忆检索使用哪个 embedding / memory_search provider，不影响主聊天模型。",
      tags: ["long-term", "config", "provider", "embedding"],
      sourcePath: "configuration.md",
      sourceChannel: "config-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "身份信息说明",
      fact: "你的实际出生年份是1983；身份证登记生日年份是1982，这是历史登记错误，但证件信息客观如此。",
      tags: ["identity", "background"],
      sourcePath: "MEMORY.md",
      sourceChannel: "memory-md",
      recommendation: { action: "skip-memory-md-existing", confidence: "high" }
    }
  ], "memorySearch.provider 是做什么的", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "configuration.md");
  assert.match(candidates[0].snippet, /embedding|memory_search/);
});

test("buildProjectCardsFromMarkdown derives stable project positioning cards", () => {
  const cards = buildProjectCardsFromMarkdown(
    [
      "# unified-memory-core",
      "",
      "`Unified Memory Core` is the shared-memory product layer.",
      "",
      "当前仓库里的 `unified-memory-core` 负责 OpenClaw adapter，把统一记忆底座里的稳定事实和规则投影成当前轮可用上下文。"
    ].join("\n"),
    "README.md"
  );

  assert.ok(cards.length >= 1);
  assert.equal(cards[0].title, "项目定位");
  assert.match(cards[0].fact, /共享记忆产品层|OpenClaw adapter|投影成当前轮可用上下文/);
});

test("buildProjectCardsFromMarkdown derives workspace-structure project card", () => {
  const cards = buildProjectCardsFromMarkdown(
    [
      "workspace/",
      "├── MEMORY.md",
      "├── memory/",
      "└── notes/"
    ].join("\n"),
    "README.md"
  );

  assert.ok(cards.some((card) => card.title === "项目内置 workspace 结构" && /workspace\/MEMORY\.md/.test(card.fact)));
});

test("buildProjectCardsFromMarkdown derives release-install project card", () => {
  const cards = buildProjectCardsFromMarkdown(
    [
      "Stable release:",
      "Development head:",
      "openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.2.0",
      "openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git"
    ].join("\n"),
    "README.md"
  );

  assert.ok(cards.some((card) => card.title === "安装发布规则" && /release tag.*main/.test(card.fact)));
});

test("buildProjectCardsFromMarkdown derives lossless-understanding concept card", () => {
  const cards = buildProjectCardsFromMarkdown(
    [
      "OpenClaw 内置长期记忆负责长期保存和检索。",
      "Lossless 更偏向上下文编排与信息保真。"
    ].join("\n"),
    "workspace/notes/openclaw-memory-vs-lossless.md"
  );

  assert.ok(cards.some((card) => card.title === "长期记忆与 Lossless 分工" && /长期记忆负责存和找.*Lossless.*送进模型/.test(card.fact)));
});

test("buildProjectCardsFromMarkdown derives workspace-notes admissibility card", () => {
  const cards = buildProjectCardsFromMarkdown(
    [
      "workspace/notes/*.md stores project or domain notes.",
      "Not every workspace/notes/*.md file should become a stable card.",
      "Only notes with a clear summary, a reusable rule/concept, and a clear reuse boundary should be promoted.",
      "Historical roadmaps and temporary config notes should stay as background notes.",
      "适用场景"
    ].join("\n"),
    "README.md"
  );

  assert.ok(cards.some((card) => card.title === "workspace notes 准入规则" && /历史 roadmap.*背景 notes/.test(card.fact)));
});

test("classifyWorkspaceNoteCardEligibility accepts stable concept notes with clear structure", () => {
  const result = classifyWorkspaceNoteCardEligibility(
    [
      "# OpenClaw 内置长期记忆 vs Lossless 类插件",
      "",
      "## 一句话结论",
      "OpenClaw 内置长期记忆负责长期保存和检索，Lossless 更偏向上下文编排与信息保真。",
      "",
      "## 适用场景",
      "- 当需要解释为什么已经有长期记忆还会推荐 Lossless",
      "",
      "OpenClaw 内置长期记忆负责长期保存和检索。",
      "Lossless 更偏向上下文编排与信息保真。"
    ].join("\n"),
    "workspace/notes/openclaw-memory-vs-lossless.md"
  );

  assert.equal(result.eligible, true);
  assert.equal(result.noteType, "concept-note");
  assert.equal(result.reason, "stable-concept-note");
});

test("classifyWorkspaceNoteCardEligibility rejects historical roadmap notes", () => {
  const result = classifyWorkspaceNoteCardEligibility(
    [
      "# Unified Memory Core 项目 Roadmap",
      "",
      "## 一句话结论",
      "Unified Memory Core 是共享记忆产品层。",
      "",
      "## 适用场景",
      "- 看项目阶段推进",
      "",
      "## 当前已经做完的事情",
      "- 产品骨架已经完成",
      "",
      "## 接下来要做什么",
      "- 发布前整理"
    ].join("\n"),
    "workspace/notes/unified-memory-core-roadmap.md"
  );

  assert.equal(result.eligible, false);
  assert.equal(result.noteType, "historical-note");
  assert.equal(result.reason, "historical-roadmap-note");
});

test("classifyWorkspaceNoteCardEligibility rejects config notes covered by canonical docs", () => {
  const result = classifyWorkspaceNoteCardEligibility(
    [
      "# Unified Memory Core 配置说明",
      "",
      "## 一句话结论",
      "unified-memory-core 的主配置分成两层。",
      "",
      "## 适用场景",
      "- 当需要解释配置应该怎么写",
      "",
      "## 最小配置",
      "openclaw.json",
      "plugins.entries[\"unified-memory-core\"].config"
    ].join("\n"),
    "workspace/notes/unified-memory-core-config.md"
  );

  assert.equal(result.eligible, false);
  assert.equal(result.noteType, "config-note");
  assert.equal(result.reason, "covered-by-canonical-config-doc");
});

test("buildPolicyCardsFromMarkdown derives stable formal memory policy cards", () => {
  const cards = buildPolicyCardsFromMarkdown(
    [
      "# Formal Memory Policy",
      "",
      "1. `MEMORY.md`",
      "   - 长期稳定记忆",
      "   - 高优先级、会反复复用",
      "",
      "2. `memory/YYYY-MM-DD.md`",
      "   - 已确认",
      "   - 适合保留阶段事实、近期确认信息、项目结论",
      "",
      "3. 待确认信息必须优先进入 pending，不得默认写入 `MEMORY.md` 或 `memory/YYYY-MM-DD.md`"
    ].join("\n"),
    "formal-memory-policy.md"
  );

  assert.ok(cards.some((card) => card.title === "正式记忆准入规则" && /长期稳定.*反复复用/.test(card.fact)));
  assert.ok(cards.some((card) => card.title === "正式 daily 准入规则" && /已确认.*阶段事实|近期确认信息/.test(card.fact)));
  assert.ok(cards.some((card) => card.title === "待确认信息准入规则" && /待确认信息应该先进入 pending/.test(card.fact)));
});

test("buildConfigCardsFromMarkdown derives stable plugin config cards", () => {
  const cards = buildConfigCardsFromMarkdown(
    [
      "plugins: {",
      '  allow: [\"unified-memory-core\"],',
      "  slots: {",
      '    contextEngine: \"unified-memory-core\"',
      "  },",
      "  entries: {",
      '    \"unified-memory-core\": {',
      "      enabled: true",
      "    }",
      "  }",
      "}"
    ].join("\n"),
    "configuration.md"
  );

  assert.ok(cards.some((card) => card.title === "插件最小配置" && /contextEngine.*enabled: true/.test(card.fact)));
});

test("buildConfigCardsFromMarkdown derives release-install config card", () => {
  const cards = buildConfigCardsFromMarkdown(
    [
      "openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.2.0",
      "openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git"
    ].join("\n"),
    "README.md"
  );

  assert.ok(cards.some((card) => card.title === "安装发布规则" && /release tag.*main/.test(card.fact)));
});

test("buildConfigCardsFromMarkdown derives install-verify config card", () => {
  const cards = buildConfigCardsFromMarkdown(
    [
      "openclaw plugins list",
      "openclaw memory status --json"
    ].join("\n"),
    "configuration.md"
  );

  assert.ok(cards.some((card) => card.title === "安装验证步骤" && /plugins list.*memory status --json/.test(card.fact)));
});

test("buildCardArtifactCandidates prefers config cards over project cards for config queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "项目定位",
      fact: "Unified Memory Core 是共享记忆产品层，也是 OpenClaw 的 context engine adapter；它把长期记忆里的稳定事实和规则投影成当前轮可用的上下文。",
      tags: ["long-term", "project", "memory"],
      sourcePath: "README.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "插件最小配置",
      fact: "unified-memory-core 的最小配置是：把它挂到 contextEngine，并在 entries 里 enabled: true。",
      tags: ["long-term", "project", "config", "memory"],
      sourcePath: "configuration.md",
      sourceChannel: "config-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    }
  ], "unified-memory-core 这个插件的配置应该怎么写", 6);

  assert.ok(candidates.length >= 2);
  assert.equal(candidates[0].path, "configuration.md");
  assert.match(candidates[0].snippet, /contextEngine|enabled: true/);
});

test("buildCardArtifactCandidates prefers project cards over config cards for project queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "项目定位",
      fact: "Unified Memory Core 是共享记忆产品层，也是 OpenClaw 的 context engine adapter；它把长期记忆里的稳定事实和规则投影成当前轮可用的上下文。",
      tags: ["long-term", "project", "memory"],
      sourcePath: "README.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "插件最小配置",
      fact: "unified-memory-core 的最小配置是：把它挂到 contextEngine，并在 entries 里 enabled: true。",
      tags: ["long-term", "project", "config", "memory"],
      sourcePath: "configuration.md",
      sourceChannel: "config-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    }
  ], "这个项目主要解决什么问题", 6);

  assert.ok(candidates.length >= 2);
  assert.equal(candidates[0].path, "README.md");
  assert.match(candidates[0].snippet, /共享记忆产品层|OpenClaw adapter|投影成当前轮可用上下文/);
});

test("buildCardArtifactCandidates prefers release-install cards for install queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "安装发布规则",
      fact: "普通用户默认应安装 release tag；只有主动跟进最新开发时才直接安装 main。",
      tags: ["long-term", "project", "config", "release", "install"],
      sourcePath: "README.md",
      sourceChannel: "config-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "项目定位",
      fact: "Unified Memory Core 是共享记忆产品层，也是 OpenClaw 的 context engine adapter；它把长期记忆里的稳定事实和规则投影成当前轮可用的上下文。",
      tags: ["long-term", "project", "memory"],
      sourcePath: "README.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    }
  ], "普通用户应该安装稳定版还是 main", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "README.md");
  assert.match(candidates[0].snippet, /release tag|main/);
});

test("buildCardArtifactCandidates prefers install-verify cards for verification queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "安装验证步骤",
      fact: "安装后先运行 openclaw plugins list，确认 unified-memory-core 已加载；再运行 openclaw memory status --json，确认长期记忆索引正常。",
      tags: ["long-term", "project", "config", "verify"],
      sourcePath: "configuration.md",
      sourceChannel: "config-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "插件最小配置",
      fact: "unified-memory-core 的最小配置是：把它挂到 contextEngine，并在 entries 里 enabled: true。",
      tags: ["long-term", "project", "config", "memory"],
      sourcePath: "configuration.md",
      sourceChannel: "config-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    }
  ], "安装后怎么确认插件已经生效", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "configuration.md");
  assert.match(candidates[0].snippet, /plugins list|memory status --json|已加载/);
});

test("buildCardArtifactCandidates prefers workspace-layout project cards for workspace structure queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "项目内置 workspace 结构",
      fact: "项目内置 workspace 建议是：workspace/MEMORY.md 放长期规则，workspace/memory/ 放 daily memory，workspace/notes/ 放背景笔记。",
      tags: ["long-term", "project", "workspace", "memory"],
      sourcePath: "README.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "项目定位",
      fact: "Unified Memory Core 是共享记忆产品层，也是 OpenClaw 的 context engine adapter；它把长期记忆里的稳定事实和规则投影成当前轮可用的上下文。",
      tags: ["long-term", "project", "memory"],
      sourcePath: "README.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    }
  ], "这个项目的内置 workspace 目录应该怎么组织", 6);

  assert.ok(candidates.length >= 1);
  assert.match(candidates[0].snippet, /workspace\/MEMORY\.md|workspace\/memory\/|workspace\/notes\//);
});

test("buildCardArtifactCandidates prefers workspace-layout cards for long-memory directory rule queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "项目内置 workspace 结构",
      fact: "项目内置 workspace 建议是：workspace/MEMORY.md 放长期规则，workspace/memory/ 放 daily memory，workspace/notes/ 放背景笔记。",
      tags: ["long-term", "project", "workspace", "memory"],
      sourcePath: "README.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "正式记忆准入规则",
      fact: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。",
      tags: ["long-term", "memory", "rule", "workflow", "policy"],
      sourcePath: "formal-memory-policy.md",
      sourceChannel: "formal-policy",
      recommendation: { action: "review-memory-md", confidence: "high" }
    }
  ], "长期记忆目录规则是什么", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "README.md");
  assert.match(candidates[0].snippet, /workspace\/MEMORY\.md|workspace\/memory\/|workspace\/notes\//);
});

test("buildCardArtifactCandidates prefers workspace-notes admissibility cards for workspace notes rule queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "workspace notes 准入规则",
      fact: "workspace/notes 里只有带明确总结和适用场景、并且表达稳定概念或项目分工的 notes，才适合进入 stable card；历史 roadmap 和临时配置说明应只保留为背景 notes。",
      tags: ["long-term", "project", "workspace-notes", "rule"],
      sourcePath: "README.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "项目内置 workspace 结构",
      fact: "项目内置 workspace 建议是：workspace/MEMORY.md 放长期规则，workspace/memory/ 放 daily memory，workspace/notes/ 放背景笔记。",
      tags: ["long-term", "project", "workspace", "memory"],
      sourcePath: "README.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    }
  ], "workspace/notes 里的笔记什么时候能进入 stable card", 6);

  assert.ok(candidates.length >= 1);
  assert.match(candidates[0].snippet, /stable card|历史 roadmap|背景 notes/);
});

test("buildCardArtifactCandidates prefers pending-rule cards for pending placement queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "待确认信息准入规则",
      fact: "待确认信息应该先进入 pending，不得默认写入 MEMORY.md 或 memory/YYYY-MM-DD.md。",
      tags: ["long-term", "memory", "rule", "policy", "pending"],
      sourcePath: "formal-memory-policy.md",
      sourceChannel: "formal-policy",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "正式记忆准入规则",
      fact: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。",
      tags: ["long-term", "memory", "rule", "workflow", "policy"],
      sourcePath: "formal-memory-policy.md",
      sourceChannel: "formal-policy",
      recommendation: { action: "review-memory-md", confidence: "high" }
    }
  ], "待确认信息应该放哪里", 6);

  assert.ok(candidates.length >= 1);
  assert.match(candidates[0].snippet, /待确认信息应该先进入 pending|不得默认写入/);
});

test("buildCardArtifactCandidates prefers project-navigation cards for roadmap queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "项目文档导航",
      fact: "项目总 roadmap 看 docs/workstreams/project/roadmap.md（原 project-roadmap.md）；memory search 专项 roadmap 看 docs/workstreams/memory-search/roadmap.md（原 memory-search-roadmap.md）。",
      tags: ["long-term", "project", "project-nav", "roadmap", "docs"],
      sourcePath: "project-roadmap.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "正式记忆准入规则",
      fact: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。",
      tags: ["long-term", "memory", "rule", "workflow", "policy"],
      sourcePath: "formal-memory-policy.md",
      sourceChannel: "formal-policy",
      recommendation: { action: "review-memory-md", confidence: "high" }
    }
  ], "项目路线图应该看哪个文档", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "project-roadmap.md");
  assert.match(candidates[0].snippet, /project-roadmap\.md|memory-search-roadmap\.md|docs\/workstreams\/project\/roadmap\.md|docs\/workstreams\/memory-search\/roadmap\.md/);
});

test("buildCardArtifactCandidates prefers lossless concept cards for lossless-understanding queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "长期记忆与 Lossless 分工",
      fact: "长期记忆负责存和找；Lossless / context engine 负责把当前这一轮最该看的内容更好地送进模型。",
      tags: ["long-term", "project", "lossless", "context", "concept"],
      sourcePath: "workspace/notes/openclaw-memory-vs-lossless.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "项目定位",
      fact: "Unified Memory Core 是共享记忆产品层，也是 OpenClaw 的 context engine adapter；它把长期记忆里的稳定事实和规则投影成当前轮可用的上下文。",
      tags: ["long-term", "project", "memory"],
      sourcePath: "README.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    }
  ], "为什么已经有长期记忆了，还需要 Lossless", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "workspace/notes/openclaw-memory-vs-lossless.md");
  assert.match(candidates[0].snippet, /长期记忆负责存和找|Lossless/);
});

test("buildProjectCardsFromMarkdown derives project navigation card from project roadmap", () => {
  const cards = buildProjectCardsFromMarkdown(
    [
      "This repo now uses three roadmap layers:",
      "",
      "- project-roadmap.md",
      "- reports/memory-search-roadmap.md",
      "",
      "master roadmap / index",
      "workstream roadmap"
    ].join("\n"),
    "project-roadmap.md"
  );

  assert.ok(cards.some((card) => card.title === "项目文档导航" && /docs\/workstreams\/project\/roadmap\.md.*project-roadmap\.md.*docs\/workstreams\/memory-search\/roadmap\.md.*memory-search-roadmap\.md/.test(card.fact)));
});

test("buildCardArtifactCandidates keeps project-positioning cards ahead of lossless concept cards for generic project queries", () => {
  const candidates = buildCardArtifactCandidates([
    {
      title: "项目定位",
      fact: "Unified Memory Core 是共享记忆产品层，也是 OpenClaw 的 context engine adapter；它把长期记忆里的稳定事实和规则投影成当前轮可用的上下文。",
      tags: ["long-term", "project", "memory"],
      sourcePath: "README.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    },
    {
      title: "长期记忆与 Lossless 分工",
      fact: "长期记忆负责存和找；Lossless / context engine 负责把当前这一轮最该看的内容更好地送进模型。",
      tags: ["long-term", "project", "lossless", "context", "concept"],
      sourcePath: "workspace/notes/openclaw-memory-vs-lossless.md",
      sourceChannel: "project-doc",
      recommendation: { action: "review-memory-md", confidence: "high" }
    }
  ], "这个项目主要解决什么问题", 6);

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "README.md");
});

test("readCardArtifactCandidates loads lossless concept cards from workspace notes", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "unified-memory-core-lossless-notes-"));
  const artifactPath = path.join(tempDir, "cards.json");
  const workspaceRoot = path.join(tempDir, "workspace");
  const pluginRoot = path.join(tempDir, "plugin");

  await fs.mkdir(path.join(workspaceRoot, "memory"), { recursive: true });
  await fs.mkdir(path.join(pluginRoot, "workspace", "notes"), { recursive: true });
  await fs.writeFile(path.join(workspaceRoot, "MEMORY.md"), "", "utf8");
  await fs.writeFile(path.join(pluginRoot, "README.md"), "# readme\n", "utf8");
  await fs.writeFile(path.join(pluginRoot, "project-roadmap.md"), "# roadmap\n", "utf8");
  await fs.writeFile(path.join(pluginRoot, "formal-memory-policy.md"), "# policy\n", "utf8");
  await fs.writeFile(path.join(pluginRoot, "configuration.md"), "# config\n", "utf8");
  await fs.writeFile(artifactPath, "[]", "utf8");
  await fs.writeFile(
    path.join(pluginRoot, "workspace", "notes", "openclaw-memory-vs-lossless.md"),
    [
      "# OpenClaw 内置长期记忆 vs Lossless 类插件",
      "",
      "## 一句话结论",
      "OpenClaw 内置长期记忆负责长期保存和检索，Lossless 更偏向上下文编排与信息保真。",
      "",
      "## 适用场景",
      "- 当需要解释为什么已经有长期记忆还会推荐 Lossless",
      "",
      "OpenClaw 内置长期记忆负责长期保存和检索。",
      "Lossless 更偏向上下文编排与信息保真。"
    ].join("\n"),
    "utf8"
  );

  const candidates = await readCardArtifactCandidates({
    query: "为什么已经有长期记忆了，还需要 Lossless",
    maxCandidates: 6,
    artifactPath,
    workspaceRoot,
    pluginRoot,
    excludePaths: [],
    logger: {}
  });

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "workspace/notes/openclaw-memory-vs-lossless.md");
  assert.match(candidates[0].snippet, /长期记忆负责存和找|Lossless/);
});

test("readCardArtifactCandidates loads config and policy cards from docs/reference after docs reorganization", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "unified-memory-core-docs-reference-"));
  const artifactPath = path.join(tempDir, "cards.json");
  const workspaceRoot = path.join(tempDir, "workspace");
  const pluginRoot = path.join(tempDir, "plugin");

  await fs.mkdir(path.join(workspaceRoot, "memory"), { recursive: true });
  await fs.mkdir(path.join(pluginRoot, "docs", "reference"), { recursive: true });
  await fs.writeFile(path.join(workspaceRoot, "MEMORY.md"), "", "utf8");
  await fs.writeFile(path.join(pluginRoot, "README.md"), "# readme\n", "utf8");
  await fs.writeFile(path.join(pluginRoot, "project-roadmap.md"), "# roadmap\n", "utf8");
  await fs.writeFile(artifactPath, "[]", "utf8");
  await fs.writeFile(
    path.join(pluginRoot, "docs", "reference", "configuration.md"),
    [
      "openclaw plugins list",
      "openclaw memory status --json",
      "memorySearch: {",
      '  provider: "local"',
      "}",
      "embeddinggemma"
    ].join("\n"),
    "utf8"
  );
  await fs.writeFile(
    path.join(pluginRoot, "docs", "reference", "formal-memory-policy.md"),
    [
      "MEMORY.md",
      "长期稳定记忆",
      "高优先级、会反复复用",
      "待确认信息必须优先进入 pending，不得默认写入 `MEMORY.md` 或 `memory/YYYY-MM-DD.md`"
    ].join("\n"),
    "utf8"
  );

  const verifyCandidates = await readCardArtifactCandidates({
    query: "安装后怎么确认插件已经生效",
    maxCandidates: 6,
    artifactPath,
    workspaceRoot,
    pluginRoot,
    excludePaths: [],
    logger: {}
  });

  assert.ok(verifyCandidates.length >= 1);
  assert.equal(verifyCandidates[0].path, "docs/reference/configuration.md");
  assert.match(verifyCandidates[0].snippet, /plugins list|memory status --json/);

  const pendingCandidates = await readCardArtifactCandidates({
    query: "待确认信息应该放哪里",
    maxCandidates: 6,
    artifactPath,
    workspaceRoot,
    pluginRoot,
    excludePaths: [],
    logger: {}
  });

  assert.ok(pendingCandidates.length >= 1);
  assert.equal(pendingCandidates[0].path, "docs/reference/formal-memory-policy.md");
  assert.match(pendingCandidates[0].snippet, /待确认信息应该先进入 pending|不得默认写入/);
});

test("readCardArtifactCandidates loads project roadmap cards from docs/workstreams after docs reorganization", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "unified-memory-core-project-roadmap-"));
  const artifactPath = path.join(tempDir, "cards.json");
  const workspaceRoot = path.join(tempDir, "workspace");
  const pluginRoot = path.join(tempDir, "plugin");

  await fs.mkdir(path.join(workspaceRoot, "memory"), { recursive: true });
  await fs.mkdir(path.join(pluginRoot, "docs", "workstreams", "project"), { recursive: true });
  await fs.writeFile(path.join(workspaceRoot, "MEMORY.md"), "", "utf8");
  await fs.writeFile(path.join(pluginRoot, "README.md"), "# readme\n", "utf8");
  await fs.writeFile(artifactPath, "[]", "utf8");
  await fs.writeFile(
    path.join(pluginRoot, "docs", "workstreams", "project", "roadmap.md"),
    [
      "# Unified Memory Core Roadmap",
      "",
      "`project-roadmap.md` is the master roadmap and document index.",
      "",
      "- docs/workstreams/memory-search/roadmap.md",
      "- workstream roadmap"
    ].join("\n"),
    "utf8"
  );

  const candidates = await readCardArtifactCandidates({
    query: "项目路线图应该看哪个文档",
    maxCandidates: 6,
    artifactPath,
    workspaceRoot,
    pluginRoot,
    excludePaths: [],
    logger: {}
  });

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "project-roadmap.md");
  assert.match(candidates[0].snippet, /project-roadmap\.md|docs\/workstreams\/project\/roadmap\.md/);
});

test("readCardArtifactCandidates skips ineligible workspace notes", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "unified-memory-core-notes-eligibility-"));
  const artifactPath = path.join(tempDir, "cards.json");
  const workspaceRoot = path.join(tempDir, "workspace");
  const pluginRoot = path.join(tempDir, "plugin");

  await fs.mkdir(path.join(workspaceRoot, "memory"), { recursive: true });
  await fs.mkdir(path.join(pluginRoot, "workspace", "notes"), { recursive: true });
  await fs.writeFile(path.join(workspaceRoot, "MEMORY.md"), "", "utf8");
  await fs.writeFile(path.join(pluginRoot, "README.md"), "# readme\n", "utf8");
  await fs.writeFile(path.join(pluginRoot, "project-roadmap.md"), "# roadmap\n", "utf8");
  await fs.writeFile(path.join(pluginRoot, "formal-memory-policy.md"), "# policy\n", "utf8");
  await fs.writeFile(path.join(pluginRoot, "configuration.md"), "# config\n", "utf8");
  await fs.writeFile(artifactPath, "[]", "utf8");
  await fs.writeFile(
    path.join(pluginRoot, "workspace", "notes", "unified-memory-core-roadmap.md"),
    [
      "# Unified Memory Core 项目 Roadmap",
      "",
      "## 一句话结论",
      "Unified Memory Core 是共享记忆产品层。",
      "",
      "## 适用场景",
      "- 看项目阶段推进",
      "",
      "## 当前已经做完的事情",
      "- 产品骨架已经完成"
    ].join("\n"),
    "utf8"
  );
  await fs.writeFile(
    path.join(pluginRoot, "workspace", "notes", "unified-memory-core-config.md"),
    [
      "# Unified Memory Core 配置说明",
      "",
      "## 一句话结论",
      "配置分成两层。",
      "",
      "## 适用场景",
      "- 当需要解释配置应该怎么写",
      "",
      "## 最小配置",
      "openclaw.json",
      "plugins.entries[\"unified-memory-core\"].config"
    ].join("\n"),
    "utf8"
  );

  const candidates = await readCardArtifactCandidates({
    query: "这个项目主要解决什么问题",
    maxCandidates: 6,
    artifactPath,
    workspaceRoot,
    pluginRoot,
    excludePaths: [],
    logger: {}
  });

  assert.ok(candidates.every((item) => !/workspace\/notes\/unified-memory-core-roadmap\.md|workspace\/notes\/unified-memory-core-config\.md/.test(item.path)));
});

test("buildCardArtifactCandidates promotes birthday and family cards for personal fact queries", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    [
      "- 用户新增家庭与生日信息：超哥生日为 1983-02-06；农历生日为腊月二十四。",
      "- 用户女儿名叫刘子妍，生日为 2014-12-29，当前上五年级。"
    ].join("\n"),
    "memory/2026-04-05.md"
  );

  const birthdayCandidates = buildCardArtifactCandidates(cards, "我生日是什么时候", 6);
  assert.ok(birthdayCandidates.length >= 1);
  assert.match(birthdayCandidates[0].snippet, /1983-02-06|腊月二十四/);

  const daughterCandidates = buildCardArtifactCandidates(cards, "我女儿叫什么，生日是哪天，现在几年级", 6);
  assert.ok(daughterCandidates.length >= 1);
  assert.match(daughterCandidates[0].snippet, /刘子妍|2014-12-29|五年级/);
});

test("buildCardArtifactCandidates keeps slot-specific family facts ahead of sibling facts", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    [
      "- 用户新增家庭与生日信息：超哥生日为 1983-02-06；农历生日为腊月二十四。",
      "- 用户女儿名叫刘子妍，生日为 2014-12-29，当前上五年级。",
      "- 用户儿子名叫刘子暄，生日为 2007-07-25，当前上高三。"
    ].join("\n"),
    "memory/2026-04-05.md"
  );

  const birthdayCandidates = buildCardArtifactCandidates(cards, "我生日是什么时候", 6);
  assert.match(birthdayCandidates[0].snippet, /1983-02-06|腊月二十四/);

  const sonCandidates = buildCardArtifactCandidates(cards, "我儿子叫什么，生日是哪天，现在几年级", 6);
  assert.match(sonCandidates[0].snippet, /刘子暄|2007-07-25|高三/);
});

test("buildCardArtifactCandidates prefers family overview cards for children overview queries", () => {
  const cards = buildStableMemoryCardsFromMarkdown(
    [
      "- 用户女儿名叫刘子妍，生日为 2014-12-29，当前上五年级。",
      "- 用户儿子名叫刘子暄，生日为 2007-07-25，当前上高三。"
    ].join("\n"),
    "memory/2026-04-05.md"
  );

  const overviewCandidates = buildCardArtifactCandidates(cards, "我家孩子的情况你记住了吗", 6);
  assert.ok(overviewCandidates.length >= 1);
  assert.match(overviewCandidates[0].snippet, /一儿一女/);
  assert.match(overviewCandidates[0].snippet, /刘子妍/);
  assert.match(overviewCandidates[0].snippet, /刘子暄/);
});

test("retrieveMemoryCandidates uses card fast path for strong fact intents", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "unified-memory-core-cards-"));
  const artifactPath = path.join(tempDir, "cards.json");

  await fs.writeFile(
    artifactPath,
    JSON.stringify(
      [
        {
          title: "饮食偏好",
          fact: "你爱吃牛排",
          tags: ["long-term", "preference"],
          sourcePath: "memory/2026-04-05-food-preference.md",
          sourceChannel: "assistant-fact",
          recommendation: { action: "review-memory-md", confidence: "medium" }
        }
      ],
      null,
      2
    )
  );

  const results = await retrieveMemoryCandidates({
    openclawCommand: "/path/that/does/not/exist",
    agentId: "main",
    query: "我爱吃什么",
    maxCandidates: 6,
    cardArtifacts: {
      enabled: true,
      path: artifactPath,
      maxCandidates: 6,
      fastPathEnabled: true,
      fastPathMinScore: 0.3
    },
    queryRewrite: { enabled: true, maxQueries: 4 },
    excludePaths: [],
    logger: {}
  });

  assert.ok(results.length >= 1);
  assert.equal(results[0].source, "cardArtifact");
  assert.match(results[0].snippet, /牛排/);
});

test("retrieveMemoryCandidates can read local OpenClaw memory sqlite without shelling out", async () => {
  const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "unified-memory-core-state-"));
  const memoryDir = path.join(stateDir, "memory");
  const dbPath = path.join(memoryDir, "main.sqlite");
  await fs.mkdir(memoryDir, { recursive: true });

  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`
      CREATE TABLE chunks (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'memory',
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        hash TEXT NOT NULL,
        model TEXT NOT NULL,
        text TEXT NOT NULL,
        embedding TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE VIRTUAL TABLE chunks_fts USING fts5(
        text,
        id UNINDEXED,
        path UNINDEXED,
        source UNINDEXED,
        model UNINDEXED,
        start_line UNINDEXED,
        end_line UNINDEXED
      );
    `);

    db.prepare(`
      INSERT INTO chunks (id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "chunk-1",
      "memory/MEMORY.md",
      "memory",
      1,
      3,
      "hash-1",
      "local",
      "The user prefers concise progress reports and compact context.",
      "[]",
      Date.now()
    );

    db.prepare(`
      INSERT INTO chunks_fts (text, id, path, source, model, start_line, end_line)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      "The user prefers concise progress reports and compact context.",
      "chunk-1",
      "memory/MEMORY.md",
      "memory",
      "local",
      1,
      3
    );
  } finally {
    db.close();
  }

  const previousStateDir = process.env.OPENCLAW_STATE_DIR;
  process.env.OPENCLAW_STATE_DIR = stateDir;
  try {
    const results = await retrieveMemoryCandidates({
      openclawCommand: "/path/that/does/not/exist",
      agentId: "main",
      query: "concise progress",
      maxCandidates: 6,
      cardArtifacts: {
        enabled: false,
        path: "",
        maxCandidates: 0,
        fastPathEnabled: false,
        fastPathMinScore: 0.3
      },
      queryRewrite: { enabled: false, maxQueries: 1 },
      excludePaths: [],
      logger: {}
    });

    assert.ok(results.length >= 1);
    assert.equal(results[0].path, "memory/MEMORY.md");
    assert.match(results[0].snippet, /concise progress reports/i);
  } finally {
    if (typeof previousStateDir === "string") {
      process.env.OPENCLAW_STATE_DIR = previousStateDir;
    } else {
      delete process.env.OPENCLAW_STATE_DIR;
    }
    await fs.rm(stateDir, { recursive: true, force: true });
  }
});

test("readCardArtifactCandidates prefers formal policy over session-derived duplicate facts", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "unified-memory-core-read-cards-"));
  const artifactPath = path.join(tempDir, "cards.json");
  const workspaceRoot = path.join(tempDir, "workspace");
  const pluginRoot = path.join(tempDir, "plugin");

  await fs.mkdir(path.join(workspaceRoot, "memory"), { recursive: true });
  await fs.mkdir(pluginRoot, { recursive: true });
  await fs.writeFile(path.join(workspaceRoot, "MEMORY.md"), "", "utf8");
  await fs.writeFile(path.join(pluginRoot, "README.md"), "# readme\n", "utf8");
  await fs.writeFile(path.join(pluginRoot, "project-roadmap.md"), "# roadmap\n", "utf8");
  await fs.writeFile(
    path.join(pluginRoot, "formal-memory-policy.md"),
    [
      "# Formal Memory Policy",
      "",
      "1. `MEMORY.md`",
      "   - 长期稳定记忆",
      "   - 高优先级、会反复复用"
    ].join("\n"),
    "utf8"
  );
  await fs.writeFile(path.join(pluginRoot, "configuration.md"), "", "utf8");
  await fs.writeFile(
    artifactPath,
    JSON.stringify([
      {
        title: "记忆机制理解",
        fact: "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。",
        tags: ["long-term", "memory", "rule"],
        sourcePath: "/Users/redcreen/.openclaw/agents/main/sessions/demo.jsonl",
        sourceChannel: "assistant-conclusion",
        recommendation: { action: "skip-memory-md-existing", confidence: "high" }
      }
    ]),
    "utf8"
  );

  const candidates = await retrieveMemoryCandidates({
    openclawCommand: "/path/that/does/not/exist",
    agentId: "main",
    query: "MEMORY.md 应该放什么内容",
    maxCandidates: 6,
    cardArtifacts: {
      enabled: true,
      path: artifactPath,
      maxCandidates: 6,
      workspaceRoot,
      fastPathEnabled: true,
      fastPathMinScore: 0.3
    },
    queryRewrite: { enabled: false, maxQueries: 1 },
    excludePaths: [],
    logger: {},
    pluginRoot
  });

  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0].path, "formal-memory-policy.md");
  assert.equal(
    candidates.filter((item) => item.snippet === "MEMORY.md 应该放的是长期稳定、会被反复复用的内容。").length,
    1
  );
});
