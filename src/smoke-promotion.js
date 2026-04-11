function normalizeQuery(value = "") {
  return String(value || "").trim().toLowerCase();
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

    suggestions.push({
      id: item?.id || "",
      query,
      alreadyInSmoke,
      eligible,
      reason: alreadyInSmoke
        ? "already-in-smoke"
        : eligible
          ? "stable-single-card"
          : "not-stable-enough"
    });
  }

  return {
    total: suggestions.length,
    alreadyInSmoke: suggestions.filter((item) => item.alreadyInSmoke).length,
    eligibleNewSuggestions: suggestions.filter((item) => item.eligible && !item.alreadyInSmoke).length,
    pending: suggestions.filter((item) => !item.eligible && !item.alreadyInSmoke).length,
    suggestions
  };
}
