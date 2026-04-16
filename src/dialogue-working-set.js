import { estimateTokenCountFromText } from "./utils.js";

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function normalizeIdList(values) {
  return Array.isArray(values)
    ? [...new Set(values.map((item) => normalizeString(item)).filter(Boolean))]
    : [];
}

export function normalizeDialogueTurns(turns = []) {
  return (Array.isArray(turns) ? turns : []).map((turn, index) => {
    const id = normalizeString(turn?.id, `t${index + 1}`);
    const role = normalizeString(turn?.role, "assistant");
    const content = normalizeString(turn?.content);

    return {
      id,
      role,
      content,
      tokenEstimate: estimateTokenCountFromText(content)
    };
  });
}

export function resolveLatestUserTurnId(turns = []) {
  const normalizedTurns = normalizeDialogueTurns(turns);
  for (let index = normalizedTurns.length - 1; index >= 0; index -= 1) {
    if (normalizedTurns[index].role === "user") {
      return normalizedTurns[index].id;
    }
  }
  return normalizedTurns.at(-1)?.id || "";
}

export function applySoftEvictionPlan({
  turns = [],
  decision = {}
} = {}) {
  const normalizedTurns = normalizeDialogueTurns(turns);
  const latestUserTurnId = resolveLatestUserTurnId(normalizedTurns);
  const validTurnIds = new Set(normalizedTurns.map((turn) => turn.id));
  const requestedEvictions = normalizeIdList(decision?.evict_turn_ids);
  const pinTurnIds = normalizeIdList(decision?.pin_turn_ids)
    .filter((id) => validTurnIds.has(id));

  const blockedEvictions = [];
  const appliedEvictionSet = new Set();

  for (const id of requestedEvictions) {
    if (!validTurnIds.has(id)) {
      continue;
    }
    if (id === latestUserTurnId) {
      blockedEvictions.push(id);
      continue;
    }
    appliedEvictionSet.add(id);
  }

  const keepTurns = normalizedTurns.filter((turn) => !appliedEvictionSet.has(turn.id));
  const evictedTurns = normalizedTurns.filter((turn) => appliedEvictionSet.has(turn.id));
  const pinnedOnlyTurnIds = pinTurnIds.filter((id) => appliedEvictionSet.has(id));
  const baselineTokens = normalizedTurns.reduce((sum, turn) => sum + turn.tokenEstimate, 0);
  const keptTokens = keepTurns.reduce((sum, turn) => sum + turn.tokenEstimate, 0);
  const prunedTokens = Math.max(0, baselineTokens - keptTokens);
  const reductionRatio = baselineTokens > 0 ? prunedTokens / baselineTokens : 0;

  return {
    relation: normalizeString(decision?.relation, "continue"),
    confidence: Number(decision?.confidence || 0),
    archiveSummary: normalizeString(decision?.archive_summary),
    reasoningSummary: normalizeString(decision?.reasoning_summary),
    latestUserTurnId,
    pinTurnIds,
    pinnedOnlyTurnIds,
    requestedEvictTurnIds: requestedEvictions.filter((id) => validTurnIds.has(id)),
    blockedEvictTurnIds: blockedEvictions,
    appliedEvictTurnIds: [...appliedEvictionSet],
    keepTurnIds: keepTurns.map((turn) => turn.id),
    baselineTokens,
    keptTokens,
    prunedTokens,
    reductionRatio,
    keepTurns,
    evictedTurns
  };
}

function subsetCheck(name, expectedList, actualList) {
  const expected = normalizeIdList(expectedList);
  const actual = new Set(normalizeIdList(actualList));
  return {
    name,
    passed: expected.every((item) => actual.has(item)),
    expected,
    actual: [...actual]
  };
}

export function evaluateWorkingSetDecision(caseDef, decision, options = {}) {
  const applied = applySoftEvictionPlan({
    turns: caseDef?.transcript || [],
    decision,
    ...options
  });
  const expected = caseDef?.expected || {};
  const checks = [
    {
      name: "relation",
      passed: normalizeString(applied.relation) === normalizeString(expected.relation),
      expected: normalizeString(expected.relation),
      actual: normalizeString(applied.relation)
    },
    subsetCheck("must_evict_turn_ids", expected.must_evict_turn_ids, applied.appliedEvictTurnIds),
    {
      name: "must_keep_turn_ids",
      passed: normalizeIdList(expected.must_keep_turn_ids)
        .every((id) => !applied.appliedEvictTurnIds.includes(id)),
      expected: normalizeIdList(expected.must_keep_turn_ids),
      actual: applied.keepTurnIds
    },
    subsetCheck("must_pin_turn_ids", expected.must_pin_turn_ids, applied.pinTurnIds),
    {
      name: "latest_user_turn_guarded",
      passed: Boolean(applied.latestUserTurnId) && !applied.appliedEvictTurnIds.includes(applied.latestUserTurnId),
      expected: applied.latestUserTurnId,
      actual: applied.appliedEvictTurnIds
    },
    {
      name: "min_reduction_ratio",
      passed: Number(applied.reductionRatio) >= Number(expected.min_reduction_ratio || 0),
      expected: Number(expected.min_reduction_ratio || 0),
      actual: Number(applied.reductionRatio.toFixed(4))
    }
  ];

  return {
    passed: checks.every((check) => check.passed),
    checks,
    applied
  };
}
