function normalizeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function average(values = []) {
  const numbers = values
    .map((value) => normalizeNumber(value, NaN))
    .filter((value) => Number.isFinite(value));
  if (numbers.length === 0) {
    return 0;
  }
  return Number((numbers.reduce((sum, value) => sum + value, 0) / numbers.length).toFixed(4));
}

export function buildContextOptimizationScorecard({
  projectionTurns = [],
  snapshot = {},
  assemblyMetrics = {},
  guarded = {}
} = {}) {
  const applied = snapshot?.applied || {};
  const baselinePromptEstimate = normalizeNumber(snapshot?.baselinePromptEstimate);
  const shadowRawPromptEstimate = normalizeNumber(snapshot?.shadowRawPromptEstimate);
  const shadowPackageEstimate = normalizeNumber(snapshot?.shadowPackageEstimate);
  const baselineTurnCount = Array.isArray(projectionTurns) ? projectionTurns.length : 0;
  const keptTurnCount = Array.isArray(applied?.keepTurnIds) ? applied.keepTurnIds.length : 0;
  const evictedTurnCount = Array.isArray(applied?.appliedEvictTurnIds) ? applied.appliedEvictTurnIds.length : 0;
  const pinCount = Array.isArray(applied?.pinTurnIds) ? applied.pinTurnIds.length : 0;
  const packageReductionRatio = baselinePromptEstimate > 0
    ? Number(((baselinePromptEstimate - shadowPackageEstimate) / baselinePromptEstimate).toFixed(4))
    : 0;

  return {
    relation: String(applied?.relation || ""),
    baselineTurnCount,
    keptTurnCount,
    evictedTurnCount,
    pinCount,
    baselinePromptEstimate,
    shadowRawPromptEstimate,
    shadowPackageEstimate,
    rawReductionRatio: Number(normalizeNumber(applied?.reductionRatio).toFixed(4)),
    packageReductionRatio,
    candidateLoadElapsedMs: normalizeNumber(assemblyMetrics?.candidateLoadElapsedMs),
    assemblyBuildElapsedMs: normalizeNumber(assemblyMetrics?.assemblyBuildElapsedMs),
    decisionElapsedMs: normalizeNumber(assemblyMetrics?.decisionElapsedMs),
    totalElapsedMs: normalizeNumber(assemblyMetrics?.totalElapsedMs),
    guardedEnabled: guarded?.enabled === true,
    guardedApplied: guarded?.applied === true,
    guardedReason: String(guarded?.reason || ""),
    guardedMessageCount: normalizeNumber(guarded?.filteredMessageCount),
    guardedCarryForwardEstimate: normalizeNumber(guarded?.carryForwardEstimate),
    guardedFilteredMessageEstimate: normalizeNumber(guarded?.filteredMessageTokenEstimate)
  };
}

export function summarizeContextOptimizationEvents(events = []) {
  const normalizedEvents = Array.isArray(events) ? events : [];
  const captured = normalizedEvents.filter((event) => event?.status === "captured");
  const guardedApplied = captured.filter((event) => event?.guarded?.applied === true);
  const relationCounts = {};

  for (const event of captured) {
    const relation = String(event?.scorecard?.relation || event?.decision?.relation || "");
    if (!relation) {
      continue;
    }
    relationCounts[relation] = (relationCounts[relation] || 0) + 1;
  }

  return {
    total: normalizedEvents.length,
    captured: captured.length,
    skipped: normalizedEvents.filter((event) => event?.status === "skipped").length,
    errors: normalizedEvents.filter((event) => event?.status === "error").length,
    guardedApplied: guardedApplied.length,
    averageRawReductionRatio: average(captured.map((event) => event?.scorecard?.rawReductionRatio)),
    averagePackageReductionRatio: average(captured.map((event) => event?.scorecard?.packageReductionRatio)),
    averageCandidateLoadElapsedMs: average(captured.map((event) => event?.scorecard?.candidateLoadElapsedMs)),
    averageAssemblyBuildElapsedMs: average(captured.map((event) => event?.scorecard?.assemblyBuildElapsedMs)),
    averageDecisionElapsedMs: average(captured.map((event) => event?.scorecard?.decisionElapsedMs)),
    averageGuardedCarryForwardEstimate: average(guardedApplied.map((event) => event?.scorecard?.guardedCarryForwardEstimate)),
    relationCounts
  };
}
