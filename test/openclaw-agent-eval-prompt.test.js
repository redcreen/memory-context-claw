import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAgentEvalPrompt,
  isMemoryScopedPrompt
} from "../src/openclaw-agent-eval-prompt.js";

test("isMemoryScopedPrompt detects existing English memory-only wrappers", () => {
  assert.equal(
    isMemoryScopedPrompt(
      "Based only on your memory for this agent, what is the user's preferred name?"
    ),
    true
  );
});

test("isMemoryScopedPrompt detects existing Chinese memory-only wrappers", () => {
  assert.equal(
    isMemoryScopedPrompt("仅根据你当前这个 agent 的记忆，用户现在主要用什么编辑器？"),
    true
  );
});

test("buildAgentEvalPrompt avoids duplicating the tool hint for memory-scoped prompts", () => {
  const prompt = buildAgentEvalPrompt(
    "Based only on your memory for this agent, what is the current deploy region now?"
  );

  assert.equal(
    prompt,
    "Based only on your memory for this agent, what is the current deploy region now?"
  );
});

test("buildAgentEvalPrompt prepends the tool hint for generic prompts", () => {
  const prompt = buildAgentEvalPrompt("What is Project Lantern?");

  assert.match(prompt, /^Use the memory_search tool first if needed before answering\./);
  assert.match(prompt, /What is Project Lantern\?/);
});
