import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSmokePromotionSuggestions,
  compareGovernanceCoverage,
  isSmokePromotionEligible,
  looksLikeNaturalSmokeQuery
} from "../src/smoke-promotion.js";

test("looksLikeNaturalSmokeQuery prefers natural questions over keyword bags", () => {
  assert.equal(looksLikeNaturalSmokeQuery("我爱吃什么"), true);
  assert.equal(looksLikeNaturalSmokeQuery("项目路线图应该看哪个文档"), true);
  assert.equal(looksLikeNaturalSmokeQuery("牛排 刘超"), false);
  assert.equal(looksLikeNaturalSmokeQuery("用户爱吃什么 饮食 喜欢吃 刘超 超哥"), false);
});

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
  assert.equal(result.recommendedForSmoke, 0);
  assert.equal(result.reviewRequired, 1);
  assert.equal(result.pending, 1);

  const shortChinese = result.suggestions.find((item) => item.id === "short-chinese-token");
  assert.equal(shortChinese?.eligible, true);
  assert.equal(shortChinese?.alreadyInSmoke, false);
  assert.equal(shortChinese?.naturalQueryLikely, false);
  assert.equal(shortChinese?.recommendedForSmoke, false);
  assert.equal(shortChinese?.reason, "synthetic-query-review");
});

test("compareGovernanceCoverage reports stale governance results when case catalog changed", () => {
  const stale = compareGovernanceCoverage(
    [
      { id: "food-preference-recall", query: "我爱吃什么" },
      { id: "identity-name-recall", query: "你怎么称呼我" }
    ],
    [
      { id: "food-preference-recall", query: "我爱吃什么" },
      { id: "identity-name-recall", query: "你怎么称呼我" },
      { id: "timezone-priority", query: "我的时区是什么" }
    ]
  );

  assert.equal(stale.stale, true);
  assert.equal(stale.reportCaseCount, 2);
  assert.equal(stale.currentCaseCount, 3);
  assert.deepEqual(stale.missingFromReport, ["timezone-priority"]);
  assert.deepEqual(stale.extraInReport, []);

  const fresh = compareGovernanceCoverage(
    [
      { id: "food-preference-recall", query: "我爱吃什么" },
      { id: "identity-name-recall", query: "你怎么称呼我" }
    ],
    [
      { id: "food-preference-recall", query: "我爱吃什么" },
      { id: "identity-name-recall", query: "你怎么称呼我" }
    ]
  );

  assert.equal(fresh.stale, false);
  assert.equal(fresh.reportCaseCount, 2);
  assert.equal(fresh.currentCaseCount, 2);
  assert.deepEqual(fresh.missingFromReport, []);
  assert.deepEqual(fresh.extraInReport, []);
});
