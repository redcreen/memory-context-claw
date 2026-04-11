import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSmokePromotionSuggestions,
  isSmokePromotionEligible
} from "../src/smoke-promotion.js";

test("isSmokePromotionEligible only accepts stable single-card results", () => {
  assert.equal(
    isSmokePromotionEligible({
      plugin: {
        expectedSignalsHit: true,
        expectedSourceHit: true,
        fastPathLikely: true,
        selectionQuality: {
          singleCard: true,
          noisySupporting: false
        }
      }
    }),
    true
  );

  assert.equal(
    isSmokePromotionEligible({
      plugin: {
        expectedSignalsHit: true,
        expectedSourceHit: true,
        fastPathLikely: true,
        selectionQuality: {
          singleCard: false,
          noisySupporting: false
        }
      }
    }),
    false
  );
});

test("buildSmokePromotionSuggestions separates existing smoke cases and new eligible candidates", () => {
  const result = buildSmokePromotionSuggestions(
    [
      {
        id: "food-preference-recall",
        query: "我爱吃什么",
        plugin: {
          expectedSignalsHit: true,
          expectedSourceHit: true,
          fastPathLikely: true,
          selectionQuality: {
            singleCard: true,
            noisySupporting: false
          }
        }
      },
      {
        id: "short-chinese-token",
        query: "牛排 刘超",
        plugin: {
          expectedSignalsHit: true,
          expectedSourceHit: true,
          fastPathLikely: true,
          selectionQuality: {
            singleCard: true,
            noisySupporting: false
          }
        }
      },
      {
        id: "future-case",
        query: "未来某个候选问题",
        plugin: {
          expectedSignalsHit: true,
          expectedSourceHit: false,
          fastPathLikely: true,
          selectionQuality: {
            singleCard: true,
            noisySupporting: false
          }
        }
      }
    ],
    [
      {
        name: "food-preference",
        query: "我爱吃什么"
      }
    ]
  );

  assert.equal(result.total, 3);
  assert.equal(result.alreadyInSmoke, 1);
  assert.equal(result.eligibleNewSuggestions, 1);
  assert.equal(result.pending, 1);

  const shortChinese = result.suggestions.find((item) => item.id === "short-chinese-token");
  assert.equal(shortChinese?.eligible, true);
  assert.equal(shortChinese?.alreadyInSmoke, false);
  assert.equal(shortChinese?.reason, "stable-single-card");
});
