function normalizeQuery(value = "") {
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

    suggestions.push({
      id: item?.id || "",
      query,
      alreadyInSmoke,
      eligible,
      naturalQueryLikely,
      recommendedForSmoke,
      reason: alreadyInSmoke
        ? "already-in-smoke"
        : recommendedForSmoke
          ? "stable-single-card"
          : eligible
            ? "synthetic-query-review"
          : "not-stable-enough"
    });
  }

  return {
    total: suggestions.length,
    alreadyInSmoke: suggestions.filter((item) => item.alreadyInSmoke).length,
    eligibleNewSuggestions: suggestions.filter((item) => item.eligible && !item.alreadyInSmoke).length,
    recommendedForSmoke: suggestions.filter((item) => item.recommendedForSmoke).length,
    pending: suggestions.filter((item) => !item.eligible && !item.alreadyInSmoke).length,
    reviewRequired: suggestions.filter((item) => item.eligible && !item.alreadyInSmoke && !item.recommendedForSmoke).length,
    suggestions
  };
}
