import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

import {
  SHARED_CONTRACT_VERSION,
  createContractId,
  createContractTimestamp,
  createNamespaceKey,
  parseCandidateArtifact,
  parseDecisionTrail,
  parseRegistryRecord,
  parseSourceArtifact,
  parseStableArtifact
} from "./contracts.js";

const ALLOWED_RECORD_STATE_BY_TYPE = {
  source_artifact: new Set(["source_artifact"]),
  candidate_artifact: new Set(["candidate", "observation", "dropped"]),
  stable_artifact: new Set(["stable", "observation", "superseded"])
};

function createFingerprint(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function normalizeStableDedupText(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[`"'“”‘’]/gu, "")
    .replace(/[\s.,!?;:，。！？；：（）()\-_/\\]+/gu, "");
}

function createCharacterBigrams(text = "") {
  const normalized = normalizeStableDedupText(text);
  if (normalized.length < 2) {
    return new Set(normalized ? [normalized] : []);
  }
  const grams = new Set();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    grams.add(normalized.slice(index, index + 2));
  }
  return grams;
}

function calculateStableSummarySimilarity(left, right) {
  const leftGrams = createCharacterBigrams(left);
  const rightGrams = createCharacterBigrams(right);
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

function createMonotonicTimestamp(clock, previousTimestamps = []) {
  const current = Date.parse(createContractTimestamp(clock));
  const previous = previousTimestamps
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value));
  const floor = previous.length > 0 ? Math.max(...previous) + 1 : current;
  return new Date(Math.max(current, floor)).toISOString();
}

async function ensureParentDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function appendJsonLine(filePath, value) {
  await ensureParentDirectory(filePath);
  await fs.appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

async function readJsonLines(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function validateRecordState(recordType, state) {
  const allowedStates = ALLOWED_RECORD_STATE_BY_TYPE[recordType];
  if (!allowedStates || !allowedStates.has(state)) {
    throw new TypeError(`state ${state} is invalid for record type ${recordType}`);
  }
}

function validateTransition(previousState, nextState) {
  if (previousState === nextState) {
    return;
  }
  const transitions = {
    candidate: new Set(["observation", "dropped"]),
    observation: new Set(["stable", "dropped"]),
    stable: new Set(["observation", "superseded"])
  };

  if (!transitions[previousState] || !transitions[previousState].has(nextState)) {
    throw new TypeError(`invalid lifecycle transition: ${previousState} -> ${nextState}`);
  }
}

function toRegistryRecord({ artifact, recordType, state }) {
  return parseRegistryRecord({
    record_id: artifact.artifact_id,
    record_type: recordType,
    state,
    namespace: artifact.namespace,
    visibility: artifact.visibility,
    evidence_refs: artifact.evidence_refs || [artifact.artifact_id],
    created_at: artifact.created_at,
    updated_at: artifact.updated_at || artifact.created_at,
    payload: artifact
  });
}

export function createMemoryRegistry(options = {}) {
  const registryRoot = path.resolve(options.rootDir || path.join(process.cwd(), ".umc-registry"));
  const clock = options.clock || (() => new Date());
  const idGenerator = options.idGenerator || randomUUID;
  const recordsPath = path.join(registryRoot, "records.jsonl");
  const decisionTrailsPath = path.join(registryRoot, "decision-trails.jsonl");

  async function listRecords(filters = {}) {
    const entries = (await readJsonLines(recordsPath)).map((entry) => parseRegistryRecord(entry));
    const latestById = new Map();

    for (const entry of entries) {
      const previous = latestById.get(entry.record_id);
      if (!previous || previous.updated_at <= entry.updated_at) {
        latestById.set(entry.record_id, entry);
      }
    }

    return [...latestById.values()].filter((entry) => {
      if (filters.recordType && entry.record_type !== filters.recordType) {
        return false;
      }
      if (filters.state && entry.state !== filters.state) {
        return false;
      }
      if (filters.namespaceKey) {
        const currentKey = [
          entry.namespace.tenant,
          entry.namespace.scope,
          entry.namespace.resource,
          entry.namespace.key
        ].join(":");
        if (currentKey !== filters.namespaceKey) {
          return false;
        }
      }
      return true;
    });
  }

  async function getRecord(recordId) {
    const records = await listRecords();
    return records.find((entry) => entry.record_id === recordId) || null;
  }

  async function persistArtifact(artifact, parser) {
    const parsedArtifact = parser(artifact);
    const state = parsedArtifact.state || parsedArtifact.artifact_type;
    validateRecordState(parsedArtifact.artifact_type, state);

    const previous = await getRecord(parsedArtifact.artifact_id);
    if (previous) {
      if (previous.record_type !== parsedArtifact.artifact_type) {
        throw new TypeError("record type cannot change once persisted");
      }
      validateTransition(previous.state, state);
    }

    const record = toRegistryRecord({
      artifact: parsedArtifact,
      recordType: parsedArtifact.artifact_type,
      state
    });

    await appendJsonLine(recordsPath, record);
    return record;
  }

  async function persistSourceArtifact(artifact) {
    return persistArtifact(artifact, parseSourceArtifact);
  }

  async function persistCandidateArtifact(artifact) {
    return persistArtifact(artifact, parseCandidateArtifact);
  }

  async function persistStableArtifact(artifact) {
    return persistArtifact(artifact, parseStableArtifact);
  }

  async function recordDecisionTrail(trail) {
    const parsed = parseDecisionTrail(trail);
    await appendJsonLine(decisionTrailsPath, parsed);
    return parsed;
  }

  async function listDecisionTrails(filters = {}) {
    const trails = (await readJsonLines(decisionTrailsPath)).map((entry) => parseDecisionTrail(entry));
    return trails.filter((trail) => {
      if (filters.artifactId && trail.artifact_id !== filters.artifactId) {
        return false;
      }
      if (filters.toState && trail.to_state !== filters.toState) {
        return false;
      }
      return true;
    });
  }

  async function promoteCandidateToStable({
    candidateArtifactId,
    decidedBy,
    reasonCodes = ["manual_promotion"],
    summary,
    title,
    exportHints
  }) {
    const candidateRecord = await getRecord(candidateArtifactId);
    if (!candidateRecord) {
      throw new Error(`candidate artifact not found: ${candidateArtifactId}`);
    }
    if (candidateRecord.record_type !== "candidate_artifact") {
      throw new TypeError("promoteCandidateToStable requires a candidate artifact");
    }

    const candidateArtifact = parseCandidateArtifact(candidateRecord.payload);
    const now = createMonotonicTimestamp(clock, [
      candidateArtifact.created_at,
      candidateArtifact.updated_at
    ]);
    const stableTitle = title || candidateArtifact.title;
    const stableSummary = summary || candidateArtifact.summary;
    const namespaceKey = createNamespaceKey(candidateArtifact.namespace);
    const existingStableRecord = (await listRecords({
      recordType: "stable_artifact",
      state: "stable",
      namespaceKey
    })).find((record) =>
      record.visibility === candidateArtifact.visibility &&
      (
        record.payload?.summary === stableSummary
        || calculateStableSummarySimilarity(record.payload?.summary, stableSummary) >= 0.66
      )
    );

    if (existingStableRecord) {
      const droppedCandidateArtifact = parseCandidateArtifact({
        ...candidateArtifact,
        state: "dropped",
        updated_at: now
      });
      const droppedCandidateRecord = await persistCandidateArtifact(droppedCandidateArtifact);
      const decisionTrail = await recordDecisionTrail({
        decision_id: createContractId("decision", idGenerator),
        artifact_id: candidateArtifact.artifact_id,
        artifact_type: "candidate_artifact",
        namespace: candidateArtifact.namespace,
        visibility: candidateArtifact.visibility,
        from_state: candidateRecord.state,
        to_state: "dropped",
        decided_by: decidedBy,
        decided_at: now,
        reason_codes: [...reasonCodes, "duplicate_stable_artifact"],
        evidence_refs: [candidateArtifact.artifact_id, ...candidateArtifact.evidence_refs],
        metadata: {
          reused_stable_artifact_id: existingStableRecord.record_id
        }
      });

      return {
        stableArtifact: parseStableArtifact(existingStableRecord.payload),
        stableRecord: existingStableRecord,
        candidateRecord: droppedCandidateRecord,
        decisionTrail,
        reusedExisting: true
      };
    }

    const stableArtifact = parseStableArtifact({
      artifact_id: createContractId("artifact", idGenerator),
      artifact_type: "stable_artifact",
      contract_version: SHARED_CONTRACT_VERSION,
      state: "stable",
      namespace: candidateArtifact.namespace,
      visibility: candidateArtifact.visibility,
      title: stableTitle,
      summary: stableSummary,
      source_candidate_id: candidateArtifact.artifact_id,
      evidence_refs: candidateArtifact.evidence_refs,
      fingerprint: createFingerprint({
        source_candidate_id: candidateArtifact.artifact_id,
        title: stableTitle,
        summary: stableSummary
      }),
      attributes: candidateArtifact.attributes,
      export_hints: Array.isArray(exportHints) ? exportHints : candidateArtifact.export_hints,
      created_at: now,
      updated_at: now
    });

    const stableRecord = await persistStableArtifact(stableArtifact);
    const decisionTrail = await recordDecisionTrail({
      decision_id: createContractId("decision", idGenerator),
      artifact_id: stableArtifact.artifact_id,
      artifact_type: "stable_artifact",
      namespace: stableArtifact.namespace,
      visibility: stableArtifact.visibility,
      from_state: "observation",
      to_state: "stable",
      decided_by: decidedBy,
      decided_at: now,
      reason_codes: reasonCodes,
      evidence_refs: [candidateArtifact.artifact_id, ...candidateArtifact.evidence_refs],
      metadata: {
        source_candidate_id: candidateArtifact.artifact_id
      }
    });

    return {
      stableArtifact,
      stableRecord,
      decisionTrail,
      reusedExisting: false
    };
  }

  async function supersedeStableArtifact({
    stableArtifactId,
    decidedBy,
    reasonCodes = ["manual_supersede"]
  }) {
    const stableRecord = await getRecord(stableArtifactId);
    if (!stableRecord) {
      throw new Error(`stable artifact not found: ${stableArtifactId}`);
    }
    if (stableRecord.record_type !== "stable_artifact") {
      throw new TypeError("supersedeStableArtifact requires a stable artifact");
    }

    const stableArtifact = parseStableArtifact(stableRecord.payload);
    const now = createMonotonicTimestamp(clock, [
      stableArtifact.created_at,
      stableArtifact.updated_at
    ]);
    const supersededArtifact = parseStableArtifact({
      ...stableArtifact,
      state: "superseded",
      updated_at: now
    });

    const nextRecord = await persistStableArtifact(supersededArtifact);
    const decisionTrail = await recordDecisionTrail({
      decision_id: createContractId("decision", idGenerator),
      artifact_id: supersededArtifact.artifact_id,
      artifact_type: "stable_artifact",
      namespace: supersededArtifact.namespace,
      visibility: supersededArtifact.visibility,
      from_state: stableRecord.state,
      to_state: "superseded",
      decided_by: decidedBy,
      decided_at: now,
      reason_codes: reasonCodes,
      evidence_refs: [stableArtifact.source_candidate_id, ...stableArtifact.evidence_refs],
      metadata: {
        source_candidate_id: stableArtifact.source_candidate_id
      }
    });

    return {
      stableArtifact: supersededArtifact,
      stableRecord: nextRecord,
      decisionTrail
    };
  }

  async function getStats() {
    const records = await listRecords();
    const decisionTrails = await listDecisionTrails();
    return {
      registry_root: registryRoot,
      record_count: records.length,
      decision_trail_count: decisionTrails.length
    };
  }

  return {
    registryRoot,
    persistSourceArtifact,
    persistCandidateArtifact,
    persistStableArtifact,
    recordDecisionTrail,
    listRecords,
    getRecord,
    listDecisionTrails,
    promoteCandidateToStable,
    supersedeStableArtifact,
    getStats
  };
}
