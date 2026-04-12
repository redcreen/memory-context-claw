import { createHash, randomUUID } from "node:crypto";

import {
  SHARED_CONTRACT_VERSION,
  createContractId,
  createContractTimestamp,
  parseCandidateArtifact
} from "./contracts.js";

function createFingerprint(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function summarizeSourceArtifact(sourceArtifact) {
  const payload = sourceArtifact.normalized_payload || {};

  if (sourceArtifact.source_type === "manual") {
    return payload.text || "manual source";
  }

  if (sourceArtifact.source_type === "file") {
    return payload.text || payload.path || "file source";
  }

  if (sourceArtifact.source_type === "url") {
    return payload.text || payload.url || "url source";
  }

  if (sourceArtifact.source_type === "accepted_action") {
    return payload.text || payload.summary || payload.action_type || "accepted action source";
  }

  if (sourceArtifact.source_type === "image") {
    return payload.text || payload.path || "image source";
  }

  if (sourceArtifact.source_type === "conversation") {
    const firstTurn = Array.isArray(payload.turns) ? payload.turns[0] : null;
    return firstTurn?.content || "conversation source";
  }

  return payload.root_path || "directory source";
}

export function buildPassThroughCandidateArtifact(
  { sourceArtifact },
  options = {}
) {
  const clock = options.clock || (() => new Date());
  const idGenerator = options.idGenerator || randomUUID;
  const summary = summarizeSourceArtifact(sourceArtifact).slice(0, options.maxSummaryChars || 160);
  const now = createContractTimestamp(clock);

  return parseCandidateArtifact({
    artifact_id: createContractId("artifact", idGenerator),
    artifact_type: "candidate_artifact",
    contract_version: SHARED_CONTRACT_VERSION,
    state: "candidate",
    namespace: sourceArtifact.namespace,
    visibility: sourceArtifact.visibility,
    title:
      options.title ||
      `${sourceArtifact.source_type}:${sourceArtifact.source_id}`,
    summary,
    source_artifact_id: sourceArtifact.artifact_id,
    evidence_refs: [sourceArtifact.artifact_id],
    fingerprint: createFingerprint({
      source_artifact_id: sourceArtifact.artifact_id,
      summary
    }),
    confidence: typeof options.confidence === "number" ? options.confidence : 0.5,
    attributes: {
      source_type: sourceArtifact.source_type,
      namespace_key: [
        sourceArtifact.namespace.tenant,
        sourceArtifact.namespace.scope,
        sourceArtifact.namespace.resource,
        sourceArtifact.namespace.key
      ].join(":")
    },
    export_hints: Array.isArray(options.exportHints) ? options.exportHints : [],
    created_at: now,
    updated_at: now
  });
}

export async function ingestDeclaredSourceToCandidate({
  declaredSource,
  sourceSystem,
  registry,
  candidateBuilder = buildPassThroughCandidateArtifact,
  decidedBy = "source-system-mvp",
  decisionMetadata = {},
  candidateOptions = {},
  idGenerator = randomUUID,
  clock = () => new Date()
}) {
  const { sourceManifest, sourceArtifact } = await sourceSystem.ingestDeclaredSource(declaredSource);
  const sourceRecord = await registry.persistSourceArtifact(sourceArtifact);
  const candidateArtifact = await candidateBuilder(
    { sourceManifest, sourceArtifact },
    candidateOptions
  );
  const candidateRecord = await registry.persistCandidateArtifact(candidateArtifact);
  const decisionTrail = await registry.recordDecisionTrail({
    decision_id: createContractId("decision", idGenerator),
    artifact_id: candidateArtifact.artifact_id,
    artifact_type: "candidate_artifact",
    namespace: candidateArtifact.namespace,
    visibility: candidateArtifact.visibility,
    from_state: "source_artifact",
    to_state: "candidate",
    decided_by: decidedBy,
    decided_at: createContractTimestamp(clock),
    reason_codes: ["source_ingested", "candidate_created"],
    evidence_refs: [sourceArtifact.artifact_id],
    metadata: decisionMetadata
  });

  return {
    sourceManifest,
    sourceArtifact,
    sourceRecord,
    candidateArtifact,
    candidateRecord,
    decisionTrail
  };
}
