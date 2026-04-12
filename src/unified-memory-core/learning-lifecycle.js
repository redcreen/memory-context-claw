function normalizeString(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createTimestamp(value, fallback) {
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return Number.isFinite(fallback) ? fallback : Date.now();
}

const SIGNAL_TYPE_BY_LABEL = {
  stable_rule_candidate: "rule",
  stable_preference_candidate: "preference",
  habit_signal_candidate: "habit",
  stable_fact_candidate: "fact",
  open_question_candidate: "question",
  observation_candidate: "observation"
};

const NEGATIVE_PATTERNS = [
  /\b(do not|don't|does not|doesn't|never|avoid|without|forbid|forbidden|ban|banned|cannot|can't|must not|should not|no longer|stop)\b/iu,
  /不要/u,
  /禁止/u,
  /不能/u,
  /不应/u,
  /不应该/u,
  /不再/u,
  /避免/u,
  /别/u,
  /不喜欢/u
];

const TOPIC_STRIP_PATTERNS = [
  /\bthe user\b/giu,
  /\buser\b/giu,
  /\bshould\b/giu,
  /\bmust\b/giu,
  /\bprefer(?:s|red)?\b/giu,
  /\bpreference\b/giu,
  /\brule(?:s)?\b/giu,
  /\bfact(?:s)?\b/giu,
  /\bhabit(?:s)?\b/giu,
  /\bremember\b/giu,
  /用户/gu,
  /应该/gu,
  /应当/gu,
  /必须/gu,
  /规则/gu,
  /偏好/gu,
  /习惯/gu,
  /记住/gu,
  /喜欢/gu,
  /不喜欢/gu,
  /不要/gu,
  /禁止/gu,
  /避免/gu
];

export function normalizeLearningText(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[`"'“”‘’]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function normalizeTopicText(text = "") {
  let normalized = normalizeLearningText(text);
  for (const pattern of NEGATIVE_PATTERNS) {
    normalized = normalized.replace(pattern, " ");
  }
  for (const pattern of TOPIC_STRIP_PATTERNS) {
    normalized = normalized.replace(pattern, " ");
  }
  normalized = normalized
    .replace(/[\s.,!?;:，。！？；：（）()\-_/\\]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  return normalized;
}

function createBigrams(text = "") {
  const normalized = normalizeLearningText(text).replace(/\s+/gu, "");
  if (normalized.length < 2) {
    return new Set(normalized ? [normalized] : []);
  }
  const result = new Set();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.add(normalized.slice(index, index + 2));
  }
  return result;
}

export function calculateLearningSimilarity(left, right) {
  const leftGrams = createBigrams(left);
  const rightGrams = createBigrams(right);
  if (leftGrams.size === 0 || rightGrams.size === 0) {
    return 0;
  }
  let overlap = 0;
  for (const gram of leftGrams) {
    if (rightGrams.has(gram)) {
      overlap += 1;
    }
  }
  return (2 * overlap) / (leftGrams.size + rightGrams.size);
}

export function inferLearningSignalType(artifact = {}) {
  const attributes = artifact.attributes || {};
  const explicitType = normalizeString(attributes.learning_signal_type);
  if (explicitType) {
    return explicitType;
  }

  const label = normalizeString(attributes.reflection_label);
  if (SIGNAL_TYPE_BY_LABEL[label]) {
    return SIGNAL_TYPE_BY_LABEL[label];
  }

  const hints = [
    ...((Array.isArray(artifact.export_hints) ? artifact.export_hints : [])),
    ...((Array.isArray(attributes.reflection_labels) ? attributes.reflection_labels : []))
  ];
  for (const hint of hints) {
    const normalizedHint = normalizeString(hint);
    if (SIGNAL_TYPE_BY_LABEL[normalizedHint]) {
      return SIGNAL_TYPE_BY_LABEL[normalizedHint];
    }
    if (normalizedHint.startsWith("learning:")) {
      return normalizedHint.slice("learning:".length);
    }
  }

  return "observation";
}

export function detectLearningPolarity(text = "") {
  const normalized = normalizeString(text);
  if (!normalized) {
    return "neutral";
  }
  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(normalized)) {
      return "negative";
    }
  }
  return "positive";
}

export function buildLearningTopicSignature(text = "") {
  return normalizeTopicText(text)
    .replace(/\s+/gu, "")
    .slice(0, 48);
}

export function isLearningArtifact(artifact = {}) {
  const signalType = inferLearningSignalType(artifact);
  if (signalType && signalType !== "observation") {
    return true;
  }
  const attributes = artifact.attributes || {};
  return Boolean(
    normalizeString(attributes.reflection_label)
    || (Array.isArray(attributes.reflection_labels) && attributes.reflection_labels.length > 0)
    || (Array.isArray(artifact.export_hints) && artifact.export_hints.length > 0)
  );
}

export function buildLearningLifecycleAttributes({
  summary = "",
  title = "",
  primaryLabel = "",
  repeatedSourceCount = 0,
  explicitRememberSignal = false
} = {}) {
  const signalType = SIGNAL_TYPE_BY_LABEL[normalizeString(primaryLabel)] || "observation";
  const polarity = detectLearningPolarity(summary);
  const topicSignature = buildLearningTopicSignature(summary || title);

  return {
    learning_signal_type: signalType,
    learning_polarity: polarity,
    learning_topic_signature: topicSignature,
    repeated_source_count: Math.max(0, Number(repeatedSourceCount) || 0),
    explicit_remember_signal: explicitRememberSignal === true
  };
}

function computeAgeDays(artifact, referenceTime) {
  const referenceTimestamp = createTimestamp(referenceTime, Date.now());
  const updatedTimestamp = createTimestamp(
    artifact.updated_at || artifact.created_at,
    referenceTimestamp
  );
  return Math.max(0, (referenceTimestamp - updatedTimestamp) / (24 * 60 * 60 * 1000));
}

function listRelatedStableArtifacts(candidateArtifact, stableArtifacts) {
  if (!Array.isArray(stableArtifacts)) {
    return [];
  }
  return stableArtifacts
    .map((stableArtifact) => compareLearningArtifacts(candidateArtifact, stableArtifact))
    .filter((item) => item.is_related);
}

export function evaluateLearningCandidatePromotion(candidateArtifact, options = {}) {
  const signalType = inferLearningSignalType(candidateArtifact);
  const attributes = candidateArtifact.attributes || {};
  const repeatedSourceCount = Math.max(0, Number(attributes.repeated_source_count) || 0);
  const explicitRememberSignal = attributes.explicit_remember_signal === true;
  const ageDays = computeAgeDays(candidateArtifact, options.referenceTime);
  const reasons = [];
  const blockers = [];
  let score = Number(candidateArtifact.confidence) || 0;

  const scoreBySignalType = {
    rule: 0.8,
    preference: 0.76,
    fact: 0.74,
    habit: 0.72,
    question: 1,
    observation: 1
  };
  const threshold = scoreBySignalType[signalType] ?? 0.8;

  if (["rule", "preference", "fact"].includes(signalType)) {
    score += 0.06;
    reasons.push("durable_signal_type");
  }
  if (signalType === "habit") {
    score += 0.04;
    reasons.push("habit_signal_candidate");
  }
  if (explicitRememberSignal) {
    score += 0.18;
    reasons.push("explicit_remember_signal");
  }
  if (repeatedSourceCount > 0) {
    score += Math.min(0.18, repeatedSourceCount * 0.08);
    reasons.push("repeated_source_signal");
  }

  const maxPromotionAgeDays = Number.isFinite(options.maxPromotionAgeDays)
    ? options.maxPromotionAgeDays
    : explicitRememberSignal
      ? 45
      : 21;
  if (ageDays > maxPromotionAgeDays) {
    blockers.push("candidate_is_stale_for_promotion");
  }
  if (signalType === "question" || signalType === "observation") {
    blockers.push("non_durable_signal_type");
  }
  if (
    signalType === "habit"
    && repeatedSourceCount < (Number.isFinite(options.minHabitRepeatedSourceCount) ? options.minHabitRepeatedSourceCount : 1)
    && !explicitRememberSignal
  ) {
    blockers.push("habit_requires_repeated_signal");
  }
  if (
    candidateArtifact.state === "observation"
    && normalizeString(attributes.last_promotion_reviewed_at)
  ) {
    blockers.push("candidate_already_processed");
  }
  if (candidateArtifact.state === "dropped") {
    blockers.push("candidate_already_dropped");
  }

  const relatedStableArtifacts = listRelatedStableArtifacts(
    candidateArtifact,
    options.existingStableArtifacts
  );
  const duplicateStableArtifacts = relatedStableArtifacts.filter((item) => item.is_duplicate);
  const conflictingStableArtifacts = relatedStableArtifacts.filter((item) => item.is_conflict);
  if (duplicateStableArtifacts.length > 0) {
    reasons.push("duplicate_stable_artifact");
  }
  if (conflictingStableArtifacts.length > 0) {
    reasons.push("conflicting_stable_artifact");
  }

  const promotionScore = clamp(score, 0, 1);
  const shouldPromote = blockers.length === 0 && promotionScore >= threshold;

  return {
    should_promote: shouldPromote,
    recommended_action:
      !shouldPromote
        ? blockers.includes("candidate_is_stale_for_promotion")
          ? "needs_replay"
          : "needs_more_evidence"
        : duplicateStableArtifacts.length > 0
          ? "reuse_existing"
          : conflictingStableArtifacts.length > 0
            ? "supersede_conflict"
            : "promote",
    promotion_score: promotionScore,
    promote_confidence_threshold: threshold,
    reason_codes: reasons,
    blocker_codes: blockers,
    signal_type: signalType,
    repeated_source_count: repeatedSourceCount,
    explicit_remember_signal: explicitRememberSignal,
    age_days: ageDays,
    duplicate_stable_artifact_ids: duplicateStableArtifacts.map((item) => item.right.artifact_id),
    conflicting_stable_artifact_ids: conflictingStableArtifacts.map((item) => item.right.artifact_id)
  };
}

export function evaluateLearningCandidateDecay(candidateArtifact, options = {}) {
  const signalType = inferLearningSignalType(candidateArtifact);
  const attributes = candidateArtifact.attributes || {};
  const repeatedSourceCount = Math.max(0, Number(attributes.repeated_source_count) || 0);
  const explicitRememberSignal = attributes.explicit_remember_signal === true;
  const ageDays = computeAgeDays(candidateArtifact, options.referenceTime);
  const confidence = Number(candidateArtifact.confidence) || 0;
  const alreadyProcessed = Boolean(
    candidateArtifact.state === "observation"
    && normalizeString(attributes.last_promotion_reviewed_at)
  );

  const maxAgeByState = {
    candidate: explicitRememberSignal ? 45 : 21,
    observation: explicitRememberSignal ? 30 : 14,
    dropped: 0
  };
  const maxAgeBySignalType = {
    question: 7,
    observation: 10,
    habit: explicitRememberSignal ? 30 : 18
  };

  const maxAgeDays = Number.isFinite(options.maxAgeDays)
    ? options.maxAgeDays
    : maxAgeBySignalType[signalType] ?? maxAgeByState[candidateArtifact.state] ?? 21;
  const weakConfidenceThreshold = Number.isFinite(options.weakConfidenceThreshold)
    ? options.weakConfidenceThreshold
    : signalType === "habit"
      ? 0.58
      : 0.62;

  const reasonCodes = [];
  if (alreadyProcessed) {
    return {
      should_decay: false,
      action: "keep",
      signal_type: signalType,
      reason_codes: [],
      age_days: ageDays,
      max_age_days: maxAgeDays,
      repeated_source_count: repeatedSourceCount,
      explicit_remember_signal: explicitRememberSignal,
      weak_confidence_threshold: weakConfidenceThreshold
    };
  }
  if (ageDays > maxAgeDays) {
    reasonCodes.push("learning_expired", `max_age_days:${maxAgeDays}`);
  } else if (
    confidence < weakConfidenceThreshold
    && repeatedSourceCount === 0
    && !explicitRememberSignal
    && ageDays >= 2
  ) {
    reasonCodes.push("weak_signal_decay");
  }

  return {
    should_decay: reasonCodes.length > 0 && candidateArtifact.state !== "dropped",
    action: reasonCodes.length > 0 ? "drop" : "keep",
    signal_type: signalType,
    reason_codes: reasonCodes,
    age_days: ageDays,
    max_age_days: maxAgeDays,
    repeated_source_count: repeatedSourceCount,
    explicit_remember_signal: explicitRememberSignal,
    weak_confidence_threshold: weakConfidenceThreshold
  };
}

function toLifecycleArtifact(input) {
  const artifact = input?.payload || input || {};
  return {
    artifact_id: artifact.artifact_id || input?.record_id || "",
    state: artifact.state || input?.state || "",
    namespace: artifact.namespace || input?.namespace || {},
    summary: normalizeString(artifact.summary),
    title: normalizeString(artifact.title),
    attributes: artifact.attributes || {},
    export_hints: Array.isArray(artifact.export_hints) ? artifact.export_hints : [],
    created_at: artifact.created_at || input?.created_at || "",
    updated_at: artifact.updated_at || input?.updated_at || ""
  };
}

export function compareLearningArtifacts(leftInput, rightInput) {
  const left = toLifecycleArtifact(leftInput);
  const right = toLifecycleArtifact(rightInput);
  const leftSignalType = inferLearningSignalType(left);
  const rightSignalType = inferLearningSignalType(right);
  const leftTopicSignature = normalizeString(left.attributes.learning_topic_signature)
    || buildLearningTopicSignature(`${left.title} ${left.summary}`);
  const rightTopicSignature = normalizeString(right.attributes.learning_topic_signature)
    || buildLearningTopicSignature(`${right.title} ${right.summary}`);
  const leftPolarity = normalizeString(left.attributes.learning_polarity)
    || detectLearningPolarity(`${left.title} ${left.summary}`);
  const rightPolarity = normalizeString(right.attributes.learning_polarity)
    || detectLearningPolarity(`${right.title} ${right.summary}`);
  const summarySimilarity = calculateLearningSimilarity(
    left.summary || left.title,
    right.summary || right.title
  );
  const textSimilarity = calculateLearningSimilarity(
    `${left.title} ${left.summary}`,
    `${right.title} ${right.summary}`
  );
  const topicSimilarity = calculateLearningSimilarity(leftTopicSignature, rightTopicSignature);
  const sameSignalType = leftSignalType === rightSignalType;
  const polarityConflict = leftPolarity !== "neutral"
    && rightPolarity !== "neutral"
    && leftPolarity !== rightPolarity;
  const isDuplicate = sameSignalType
    && leftPolarity === rightPolarity
    && (summarySimilarity >= 0.85 || textSimilarity >= 0.9 || topicSimilarity >= 0.92);
  const isConflict = sameSignalType
    && polarityConflict
    && topicSimilarity >= 0.4
    && (summarySimilarity >= 0.28 || textSimilarity >= 0.28);

  return {
    left,
    right,
    signal_type: leftSignalType,
    left_signal_type: leftSignalType,
    right_signal_type: rightSignalType,
    left_polarity: leftPolarity,
    right_polarity: rightPolarity,
    summary_similarity: Number(summarySimilarity.toFixed(4)),
    text_similarity: Number(textSimilarity.toFixed(4)),
    topic_similarity: Number(topicSimilarity.toFixed(4)),
    is_duplicate: isDuplicate,
    is_conflict: isConflict,
    is_related: isDuplicate || isConflict
  };
}

export function detectLearningConflicts(inputs, options = {}) {
  const artifacts = (Array.isArray(inputs) ? inputs : [])
    .map((item) => toLifecycleArtifact(item))
    .filter((artifact) => artifact.artifact_id && isLearningArtifact(artifact))
    .filter((artifact) => options.includeSuperseded === true || artifact.state !== "superseded");

  const conflicts = [];
  for (let leftIndex = 0; leftIndex < artifacts.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < artifacts.length; rightIndex += 1) {
      const comparison = compareLearningArtifacts(artifacts[leftIndex], artifacts[rightIndex]);
      if (!comparison.is_conflict) {
        continue;
      }
      const severity = comparison.left.state === "stable" && comparison.right.state === "stable"
        ? "error"
        : "warning";
      conflicts.push({
        conflict_id: `learning_conflict_${comparison.left.artifact_id}_${comparison.right.artifact_id}`,
        severity,
        code: "learning_conflict_detected",
        signal_type: comparison.signal_type,
        message: "Learning artifacts in the same namespace appear to conflict.",
        artifact_refs: [comparison.left.artifact_id, comparison.right.artifact_id],
        state_refs: [comparison.left.state, comparison.right.state],
        summary_similarity: comparison.summary_similarity,
        topic_similarity: comparison.topic_similarity,
        suggested_action:
          severity === "error" ? "supersede_older_stable" : "review_candidate"
      });
    }
  }

  return conflicts;
}

function withinWindow(timestamp, windowStart, windowEnd) {
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) {
    return false;
  }
  return parsed >= windowStart && parsed < windowEnd;
}

export function summarizeLearningTimeWindow({
  records = [],
  decisionTrails = [],
  windowStart,
  windowEnd
} = {}) {
  const result = {
    records_created: 0,
    candidates_created: 0,
    stable_created: 0,
    promotions: 0,
    reused_duplicates: 0,
    decayed_or_expired: 0,
    superseded_conflicts: 0
  };

  for (const record of records) {
    if (!isLearningArtifact(record.payload || {})) {
      continue;
    }
    if (!withinWindow(record.created_at, windowStart, windowEnd)) {
      continue;
    }
    result.records_created += 1;
    if (record.record_type === "candidate_artifact") {
      result.candidates_created += 1;
    }
    if (record.record_type === "stable_artifact" && record.state === "stable") {
      result.stable_created += 1;
    }
  }

  for (const trail of decisionTrails) {
    if (!withinWindow(trail.decided_at, windowStart, windowEnd)) {
      continue;
    }
    if (trail.to_state === "stable") {
      result.promotions += 1;
    }
    if (
      trail.to_state === "dropped"
      && trail.reason_codes.some((code) =>
        code === "duplicate_stable_artifact"
      )
    ) {
      result.reused_duplicates += 1;
    }
    if (
      trail.to_state === "dropped"
      && trail.reason_codes.some((code) =>
        code === "weak_signal_decay" || code === "learning_expired"
      )
    ) {
      result.decayed_or_expired += 1;
    }
    if (
      trail.to_state === "superseded"
      && trail.reason_codes.some((code) => code === "learning_conflict_superseded")
    ) {
      result.superseded_conflicts += 1;
    }
  }

  return result;
}

export function diffLearningWindowSummaries(currentWindow, previousWindow) {
  const keys = new Set([
    ...Object.keys(currentWindow || {}),
    ...Object.keys(previousWindow || {})
  ]);
  const delta = {};

  for (const key of keys) {
    delta[key] = (currentWindow?.[key] || 0) - (previousWindow?.[key] || 0);
  }

  return delta;
}
