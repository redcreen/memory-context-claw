import { createHash, randomUUID } from "node:crypto";

import {
  SHARED_CONTRACT_VERSION,
  createContractId,
  createContractTimestamp,
  createNamespaceKey,
  parseCandidateArtifact,
  parseSourceArtifact
} from "./contracts.js";
import {
  buildLearningLifecycleAttributes,
  evaluateLearningCandidatePromotion,
  inferLearningSignalType
} from "./learning-lifecycle.js";

const LABEL_PRIORITY = [
  "stable_rule_candidate",
  "stable_preference_candidate",
  "habit_signal_candidate",
  "open_question_candidate",
  "stable_fact_candidate",
  "observation_candidate"
];

const PROMOTABLE_LABELS = new Set([
  "stable_rule_candidate",
  "stable_preference_candidate",
  "stable_fact_candidate",
  "habit_signal_candidate"
]);

const EXPLICIT_REMEMBER_PATTERN = /\b(remember this|remember that|please remember|save this|keep this in mind)\b|记住这个|记住这点|请记住|记下来/iu;
const ACCEPTED_ACTION_RULE_PATTERN = /\b(rule|policy|default|preferred?|always|never|must|should|standard)\b|规则|策略|默认|必须|应该|优先|固定/iu;

function createFingerprint(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function getSourceText(sourceArtifact) {
  const payload = sourceArtifact.normalized_payload || {};

  if (sourceArtifact.source_type === "manual"
    || sourceArtifact.source_type === "file"
    || sourceArtifact.source_type === "url"
    || sourceArtifact.source_type === "accepted_action"
    || sourceArtifact.source_type === "memory_intent") {
    return typeof payload.text === "string" ? payload.text.trim() : "";
  }

  if (sourceArtifact.source_type === "conversation") {
    const turns = Array.isArray(payload.turns) ? payload.turns : [];
    return turns
      .map((turn) => (typeof turn?.content === "string" ? turn.content.trim() : ""))
      .filter(Boolean)
      .join("\n");
  }

  if (sourceArtifact.source_type === "image") {
    return typeof payload.text === "string" && payload.text.trim()
      ? payload.text.trim()
      : typeof payload.path === "string"
        ? payload.path.trim()
        : "";
  }

  if (sourceArtifact.source_type === "directory") {
    const entries = Array.isArray(payload.entries) ? payload.entries : [];
    return entries
      .slice(0, 8)
      .map((entry) => entry.path)
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function summarizeText(sourceArtifact, text, maxChars = 180) {
  if (text) {
    return text.replace(/\s+/g, " ").slice(0, maxChars);
  }

  if (sourceArtifact.source_type === "directory") {
    const entryCount = Number(sourceArtifact.normalized_payload?.entry_count) || 0;
    return `directory snapshot with ${entryCount} entries`;
  }

  if (sourceArtifact.source_type === "image") {
    const imagePath = String(sourceArtifact.normalized_payload?.path || "").trim();
    return imagePath ? `image snapshot ${imagePath}` : "image source reflection";
  }

  return `${sourceArtifact.source_type} source reflection`;
}

function normalizeSummaryText(text = "", maxChars = 180) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, maxChars);
}

function detectLabels(sourceArtifact, text) {
  const labels = new Set();
  const normalizedText = String(text || "");

  if (sourceArtifact.source_type === "directory") {
    labels.add("observation_candidate");
    return [...labels];
  }

  if (sourceArtifact.source_type === "accepted_action") {
    labels.add("stable_fact_candidate");
    if (/\b(rule|policy|default|always|never|must|should)\b|规则|策略|默认|必须|应该/iu.test(normalizedText)) {
      labels.add("stable_rule_candidate");
    }
    return [...labels];
  }

  if (sourceArtifact.source_type === "memory_intent") {
    const admissionRoute = String(sourceArtifact.normalized_payload?.admission_route || "").trim();
    if (admissionRoute.startsWith("candidate_rule")) {
      labels.add("stable_rule_candidate");
    } else if (admissionRoute === "candidate_profile") {
      labels.add("stable_preference_candidate");
    } else if (admissionRoute === "observation_session" || admissionRoute === "observation_task_instruction" || admissionRoute === "observation_low_confidence") {
      labels.add("observation_candidate");
    }
    if (labels.size === 0) {
      labels.add("stable_fact_candidate");
    }
    return [...labels];
  }

  if (/\b(must|always|never|rule|rules|required?|should)\b|必须|不要|禁止|应当|应该|优先/iu.test(normalizedText)) {
    labels.add("stable_rule_candidate");
  }
  if (/\b(prefer|prefers|preferred|preference|likes?|dislikes?|favorite)\b|偏好|喜欢|不喜欢|更倾向/iu.test(normalizedText)) {
    labels.add("stable_preference_candidate");
  }
  if (/\b(daily|habit|routine|usually|every day|every time)\b|经常|每天|习惯/iu.test(normalizedText)) {
    labels.add("habit_signal_candidate");
  }
  if (/\?|待确认|不确定|unknown|unclear|todo/iu.test(normalizedText)) {
    labels.add("open_question_candidate");
  }

  if (labels.size === 0) {
    labels.add("stable_fact_candidate");
  }

  return [...labels];
}

function pickPrimaryLabel(labels) {
  for (const label of LABEL_PRIORITY) {
    if (labels.includes(label)) {
      return label;
    }
  }
  return "observation_candidate";
}

function buildCandidateTitle(sourceArtifact, primaryLabel) {
  const prefixByLabel = {
    stable_rule_candidate: "rule",
    stable_preference_candidate: "preference",
    habit_signal_candidate: "habit",
    open_question_candidate: "question",
    stable_fact_candidate: "fact",
    observation_candidate: "observation"
  };
  return `${prefixByLabel[primaryLabel] || "reflection"}:${sourceArtifact.source_id}`;
}

function buildConfidence(primaryLabel, repeatedSourceCount) {
  const baseByLabel = {
    stable_rule_candidate: 0.84,
    stable_preference_candidate: 0.78,
    stable_fact_candidate: 0.7,
    habit_signal_candidate: 0.62,
    open_question_candidate: 0.38,
    observation_candidate: 0.42
  };
  const repeatedBonus = Math.min(0.12, repeatedSourceCount * 0.04);
  return Math.min(0.95, (baseByLabel[primaryLabel] || 0.5) + repeatedBonus);
}

function buildReasonCodes(labels, repeatedSourceCount) {
  const reasonCodes = ["reflection_run"];
  for (const label of labels) {
    reasonCodes.push(`label:${label}`);
  }
  if (repeatedSourceCount > 0) {
    reasonCodes.push("repeated_source_signal");
  }
  return reasonCodes;
}

function sanitizeTitleSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-z0-9]+/giu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 48);
}

function buildAcceptedActionTitle(sourceArtifact, primaryLabel, suffix) {
  const baseTitle = buildCandidateTitle(sourceArtifact, primaryLabel);
  const normalizedSuffix = sanitizeTitleSegment(suffix);
  return normalizedSuffix ? `${baseTitle}:${normalizedSuffix}` : baseTitle;
}

function buildAcceptedActionConfidence(primaryLabel, repeatedSourceCount, evidence = {}) {
  const acceptedBonus = evidence.accepted ? 0.04 : 0;
  const successBonus = evidence.executionSucceeded ? 0.06 : 0;
  const reusableBonus = evidence.reusableTarget ? 0.05 : 0;
  return Math.min(
    0.97,
    buildConfidence(primaryLabel, repeatedSourceCount) + acceptedBonus + successBonus + reusableBonus
  );
}

function buildPromotionRecommendation(candidateArtifact, existingStableArtifacts, promoteConfidenceThreshold) {
  const primaryLabel = String(candidateArtifact.attributes?.reflection_label || "");
  const promotionRecommendation = evaluateLearningCandidatePromotion(candidateArtifact, {
    existingStableArtifacts
  });

  return {
    should_promote:
      PROMOTABLE_LABELS.has(primaryLabel) &&
      candidateArtifact.state === "candidate" &&
      promotionRecommendation.should_promote,
    promote_confidence_threshold: Math.max(
      promoteConfidenceThreshold,
      promotionRecommendation.promote_confidence_threshold
    ),
    promotion_score: promotionRecommendation.promotion_score,
    recommended_action: promotionRecommendation.recommended_action,
    reason_codes: promotionRecommendation.reason_codes,
    blocker_codes: promotionRecommendation.blocker_codes,
    signal_type: inferLearningSignalType(candidateArtifact),
    duplicate_stable_artifact_ids: promotionRecommendation.duplicate_stable_artifact_ids,
    conflicting_stable_artifact_ids: promotionRecommendation.conflicting_stable_artifact_ids
  };
}

function buildReflectionOutput({
  sourceArtifact,
  sourceText,
  labels,
  summary,
  repeatedSourceCount,
  explicitRememberSignal,
  now,
  idGenerator,
  priorRecords,
  promoteConfidenceThreshold,
  existingStableArtifacts,
  title,
  confidence,
  attributes = {},
  exportHints = []
}) {
  const primaryLabel = pickPrimaryLabel(labels);
  const lifecycleAttributes = buildLearningLifecycleAttributes({
    summary,
    title: title || buildCandidateTitle(sourceArtifact, primaryLabel),
    primaryLabel,
    repeatedSourceCount,
    explicitRememberSignal
  });
  const candidateState = primaryLabel === "open_question_candidate" || primaryLabel === "observation_candidate"
    ? "observation"
    : "candidate";
  const candidateArtifact = parseCandidateArtifact({
    artifact_id: createContractId("artifact", idGenerator),
    artifact_type: "candidate_artifact",
    contract_version: SHARED_CONTRACT_VERSION,
    state: candidateState,
    namespace: sourceArtifact.namespace,
    visibility: sourceArtifact.visibility,
    title: title || buildCandidateTitle(sourceArtifact, primaryLabel),
    summary,
    source_artifact_id: sourceArtifact.artifact_id,
    evidence_refs: [sourceArtifact.artifact_id],
    fingerprint: createFingerprint({
      source_artifact_id: sourceArtifact.artifact_id,
      primary_label: primaryLabel,
      summary,
      repeated_source_count: repeatedSourceCount,
      extraction_class: attributes.accepted_action_extraction_class || "",
      target_value: attributes.accepted_action_target_value || "",
      field_path: attributes.accepted_action_field_path || ""
    }),
    confidence,
    attributes: {
      reflection_label: primaryLabel,
      reflection_labels: labels,
      namespace_key: createNamespaceKey(sourceArtifact.namespace),
      source_type: sourceArtifact.source_type,
      source_fingerprint: sourceArtifact.fingerprint,
      repeated_source_count: repeatedSourceCount,
      prior_namespace_record_count: priorRecords.length,
      explicit_remember_signal: explicitRememberSignal,
      source_summary: normalizeSummaryText(sourceText),
      ...lifecycleAttributes,
      ...attributes
    },
    export_hints: [
      primaryLabel,
      `learning:${lifecycleAttributes.learning_signal_type}`,
      ...(explicitRememberSignal ? ["explicit_remember"] : []),
      ...exportHints
    ],
    created_at: now,
    updated_at: now
  });

  return {
    source_artifact_id: sourceArtifact.artifact_id,
    labels,
    primary_label: primaryLabel,
    repeated_source_count: repeatedSourceCount,
    recommendation: buildPromotionRecommendation(
      candidateArtifact,
      existingStableArtifacts,
      promoteConfidenceThreshold
    ),
    candidate_artifact: candidateArtifact
  };
}

function deriveAcceptedActionFieldAwareOutputs({
  sourceArtifact,
  text,
  repeatedSourceCount,
  explicitRememberSignal,
  now,
  idGenerator,
  priorRecords,
  existingStableArtifacts,
  promoteConfidenceThreshold
}) {
  const payload = sourceArtifact.normalized_payload || {};
  const actionType = String(payload.action_type || "").trim();
  const accepted = payload.accepted === true;
  const executionSucceeded = payload.execution_succeeded === true;
  const contentSummary = normalizeSummaryText(payload.summary || payload.text || "");
  const reusableTargets = Array.isArray(payload.target_descriptors)
    ? payload.target_descriptors.filter((item) => item && item.is_reusable)
    : [];
  const outcomeTargets = Array.isArray(payload.target_descriptors)
    ? payload.target_descriptors.filter((item) => item && !item.is_reusable)
    : [];
  const artifactDescriptors = Array.isArray(payload.artifact_descriptors)
    ? payload.artifact_descriptors
    : [];
  const outputDescriptors = Array.isArray(payload.output_descriptors)
    ? payload.output_descriptors
    : [];
  const outputs = [];

  if (!accepted || !executionSucceeded) {
    return outputs;
  }

  for (const descriptor of reusableTargets.slice(0, 3)) {
    const summary = normalizeSummaryText(
      `accepted action ${actionType} succeeded with reusable target ${descriptor.value}`
    );
    outputs.push(buildReflectionOutput({
      sourceArtifact,
      sourceText: text,
      labels: ["stable_fact_candidate"],
      summary,
      repeatedSourceCount,
      explicitRememberSignal,
      now,
      idGenerator,
      priorRecords,
      promoteConfidenceThreshold,
      existingStableArtifacts,
      title: buildAcceptedActionTitle(sourceArtifact, "stable_fact_candidate", descriptor.value),
      confidence: buildAcceptedActionConfidence("stable_fact_candidate", repeatedSourceCount, {
        accepted,
        executionSucceeded,
        reusableTarget: true
      }),
      attributes: {
        accepted_action_extraction_class: "target_fact",
        accepted_action_action_type: actionType,
        accepted_action_status: String(payload.status || "").trim(),
        accepted_action_target_kind: String(descriptor.kind || "").trim(),
        accepted_action_target_value: String(descriptor.value || "").trim(),
        accepted_action_target_reuse_class: String(descriptor.reuse_class || "").trim(),
        accepted_action_user_accepted: accepted,
        accepted_action_execution_succeeded: executionSucceeded
      },
      exportHints: [
        "accepted_action",
        "accepted_action:target_fact",
        `accepted_action_target_kind:${descriptor.kind || "unknown"}`
      ]
    }));
  }

  if (contentSummary && ACCEPTED_ACTION_RULE_PATTERN.test(contentSummary)) {
    const firstTarget = reusableTargets[0];
    const summary = normalizeSummaryText(
      firstTarget && !contentSummary.includes(firstTarget.value)
        ? `${contentSummary} target ${firstTarget.value}`
        : contentSummary
    );
    outputs.push(buildReflectionOutput({
      sourceArtifact,
      sourceText: text,
      labels: ["stable_rule_candidate"],
      summary,
      repeatedSourceCount,
      explicitRememberSignal,
      now,
      idGenerator,
      priorRecords,
      promoteConfidenceThreshold,
      existingStableArtifacts,
      title: buildAcceptedActionTitle(sourceArtifact, "stable_rule_candidate", `${actionType}-rule`),
      confidence: buildAcceptedActionConfidence("stable_rule_candidate", repeatedSourceCount, {
        accepted,
        executionSucceeded,
        reusableTarget: reusableTargets.length > 0
      }),
      attributes: {
        accepted_action_extraction_class: "operating_rule",
        accepted_action_action_type: actionType,
        accepted_action_status: String(payload.status || "").trim(),
        accepted_action_user_accepted: accepted,
        accepted_action_execution_succeeded: executionSucceeded,
        ...(reusableTargets[0]
          ? {
              accepted_action_target_kind: String(reusableTargets[0].kind || "").trim(),
              accepted_action_target_value: String(reusableTargets[0].value || "").trim()
            }
          : {})
      },
      exportHints: ["accepted_action", "accepted_action:operating_rule"]
    }));
  }

  const outcomeDescriptors = [
    ...outcomeTargets.map((descriptor) => ({
      value: descriptor.value,
      kind: descriptor.kind,
      fieldPath: "external_targets"
    })),
    ...artifactDescriptors.map((descriptor) => ({
      value: descriptor.value,
      kind: descriptor.kind,
      fieldPath: "artifact_paths"
    })),
    ...outputDescriptors.map((descriptor) => ({
      value: descriptor.value,
      kind: descriptor.kind,
      fieldPath: descriptor.field_path || "outputs"
    }))
  ];

  const seenOutcomeKeys = new Set();
  for (const descriptor of outcomeDescriptors) {
    const dedupeKey = String(descriptor.value || "").trim();
    if (!descriptor.value || seenOutcomeKeys.has(dedupeKey)) {
      continue;
    }
    seenOutcomeKeys.add(dedupeKey);

    const summary = normalizeSummaryText(
      descriptor.kind === "artifact_path"
        ? `accepted action ${actionType} produced artifact ${descriptor.value}`
        : `accepted action ${actionType} produced outcome ${descriptor.value}`
    );
    outputs.push(buildReflectionOutput({
      sourceArtifact,
      sourceText: text,
      labels: ["observation_candidate"],
      summary,
      repeatedSourceCount,
      explicitRememberSignal,
      now,
      idGenerator,
      priorRecords,
      promoteConfidenceThreshold,
      existingStableArtifacts,
      title: buildAcceptedActionTitle(sourceArtifact, "observation_candidate", descriptor.value),
      confidence: buildAcceptedActionConfidence("observation_candidate", repeatedSourceCount, {
        accepted,
        executionSucceeded
      }),
      attributes: {
        accepted_action_extraction_class: "outcome_artifact",
        accepted_action_action_type: actionType,
        accepted_action_status: String(payload.status || "").trim(),
        accepted_action_field_path: descriptor.fieldPath,
        accepted_action_target_kind: String(descriptor.kind || "").trim(),
        accepted_action_target_value: String(descriptor.value || "").trim(),
        accepted_action_user_accepted: accepted,
        accepted_action_execution_succeeded: executionSucceeded
      },
      exportHints: ["accepted_action", "accepted_action:outcome_artifact"]
    }));
  }

  return outputs;
}

function deriveMemoryIntentOutputs({
  sourceArtifact,
  text,
  repeatedSourceCount,
  explicitRememberSignal,
  now,
  idGenerator,
  priorRecords,
  existingStableArtifacts,
  promoteConfidenceThreshold
}) {
  const payload = sourceArtifact.normalized_payload || {};
  const category = String(payload.category || "").trim();
  const durability = String(payload.durability || "").trim();
  const summary = normalizeSummaryText(payload.summary || payload.text || "");
  const confidence = Number.isFinite(payload.confidence)
    ? Math.max(0, Math.min(1, Number(payload.confidence)))
    : 0.5;
  const admissionRoute = String(payload.admission_route || "").trim() || "skip";
  const structuredRule = payload.structured_rule || {};
  const trigger = structuredRule.trigger || {};
  const action = structuredRule.action || {};
  let labels = ["observation_candidate"];
  let title = buildCandidateTitle(sourceArtifact, "observation_candidate");
  let exportHints = [
    "memory_intent",
    `memory_intent:category:${category || "unknown"}`,
    `memory_intent:durability:${durability || "unknown"}`,
    `memory_intent:route:${admissionRoute || "unknown"}`
  ];

  if (admissionRoute === "candidate_rule") {
    labels = ["stable_rule_candidate"];
    title = `memory-intent-rule:${sourceArtifact.source_id}`;
  } else if (admissionRoute === "candidate_profile") {
    labels = ["stable_preference_candidate"];
    title = `memory-intent-profile:${sourceArtifact.source_id}`;
  } else if (admissionRoute === "candidate_generic") {
    labels = ["stable_fact_candidate"];
    title = `memory-intent-fact:${sourceArtifact.source_id}`;
  } else {
    title = `memory-intent-observation:${sourceArtifact.source_id}`;
  }

  if (action.tool) {
    exportHints.push(`memory_intent:tool:${action.tool}`);
  }
  if (Array.isArray(trigger.domains)) {
    exportHints = exportHints.concat(
      trigger.domains.filter(Boolean).slice(0, 3).map((domain) => `memory_intent:domain:${domain}`)
    );
  }

  return [buildReflectionOutput({
    sourceArtifact,
    sourceText: text,
    labels,
    summary,
    repeatedSourceCount,
    explicitRememberSignal,
    now,
    idGenerator,
    priorRecords,
    promoteConfidenceThreshold,
    existingStableArtifacts,
    title,
    confidence,
    attributes: {
      memory_intent_category: category,
      memory_intent_durability: durability,
      memory_intent_confidence: confidence,
      memory_intent_admission_route: admissionRoute,
      memory_intent_tool: String(action.tool || "").trim(),
      memory_intent_trigger_kind: String(trigger.content_kind || "").trim(),
      memory_intent_trigger_domains: Array.isArray(trigger.domains) ? [...trigger.domains] : []
    },
    exportHints
  })];
}

function buildRunSummary(outputs) {
  const byLabel = {};
  const byState = {};
  const byExtractionClass = {};

  for (const output of outputs) {
    byLabel[output.primary_label] = (byLabel[output.primary_label] || 0) + 1;
    byState[output.candidate_artifact.state] = (byState[output.candidate_artifact.state] || 0) + 1;
    const extractionClass = String(
      output.candidate_artifact.attributes?.accepted_action_extraction_class || "generic"
    );
    byExtractionClass[extractionClass] = (byExtractionClass[extractionClass] || 0) + 1;
  }

  return {
    candidate_count: outputs.length,
    by_label: byLabel,
    by_state: byState,
    by_extraction_class: byExtractionClass
  };
}

export function createReflectionSystem(options = {}) {
  const registry = options.registry;
  const idGenerator = options.idGenerator || randomUUID;
  const clock = options.clock || (() => new Date());
  const promoteConfidenceThreshold = Number.isFinite(options.promoteConfidenceThreshold)
    ? Math.max(0, Math.min(1, Number(options.promoteConfidenceThreshold)))
    : 0.75;

  async function listPriorRecords(namespace) {
    if (!registry || typeof registry.listRecords !== "function") {
      return [];
    }
    return registry.listRecords({
      namespaceKey: createNamespaceKey(namespace)
    });
  }

  async function reflectSourceArtifact(sourceArtifactInput) {
    const sourceArtifact = parseSourceArtifact(sourceArtifactInput);
    const priorRecords = await listPriorRecords(sourceArtifact.namespace);
    const sourceRecords = priorRecords.filter((record) => record.record_type === "source_artifact");
    const repeatedSourceCount = sourceRecords.filter(
      (record) =>
        record.payload?.fingerprint === sourceArtifact.fingerprint &&
        record.record_id !== sourceArtifact.artifact_id
    ).length;
    const text = getSourceText(sourceArtifact);
    const now = createContractTimestamp(clock);
    const explicitRememberSignal = EXPLICIT_REMEMBER_PATTERN.test(text);
    const existingStableArtifacts = priorRecords
      .filter((record) => record.record_type === "stable_artifact" && record.state === "stable")
      .map((record) => record.payload);
    const fieldAwareOutputs = sourceArtifact.source_type === "accepted_action"
      ? deriveAcceptedActionFieldAwareOutputs({
          sourceArtifact,
          text,
          repeatedSourceCount,
          explicitRememberSignal,
          now,
          idGenerator,
          priorRecords,
          existingStableArtifacts,
          promoteConfidenceThreshold
        })
      : sourceArtifact.source_type === "memory_intent"
        ? deriveMemoryIntentOutputs({
            sourceArtifact,
            text,
            repeatedSourceCount,
            explicitRememberSignal,
            now,
            idGenerator,
            priorRecords,
            existingStableArtifacts,
            promoteConfidenceThreshold
          })
      : [];
    const reflectionOutputs = fieldAwareOutputs.length > 0
      ? fieldAwareOutputs
      : [(() => {
          const labels = detectLabels(sourceArtifact, text);
          const primaryLabel = pickPrimaryLabel(labels);
          return buildReflectionOutput({
            sourceArtifact,
            sourceText: text,
            labels,
            summary: summarizeText(sourceArtifact, text),
            repeatedSourceCount,
            explicitRememberSignal,
            now,
            idGenerator,
            priorRecords,
            promoteConfidenceThreshold,
            existingStableArtifacts,
            title: buildCandidateTitle(sourceArtifact, primaryLabel),
            confidence: buildConfidence(primaryLabel, repeatedSourceCount)
          });
        })()];
    const primaryOutput = reflectionOutputs[0];

    return {
      source_artifact_id: sourceArtifact.artifact_id,
      labels: primaryOutput.labels,
      primary_label: primaryOutput.primary_label,
      repeated_source_count: repeatedSourceCount,
      recommendation: primaryOutput.recommendation,
      candidate_artifact: primaryOutput.candidate_artifact,
      candidate_artifacts: reflectionOutputs.map((output) => output.candidate_artifact),
      output_count: reflectionOutputs.length,
      outputs: reflectionOutputs
    };
  }

  async function runReflection({
    sourceArtifacts,
    persistCandidates = false,
    decidedBy = "reflection-system-mvp"
  } = {}) {
    if (!Array.isArray(sourceArtifacts) || sourceArtifacts.length === 0) {
      throw new TypeError("runReflection requires sourceArtifacts");
    }
    if (persistCandidates && (!registry || typeof registry.persistCandidateArtifact !== "function")) {
      throw new TypeError("persistCandidates requires a registry");
    }

    const startedAt = createContractTimestamp(clock);
    const outputs = [];
    const sourceReflections = [];
    const candidateRecords = [];
    const decisionTrails = [];

    for (const sourceArtifact of sourceArtifacts) {
      const reflection = await reflectSourceArtifact(sourceArtifact);
      const reflectionOutputs = Array.isArray(reflection.outputs) && reflection.outputs.length > 0
        ? reflection.outputs
        : [reflection];
      outputs.push(...reflectionOutputs);
      sourceReflections.push({
        source_artifact_id: reflection.source_artifact_id,
        primary_label: reflection.primary_label,
        output_count: reflection.output_count || reflectionOutputs.length
      });

      if (!persistCandidates) {
        continue;
      }

      for (const output of reflectionOutputs) {
        const candidateRecord = await registry.persistCandidateArtifact(output.candidate_artifact);
        const decisionTrail = await registry.recordDecisionTrail({
          decision_id: createContractId("decision", idGenerator),
          artifact_id: output.candidate_artifact.artifact_id,
          artifact_type: "candidate_artifact",
          namespace: output.candidate_artifact.namespace,
          visibility: output.candidate_artifact.visibility,
          from_state: "source_artifact",
          to_state: output.candidate_artifact.state,
          decided_by: decidedBy,
          decided_at: createContractTimestamp(clock),
          reason_codes: buildReasonCodes(output.labels, output.repeated_source_count),
          evidence_refs: output.candidate_artifact.evidence_refs,
          metadata: {
            reflection_label: output.primary_label,
            repeated_source_count: output.repeated_source_count,
            accepted_action_extraction_class:
              output.candidate_artifact.attributes?.accepted_action_extraction_class || "",
            memory_intent_admission_route:
              output.candidate_artifact.attributes?.memory_intent_admission_route || "",
            memory_intent_category:
              output.candidate_artifact.attributes?.memory_intent_category || ""
          }
        });

        candidateRecords.push(candidateRecord);
        decisionTrails.push(decisionTrail);
      }
    }

    return {
      run: {
        run_id: createContractId("reflect", idGenerator),
        contract_version: SHARED_CONTRACT_VERSION,
        started_at: startedAt,
        completed_at: createContractTimestamp(clock),
        summary: buildRunSummary(outputs)
      },
      source_reflections: sourceReflections,
      outputs,
      candidate_artifacts: outputs.map((output) => output.candidate_artifact),
      candidate_records: candidateRecords,
      decision_trails: decisionTrails
    };
  }

  return {
    reflectSourceArtifact,
    runReflection
  };
}
