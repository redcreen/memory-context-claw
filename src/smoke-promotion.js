function normalizeQuery(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizeCaseId(value = "") {
  return String(value || "").trim().toLowerCase();
}

export function looksLikeNaturalSmokeQuery(query = "") {
  const text = String(query || "").trim();
  if (!text) {
    return false;
  }
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length >= 3 && !/[?？]$/.test(text)) {
    return false;
  }
  if (/[?？]$/.test(text)) {
    return true;
  }
  return /什么|怎么|如何|哪个|哪些|为什么|是否|是不是|几|谁|哪里|放哪里|看哪个文档|负责什么|做什么/.test(text);
}

export function isSmokePromotionEligible(result = {}) {
  const plugin = result?.plugin || {};
  const quality = plugin?.selectionQuality || {};
  return (
    plugin.expectedSignalsHit === true &&
    plugin.expectedSourceHit === true &&
    plugin.fastPathLikely === true &&
    quality.singleCard === true &&
    quality.noisySupporting === false
  );
}

export function compareGovernanceCoverage(governanceResults = [], governanceCases = []) {
  const reportIds = new Set(
    (Array.isArray(governanceResults) ? governanceResults : [])
      .map((item) => normalizeCaseId(item?.id || item?.query))
      .filter(Boolean)
  );
  const currentIds = new Set(
    (Array.isArray(governanceCases) ? governanceCases : [])
      .map((item) => normalizeCaseId(item?.id || item?.query))
      .filter(Boolean)
  );

  const missingFromReport = [...currentIds].filter((id) => !reportIds.has(id));
  const extraInReport = [...reportIds].filter((id) => !currentIds.has(id));

  return {
    stale: missingFromReport.length > 0 || extraInReport.length > 0,
    reportCaseCount: reportIds.size,
    currentCaseCount: currentIds.size,
    missingFromReport,
    extraInReport
  };
}

function classifyPromotionBucket({ alreadyInSmoke, eligible, naturalQueryLikely, recommendedForSmoke }) {
  if (alreadyInSmoke) {
    return {
      promotionBucket: "already-in-smoke",
      reason: "already-in-smoke"
    };
  }
  if (recommendedForSmoke) {
    return {
      promotionBucket: "recommended-natural",
      reason: "stable-single-card"
    };
  }
  if (eligible) {
    return {
      promotionBucket: "synthetic-review",
      reason: "synthetic-query-review"
    };
  }
  if (naturalQueryLikely) {
    return {
      promotionBucket: "natural-pending",
      reason: "natural-query-not-stable-enough"
    };
  }
  return {
    promotionBucket: "synthetic-pending",
    reason: "synthetic-query-not-promotable"
  };
}

export function buildSmokePromotionSuggestions(memorySearchResults = [], smokeCases = []) {
  const existingSmokeQueries = new Set(
    (Array.isArray(smokeCases) ? smokeCases : []).map((item) => normalizeQuery(item?.query))
  );

  const items = Array.isArray(memorySearchResults) ? memorySearchResults : [];
  const suggestions = [];

  for (const item of items) {
    const query = String(item?.query || "");
    const normalized = normalizeQuery(query);
    const alreadyInSmoke = existingSmokeQueries.has(normalized);
    const eligible = isSmokePromotionEligible(item);
    const naturalQueryLikely = looksLikeNaturalSmokeQuery(query);
    const recommendedForSmoke = eligible && !alreadyInSmoke && naturalQueryLikely;
    const { promotionBucket, reason } = classifyPromotionBucket({
      alreadyInSmoke,
      eligible,
      naturalQueryLikely,
      recommendedForSmoke
    });

    suggestions.push({
      id: item?.id || "",
      query,
      alreadyInSmoke,
      eligible,
      naturalQueryLikely,
      recommendedForSmoke,
      promotionBucket,
      reason
    });
  }

  const syntheticReviewRequired = suggestions.filter((item) => item.promotionBucket === "synthetic-review").length;
  const naturalPending = suggestions.filter((item) => item.promotionBucket === "natural-pending").length;
  const syntheticPending = suggestions.filter((item) => item.promotionBucket === "synthetic-pending").length;

  return {
    total: suggestions.length,
    alreadyInSmoke: suggestions.filter((item) => item.alreadyInSmoke).length,
    eligibleNewSuggestions: suggestions.filter((item) => item.eligible && !item.alreadyInSmoke).length,
    recommendedForSmoke: suggestions.filter((item) => item.recommendedForSmoke).length,
    pending: naturalPending + syntheticPending,
    reviewRequired: syntheticReviewRequired,
    syntheticReviewRequired,
    naturalPending,
    syntheticPending,
    suggestions
  };
}
