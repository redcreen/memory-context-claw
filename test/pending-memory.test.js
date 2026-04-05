import test from "node:test";
import assert from "node:assert/strict";

import {
  renderPendingDailyReviewBlock,
  selectPendingDailyCandidates
} from "../src/conversation-memory.js";

test("selectPendingDailyCandidates keeps review-only daily items out of formal promotion", () => {
  const pending = selectPendingDailyCandidates({
    daily: [
      {
        text: "身份证生日信息待确认，这条信息暂不作为已确认身份信息使用",
        kind: "daily",
        sourceChannel: "memory-daily",
        recommendation: { action: "review-daily-memory" }
      },
      {
        text: "先把 OpenClaw 内置长期记忆和检索跑通",
        kind: "daily",
        sourceChannel: "assistant-summary",
        recommendation: { action: "promote-daily-memory" }
      }
    ]
  });

  assert.equal(pending.length, 1);
  assert.match(pending[0].text, /待确认/);
});

test("renderPendingDailyReviewBlock writes pending items into a non-formal review document", () => {
  const rendered = renderPendingDailyReviewBlock(
    [
      {
        text: "身份证生日信息待确认，这条信息暂不作为已确认身份信息使用",
        kind: "daily",
        sourceChannel: "memory-daily",
        recommendation: {
          action: "review-daily-memory",
          reasons: ["主题未对齐，禁止自动升级", "需用户确认"]
        }
      }
    ],
    { date: "2026-04-05" }
  );

  assert.match(rendered, /待确认记忆候选/);
  assert.match(rendered, /尚未进入正式记忆层/);
  assert.match(rendered, /身份证生日信息待确认/);
  assert.match(rendered, /需用户确认/);
});
