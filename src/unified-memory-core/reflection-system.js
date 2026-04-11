import { createHash, randomUUID } from "node:crypto";

import {
  SHARED_CONTRACT_VERSION,
  createContractId,
  createContractTimestamp,
  createNamespaceKey,
  parseCandidateArtifact,
  parseSourceArtifact
} from "./contracts.js";

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
  "stable_fact_candidate"
]);

function createFingerprint(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function getSourceText(sourceArtifact) {
  const payload = sourceArtifact.normalized_payload || {};

  if (sourceArtifact.source_type === "manual" || sourceArtifact.source_type === "file") {
    return typeof payload.text === "string" ? payload.text.trim() : "";
  }

  if (sourceArtifact.source_type === "conversation") {
    const turns = Array.isArray(payload.turns) ? payload.turns : [];
    return turns
      .map((turn) => (typeof turn?.content === "string" ? turn.content.trim() : ""))
      .filter(Boolean)
      .join("\n");
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

  return `${sourceArtifact.source_type} source reflection`;
}

function detectLabels(sourceArtifact, text) {
  const labels = new Set();
  const normalizedText = String(text || "");

  if (sourceArtifact.source_type === "directory") {
    labels.add("observation_candidate");
    return [...labels];
  }

  if (/\b(must|always|never|rule|rules|required?|should)\b|必须|不要|禁止|应当/iu.test(normalizedText)) {
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

function buildRunSummary(outputs) {
  const byLabel = {};
  const byState = {};

  for (const output of outputs) {
    byLabel[output.primary_label] = (byLabel[output.primary_label] || 0) + 1;
    byState[output.candidate_artifact.state] = (byState[output.candidate_artifact.state] || 0) + 1;
  }

  return {
    candidate_count: outputs.length,
    by_label: byLabel,
    by_state: byState
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
      (record) => record.payload?.fingerprint === sourceArtifact.fingerprint
    ).length;
    const text = getSourceText(sourceArtifact);
    const labels = detectLabels(sourceArtifact, text);
    const primaryLabel = pickPrimaryLabel(labels);
    const summary = summarizeText(sourceArtifact, text);
    const confidence = buildConfidence(primaryLabel, repeatedSourceCount);
    const now = createContractTimestamp(clock);
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
      title: buildCandidateTitle(sourceArtifact, primaryLabel),
      summary,
      source_artifact_id: sourceArtifact.artifact_id,
      evidence_refs: [sourceArtifact.artifact_id],
      fingerprint: createFingerprint({
        source_artifact_id: sourceArtifact.artifact_id,
        primary_label: primaryLabel,
        summary,
        repeated_source_count: repeatedSourceCount
      }),
      confidence,
      attributes: {
        reflection_label: primaryLabel,
        reflection_labels: labels,
        namespace_key: createNamespaceKey(sourceArtifact.namespace),
        source_type: sourceArtifact.source_type,
        source_fingerprint: sourceArtifact.fingerprint,
        repeated_source_count: repeatedSourceCount,
        prior_namespace_record_count: priorRecords.length
      },
      export_hints: [primaryLabel],
      created_at: now,
      updated_at: now
    });

    return {
      source_artifact_id: sourceArtifact.artifact_id,
      labels,
      primary_label: primaryLabel,
      repeated_source_count: repeatedSourceCount,
      recommendation: {
        should_promote:
          PROMOTABLE_LABELS.has(primaryLabel) &&
          candidateArtifact.state === "candidate" &&
          candidateArtifact.confidence >= promoteConfidenceThreshold,
        promote_confidence_threshold: promoteConfidenceThreshold
      },
      candidate_artifact: candidateArtifact
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
    const candidateRecords = [];
    const decisionTrails = [];

    for (const sourceArtifact of sourceArtifacts) {
      const reflection = await reflectSourceArtifact(sourceArtifact);
      outputs.push(reflection);

      if (!persistCandidates) {
        continue;
      }

      const candidateRecord = await registry.persistCandidateArtifact(reflection.candidate_artifact);
      const decisionTrail = await registry.recordDecisionTrail({
        decision_id: createContractId("decision", idGenerator),
        artifact_id: reflection.candidate_artifact.artifact_id,
        artifact_type: "candidate_artifact",
        namespace: reflection.candidate_artifact.namespace,
        visibility: reflection.candidate_artifact.visibility,
        from_state: "source_artifact",
        to_state: reflection.candidate_artifact.state,
        decided_by: decidedBy,
        decided_at: createContractTimestamp(clock),
        reason_codes: buildReasonCodes(reflection.labels, reflection.repeated_source_count),
        evidence_refs: reflection.candidate_artifact.evidence_refs,
        metadata: {
          reflection_label: reflection.primary_label,
          repeated_source_count: reflection.repeated_source_count
        }
      });

      candidateRecords.push(candidateRecord);
      decisionTrails.push(decisionTrail);
    }

    return {
      run: {
        run_id: createContractId("reflect", idGenerator),
        contract_version: SHARED_CONTRACT_VERSION,
        started_at: startedAt,
        completed_at: createContractTimestamp(clock),
        summary: buildRunSummary(outputs)
      },
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
