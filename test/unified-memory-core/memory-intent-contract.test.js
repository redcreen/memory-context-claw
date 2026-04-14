import test from "node:test";
import assert from "node:assert/strict";

import {
  determineMemoryIntentAdmission,
  parseMemoryIntentExtraction,
  renderMemoryIntentText
} from "../../src/unified-memory-core/memory-intent-contract.js";

test("memory intent contract parses durable tool routing preferences deterministically", () => {
  const parsed = parseMemoryIntentExtraction({
    should_write_memory: true,
    category: "tool_routing_preference",
    durability: "durable",
    confidence: 0.98,
    summary: "User wants Xiaohongshu links handled with capture_xiaohongshu_note in future conversations.",
    user_message: "以后你收到小红书的链接，就使用 capture_xiaohongshu_note 工具来处理；记住了！",
    user_visible_reply: "记住了。以后收到小红书链接时，我会优先使用 capture_xiaohongshu_note 来处理。",
    structured_rule: {
      trigger: {
        content_kind: "xiaohongshu_link",
        domains: ["xhslink.com", "xiaohongshu.com"]
      },
      action: {
        tool: "capture_xiaohongshu_note"
      }
    }
  });

  assert.equal(parsed.admission_route, "candidate_rule");
  assert.equal(parsed.assistant_reply, "记住了。以后收到小红书链接时，我会优先使用 capture_xiaohongshu_note 来处理。");
  assert.equal(parsed.structured_rule.action.tool, "capture_xiaohongshu_note");
  assert.deepEqual(parsed.structured_rule.trigger.domains, ["xhslink.com", "xiaohongshu.com"]);
  assert.match(renderMemoryIntentText(parsed), /memory intent category: tool_routing_preference/);
});

test("memory intent admission keeps session constraints and task instructions out of durable candidate routing", () => {
  assert.equal(
    determineMemoryIntentAdmission({
      should_write_memory: true,
      category: "session_constraint",
      durability: "session",
      confidence: 0.92
    }),
    "observation_session"
  );
  assert.equal(
    determineMemoryIntentAdmission({
      should_write_memory: true,
      category: "task_instruction",
      durability: "durable",
      confidence: 0.91
    }),
    "observation_task_instruction"
  );
  assert.equal(
    determineMemoryIntentAdmission({
      should_write_memory: false,
      category: "durable_rule",
      durability: "durable",
      confidence: 0.99
    }),
    "skip"
  );
});
