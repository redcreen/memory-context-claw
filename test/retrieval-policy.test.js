import test from "node:test";
import assert from "node:assert/strict";
import { classifyQueryIntent, isFactIntent, resolveRetrievalPolicy } from "../src/retrieval-policy.js";

test("classifyQueryIntent detects preference and identity intents", () => {
  const preference = classifyQueryIntent("我爱吃什么");
  const identity = classifyQueryIntent("你怎么称呼我");

  assert.equal(preference.preference, true);
  assert.equal(preference.identity, false);
  assert.equal(identity.identity, true);
  assert.equal(identity.preference, false);
});

test("resolveRetrievalPolicy chooses fast-path-first for stable fact queries", () => {
  const policy = resolveRetrievalPolicy("我爱吃什么");

  assert.equal(policy.mode, "fast-path-first");
  assert.equal(policy.rationale, "stable-fact-or-stable-rule");
  assert.deepEqual(policy.sourcePriority, ["cardArtifact", "MEMORY.md", "memory/%", "builtin-search"]);
  assert.equal(policy.llm.defaultPath, "disabled");
});

test("resolveRetrievalPolicy chooses formal-memory-first for rule queries", () => {
  const policy = resolveRetrievalPolicy("MEMORY.md 应该放什么内容");

  assert.equal(policy.mode, "formal-memory-first");
  assert.equal(policy.intents.rule, true);
  assert.equal(policy.sourcePriority[0], "cardArtifact");
  assert.equal(policy.sourcePriority[1], "formal-memory-policy.md");
});

test("resolveRetrievalPolicy chooses formal-memory-first for workspace/project structure queries", () => {
  const policy = resolveRetrievalPolicy("这个项目的内置 workspace 目录应该怎么组织");

  assert.equal(policy.mode, "formal-memory-first");
  assert.equal(policy.intents.project, true);
  assert.equal(policy.intents.workspaceStructure, true);
});

test("resolveRetrievalPolicy detects workspace-structure intent for long-memory directory questions", () => {
  const policy = resolveRetrievalPolicy("长期记忆目录规则是什么");

  assert.equal(policy.mode, "formal-memory-first");
  assert.equal(policy.intents.workspaceStructure, true);
});

test("resolveRetrievalPolicy treats release-install questions as formal-memory-first", () => {
  const policy = resolveRetrievalPolicy("普通用户应该安装稳定版还是 main");

  assert.equal(policy.mode, "formal-memory-first");
  assert.equal(policy.intents.releaseInstall, true);
  assert.equal(policy.sourcePriority[0], "cardArtifact");
});

test("resolveRetrievalPolicy treats install verification questions as formal-memory-first", () => {
  const policy = resolveRetrievalPolicy("安装后怎么确认插件已经生效");

  assert.equal(policy.mode, "formal-memory-first");
  assert.equal(policy.intents.installVerify, true);
  assert.equal(policy.sourcePriority[0], "cardArtifact");
});

test("resolveRetrievalPolicy treats project document navigation questions as formal-memory-first", () => {
  const policy = resolveRetrievalPolicy("项目路线图应该看哪个文档");

  assert.equal(policy.mode, "formal-memory-first");
  assert.equal(policy.intents.projectNavigation, true);
  assert.equal(policy.sourcePriority[0], "cardArtifact");
});

test("resolveRetrievalPolicy treats lossless-understanding questions as formal-memory-first", () => {
  const policy = resolveRetrievalPolicy("为什么已经有长期记忆了，还需要 Lossless");

  assert.equal(policy.mode, "formal-memory-first");
  assert.equal(policy.intents.lossless, true);
  assert.equal(policy.sourcePriority[0], "cardArtifact");
});

test("resolveRetrievalPolicy treats workspace-notes admissibility questions as formal-memory-first", () => {
  const policy = resolveRetrievalPolicy("workspace/notes 里的笔记什么时候能进入 stable card");

  assert.equal(policy.mode, "formal-memory-first");
  assert.equal(policy.intents.workspaceNotesRule, true);
  assert.equal(policy.sourcePriority[0], "cardArtifact");
});

test("resolveRetrievalPolicy treats pending-placement questions as formal-memory-first", () => {
  const policy = resolveRetrievalPolicy("待确认信息应该放哪里");

  assert.equal(policy.mode, "formal-memory-first");
  assert.equal(policy.intents.pendingRule, true);
  assert.equal(policy.sourcePriority[0], "cardArtifact");
});

test("resolveRetrievalPolicy chooses mixed-mode for birthday/background queries", () => {
  const policy = resolveRetrievalPolicy("我女儿叫什么，生日是哪天，现在几年级");

  assert.equal(policy.mode, "mixed-mode");
  assert.equal(policy.rationale, "stable-facts-plus-supporting-history");
  assert.equal(policy.intents.birthday, true);
});

test("resolveRetrievalPolicy keeps search-first for unclassified queries", () => {
  const policy = resolveRetrievalPolicy("把今天下午那次讨论过程重新概括一下");

  assert.equal(policy.mode, "search-first");
  assert.equal(policy.rationale, "unclassified-query");
  assert.equal(isFactIntent("把今天下午那次讨论过程重新概括一下"), false);
});

test("resolveRetrievalPolicy only allows single optional llm fallback when enabled", () => {
  const disabledPolicy = resolveRetrievalPolicy("我爱吃什么");
  const enabledPolicy = resolveRetrievalPolicy("我爱吃什么", { llmIntentFallbackEnabled: true });

  assert.equal(disabledPolicy.llm.allowed, "none");
  assert.equal(enabledPolicy.llm.allowed, "single-optional-fallback");
  assert.equal(enabledPolicy.llm.fallbackEnabled, true);
});
