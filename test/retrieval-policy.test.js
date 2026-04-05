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
