import {
  estimateMessageTokens,
  estimateTokenCountFromText,
  normalizeWhitespace
} from "./utils.js";

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function normalizeStringArray(values = []) {
  return Array.isArray(values)
    ? [...new Set(values.map((value) => normalizeString(value)).filter(Boolean))]
    : [];
}

function normalizeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function compactText(value, maxChars = 0) {
  const normalized = normalizeWhitespace(value);
  const limit = Math.max(0, Math.trunc(Number(maxChars || 0)));
  if (!normalized || limit <= 0 || normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

function sumMessageTokens(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .reduce((sum, message) => sum + estimateMessageTokens(message), 0);
}

export function mergeSystemPromptAdditions(...parts) {
  return parts
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean)
    .join("\n\n");
}

export function buildGuardedCarryForwardText({
  snapshot = {}
} = {}) {
  const semanticPins = Array.isArray(snapshot?.semanticPinNotes)
    ? snapshot.semanticPinNotes.map((item) => compactText(item, 120)).filter(Boolean)
    : [];
  const archiveSummary = compactText(snapshot?.injectedArchiveSummary || "", 140);
  const sections = [];

  if (semanticPins.length > 0) {
    sections.push([
      "Conversation carry-forward pins:",
      ...semanticPins.map((item) => `- ${item}`)
    ].join("\n"));
  }

  if (archiveSummary) {
    sections.push([
      "Archived topic summary:",
      archiveSummary
    ].join("\n"));
  }

  return sections.join("\n\n");
}

export function shouldActivateGuardedWorkingSet({
  snapshot = {},
  config = {}
} = {}) {
  if (config?.enabled !== true) {
    return { allowed: false, reason: "feature_disabled" };
  }

  const applied = snapshot?.applied || {};
  const relation = normalizeString(applied?.relation, "continue");
  const allowedRelations = normalizeStringArray(config?.allowedRelations || ["switch", "resolve"]);
  const reductionRatio = normalizeNumber(applied?.reductionRatio);
  const minReductionRatio = normalizeNumber(config?.minReductionRatio, 0.18);
  const evictedTurnIds = normalizeStringArray(applied?.appliedEvictTurnIds);
  const pinnedOnlyTurnIds = normalizeStringArray(applied?.pinnedOnlyTurnIds);
  const minEvictedTurns = Math.max(1, Math.trunc(normalizeNumber(config?.minEvictedTurns, 1)));

  if (!allowedRelations.includes(relation)) {
    return { allowed: false, reason: "relation_not_allowed" };
  }
  if (relation === "continue" && pinnedOnlyTurnIds.length > 0) {
    return { allowed: false, reason: "continue_pin_only_not_allowed" };
  }
  if (evictedTurnIds.length < minEvictedTurns) {
    return { allowed: false, reason: "not_enough_evictions" };
  }
  if (reductionRatio < minReductionRatio) {
    return { allowed: false, reason: "reduction_below_min" };
  }

  return {
    allowed: true,
    reason: "guarded_candidate",
    relation,
    reductionRatio,
    evictedTurnIds
  };
}

export function applyGuardedWorkingSetToMessages({
  messages = [],
  projection = [],
  snapshot = {},
  config = {}
} = {}) {
  const activation = shouldActivateGuardedWorkingSet({ snapshot, config });
  if (!activation.allowed) {
    return {
      enabled: config?.enabled === true,
      applied: false,
      reason: activation.reason,
      filteredMessages: Array.isArray(messages) ? messages : [],
      filteredMessageCount: Array.isArray(messages) ? messages.length : 0,
      filteredMessageTokenEstimate: sumMessageTokens(messages),
      carryForwardText: "",
      carryForwardEstimate: 0,
      evictedSourceIndices: []
    };
  }

  const projectionItems = Array.isArray(projection) ? projection : [];
  const evictedTurnIdSet = new Set(normalizeStringArray(snapshot?.applied?.appliedEvictTurnIds));
  const keepTurnIdSet = new Set(normalizeStringArray(snapshot?.applied?.keepTurnIds));
  const evictedSourceIndices = projectionItems
    .filter((turn) => evictedTurnIdSet.has(turn.id))
    .map((turn) => turn.sourceIndex)
    .filter((value) => Number.isInteger(value));
  const keptSourceIndices = projectionItems
    .filter((turn) => keepTurnIdSet.has(turn.id))
    .map((turn) => turn.sourceIndex)
    .filter((value) => Number.isInteger(value));

  if (evictedSourceIndices.length === 0) {
    return {
      enabled: true,
      applied: false,
      reason: "no_projected_evictions",
      filteredMessages: Array.isArray(messages) ? messages : [],
      filteredMessageCount: Array.isArray(messages) ? messages.length : 0,
      filteredMessageTokenEstimate: sumMessageTokens(messages),
      carryForwardText: "",
      carryForwardEstimate: 0,
      evictedSourceIndices: []
    };
  }

  const evictedSourceIndexSet = new Set(evictedSourceIndices);
  const relation = normalizeString(snapshot?.applied?.relation, activation.relation);
  let lowerBoundIndex = 0;
  if (["switch", "resolve"].includes(relation) && keptSourceIndices.length > 0) {
    lowerBoundIndex = Math.max(0, Math.min(...keptSourceIndices));
  }
  const filteredMessages = (Array.isArray(messages) ? messages : [])
    .filter((_, index) => index >= lowerBoundIndex && !evictedSourceIndexSet.has(index));
  const carryForwardText = config?.prependCarryForward === false
    ? ""
    : buildGuardedCarryForwardText({ snapshot });
  const filteredMessageTokenEstimate = sumMessageTokens(filteredMessages);
  const carryForwardEstimate = estimateTokenCountFromText(carryForwardText);
  const baselinePromptEstimate = normalizeNumber(snapshot?.baselinePromptEstimate);
  const shadowRawPromptEstimate = normalizeNumber(snapshot?.shadowRawPromptEstimate, filteredMessageTokenEstimate);
  const guardedTotalEstimate = shadowRawPromptEstimate + carryForwardEstimate;

  if (baselinePromptEstimate > 0 && guardedTotalEstimate >= baselinePromptEstimate) {
    return {
      enabled: true,
      applied: false,
      reason: "no_net_token_gain",
      filteredMessages: Array.isArray(messages) ? messages : [],
      filteredMessageCount: Array.isArray(messages) ? messages.length : 0,
      filteredMessageTokenEstimate: sumMessageTokens(messages),
      carryForwardText: "",
      carryForwardEstimate: 0,
      evictedSourceIndices: []
    };
  }

  return {
    enabled: true,
    applied: true,
    reason: activation.reason,
    filteredMessages,
    filteredMessageCount: filteredMessages.length,
    filteredMessageTokenEstimate,
    carryForwardText,
    carryForwardEstimate,
    evictedSourceIndices: [...evictedSourceIndexSet].sort((left, right) => left - right)
  };
}
