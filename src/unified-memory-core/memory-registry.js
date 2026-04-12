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
import {
  calculateLearningSimilarity,
  compareLearningArtifacts,
  detectLearningConflicts,
  evaluateLearningCandidateDecay,
  evaluateLearningCandidatePromotion,
  inferLearningSignalType,
  isLearningArtifact
} from "./learning-lifecycle.js";

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

  async function reviewLearningCandidate({
    candidateArtifactId,
    referenceTime
  }) {
    const candidateRecord = await getRecord(candidateArtifactId);
    if (!candidateRecord) {
      throw new Error(`candidate artifact not found: ${candidateArtifactId}`);
    }
    if (candidateRecord.record_type !== "candidate_artifact") {
      throw new TypeError("reviewLearningCandidate requires a candidate artifact");
    }

    const candidateArtifact = parseCandidateArtifact(candidateRecord.payload);
    const namespaceKey = createNamespaceKey(candidateArtifact.namespace);
    const stableArtifacts = (await listRecords({
      recordType: "stable_artifact",
      state: "stable",
      namespaceKey
    }))
      .filter((record) => record.visibility === candidateArtifact.visibility)
      .map((record) => parseStableArtifact(record.payload));

    return evaluateLearningCandidatePromotion(candidateArtifact, {
      referenceTime,
      existingStableArtifacts: stableArtifacts
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
    const stableRecords = (await listRecords({
      recordType: "stable_artifact",
      state: "stable",
      namespaceKey
    }))
      .filter((record) => record.visibility === candidateArtifact.visibility);
    const stableArtifacts = stableRecords.map((record) => parseStableArtifact(record.payload));
    const learningCandidate = isLearningArtifact(candidateArtifact);
    const promotionReview = learningCandidate
      ? evaluateLearningCandidatePromotion(candidateArtifact, {
          referenceTime: now,
          existingStableArtifacts: stableArtifacts
        })
      : null;
    if (
      learningCandidate
      && !promotionReview.should_promote
      && !reasonCodes.includes("override_manual_promotion")
    ) {
      throw new Error(
        `learning candidate does not meet promotion rules: ${promotionReview.blocker_codes.join(", ")}`
      );
    }

    const learningComparisons = learningCandidate
      ? stableArtifacts.map((stableArtifact) => compareLearningArtifacts(candidateArtifact, stableArtifact))
      : [];
    const duplicateStableArtifactIds = new Set([
      ...(promotionReview?.duplicate_stable_artifact_ids || []),
      ...learningComparisons
        .filter((item) => item.is_duplicate)
        .map((item) => item.right.artifact_id)
    ]);
    const conflictingStableArtifactIds = new Set(promotionReview?.conflicting_stable_artifact_ids || []);
    const existingStableRecord = stableRecords.find((record) => {
      if (learningCandidate) {
        return duplicateStableArtifactIds.has(record.record_id);
      }
      return (
        record.payload?.summary === stableSummary
        || calculateStableSummarySimilarity(record.payload?.summary, stableSummary) >= 0.66
      );
    });

    if (existingStableRecord) {
      const droppedCandidateArtifact = parseCandidateArtifact({
        ...candidateArtifact,
        state: "dropped",
        attributes: {
          ...candidateArtifact.attributes,
          lifecycle_state: "dropped",
          duplicate_stable_artifact_id: existingStableRecord.record_id,
          ...(promotionReview
            ? {
                last_promotion_score: promotionReview.promotion_score,
                last_promotion_reason_codes: promotionReview.reason_codes
              }
            : {})
        },
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
        reason_codes: [
          ...new Set([
            ...reasonCodes,
            ...(promotionReview?.reason_codes || []),
            "duplicate_stable_artifact"
          ])
        ],
        evidence_refs: [candidateArtifact.artifact_id, ...candidateArtifact.evidence_refs],
        metadata: {
          reused_stable_artifact_id: existingStableRecord.record_id,
          promotion_score: promotionReview?.promotion_score
        }
      });

      return {
        stableArtifact: parseStableArtifact(existingStableRecord.payload),
        stableRecord: existingStableRecord,
        candidateRecord: droppedCandidateRecord,
        decisionTrail,
        reusedExisting: true,
        promotionReview
      };
    }

    const supersededStableArtifacts = [];
    if (learningCandidate) {
      for (const stableRecord of stableRecords) {
        if (!conflictingStableArtifactIds.has(stableRecord.record_id)) {
          continue;
        }
        supersededStableArtifacts.push(await supersedeStableArtifact({
          stableArtifactId: stableRecord.record_id,
          decidedBy,
          reasonCodes: [
            ...new Set([
              "learning_conflict_superseded",
              ...reasonCodes,
              ...(promotionReview?.reason_codes || [])
            ])
          ]
        }));
      }
    }

    const observedCandidateArtifact = parseCandidateArtifact({
      ...candidateArtifact,
      state: "observation",
      attributes: {
        ...candidateArtifact.attributes,
        lifecycle_state: "observation",
        ...(promotionReview
          ? {
              last_promotion_score: promotionReview.promotion_score,
              last_promotion_reason_codes: promotionReview.reason_codes,
              last_promotion_reviewed_at: now
            }
          : {})
      },
      updated_at: now
    });
    const observedCandidateRecord = await persistCandidateArtifact(observedCandidateArtifact);
    const candidateDecisionTrail = await recordDecisionTrail({
      decision_id: createContractId("decision", idGenerator),
      artifact_id: observedCandidateArtifact.artifact_id,
      artifact_type: "candidate_artifact",
      namespace: observedCandidateArtifact.namespace,
      visibility: observedCandidateArtifact.visibility,
      from_state: candidateRecord.state,
      to_state: "observation",
      decided_by: decidedBy,
      decided_at: now,
      reason_codes: [
        ...new Set([
          ...reasonCodes,
          ...(promotionReview?.reason_codes || []),
          "promotion_review_passed"
        ])
      ],
      evidence_refs: [candidateArtifact.artifact_id, ...candidateArtifact.evidence_refs],
      metadata: {
        promotion_score: promotionReview?.promotion_score,
        signal_type: inferLearningSignalType(candidateArtifact)
      }
    });

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
      attributes: {
        ...candidateArtifact.attributes,
        lifecycle_state: "stable",
        ...(promotionReview
          ? {
              promotion_score: promotionReview.promotion_score,
              promotion_reason_codes: promotionReview.reason_codes,
              promotion_reviewed_at: now
            }
          : {}),
        ...(supersededStableArtifacts.length > 0
          ? {
              superseded_stable_artifact_ids: supersededStableArtifacts.map(
                (item) => item.stableArtifact.artifact_id
              )
            }
          : {})
      },
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
      reason_codes: [
        ...new Set([
          ...reasonCodes,
          ...(promotionReview?.reason_codes || [])
        ])
      ],
      evidence_refs: [candidateArtifact.artifact_id, ...candidateArtifact.evidence_refs],
      metadata: {
        source_candidate_id: candidateArtifact.artifact_id,
        promotion_score: promotionReview?.promotion_score,
        superseded_stable_artifact_ids: supersededStableArtifacts.map(
          (item) => item.stableArtifact.artifact_id
        )
      }
    });

    return {
      stableArtifact,
      stableRecord,
      candidateRecord: observedCandidateRecord,
      candidateDecisionTrail,
      decisionTrail,
      reusedExisting: false,
      supersededStableArtifacts,
      promotionReview,
      learningComparisons
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

  async function applyLearningDecay({
    namespace,
    namespaceKey,
    candidateArtifactIds,
    decidedBy,
    dryRun = false,
    referenceTime
  } = {}) {
    const targetNamespaceKey = namespaceKey || (namespace ? createNamespaceKey(namespace) : "");
    const records = await listRecords({
      recordType: "candidate_artifact"
    });
    const items = records
      .filter((record) => record.state === "candidate" || record.state === "observation")
      .filter((record) => !targetNamespaceKey || createNamespaceKey(record.namespace) === targetNamespaceKey)
      .filter((record) => !Array.isArray(candidateArtifactIds) || candidateArtifactIds.length === 0 || candidateArtifactIds.includes(record.record_id))
      .map((record) => ({
        record,
        artifact: parseCandidateArtifact(record.payload)
      }))
      .filter(({ artifact }) => isLearningArtifact(artifact));

    const decayedCandidates = [];
    for (const item of items) {
      const decayReview = evaluateLearningCandidateDecay(item.artifact, {
        referenceTime
      });
      if (!decayReview.should_decay) {
        continue;
      }

      const now = createMonotonicTimestamp(clock, [
        item.artifact.created_at,
        item.artifact.updated_at
      ]);
      if (dryRun) {
        decayedCandidates.push({
          candidateArtifact: item.artifact,
          decayReview
        });
        continue;
      }

      const droppedArtifact = parseCandidateArtifact({
        ...item.artifact,
        state: "dropped",
        attributes: {
          ...item.artifact.attributes,
          lifecycle_state: "dropped",
          decay_reason_codes: decayReview.reason_codes,
          decay_reviewed_at: now
        },
        updated_at: now
      });
      const candidateRecord = await persistCandidateArtifact(droppedArtifact);
      const decisionTrail = await recordDecisionTrail({
        decision_id: createContractId("decision", idGenerator),
        artifact_id: droppedArtifact.artifact_id,
        artifact_type: "candidate_artifact",
        namespace: droppedArtifact.namespace,
        visibility: droppedArtifact.visibility,
        from_state: item.record.state,
        to_state: "dropped",
        decided_by: decidedBy || "learning-decay",
        decided_at: now,
        reason_codes: decayReview.reason_codes,
        evidence_refs: [droppedArtifact.artifact_id, ...droppedArtifact.evidence_refs],
        metadata: {
          age_days: decayReview.age_days,
          weak_confidence_threshold: decayReview.weak_confidence_threshold
        }
      });
      decayedCandidates.push({
        candidateArtifact: droppedArtifact,
        candidateRecord,
        decisionTrail,
        decayReview
      });
    }

    return decayedCandidates;
  }

  async function detectLifecycleConflicts({
    namespace,
    namespaceKey,
    includeSuperseded = false
  } = {}) {
    const targetNamespaceKey = namespaceKey || (namespace ? createNamespaceKey(namespace) : "");
    const records = await listRecords();
    const relevantRecords = records.filter((record) => {
      if (!targetNamespaceKey) {
        return true;
      }
      return createNamespaceKey(record.namespace) === targetNamespaceKey;
    });
    return detectLearningConflicts(relevantRecords, {
      includeSuperseded
    });
  }

  async function processLearningLifecycle({
    namespace,
    namespaceKey,
    decidedBy = "learning-lifecycle",
    autoPromote = true,
    applyDecay = true,
    dryRun = false,
    referenceTime
  } = {}) {
    const targetNamespaceKey = namespaceKey || (namespace ? createNamespaceKey(namespace) : "");
    const candidateRecords = await listRecords({
      recordType: "candidate_artifact"
    });
    const candidateArtifacts = candidateRecords
      .filter((record) => record.state === "candidate" || record.state === "observation")
      .filter((record) => !targetNamespaceKey || createNamespaceKey(record.namespace) === targetNamespaceKey)
      .map((record) => parseCandidateArtifact(record.payload))
      .filter((artifact) => isLearningArtifact(artifact));

    const reviews = [];
    const promotedStableArtifacts = [];
    const reusedStableArtifacts = [];

    for (const candidateArtifact of candidateArtifacts) {
      const review = await reviewLearningCandidate({
        candidateArtifactId: candidateArtifact.artifact_id,
        referenceTime
      });
      reviews.push({
        candidate_artifact_id: candidateArtifact.artifact_id,
        ...review
      });
      if (!autoPromote || !review.should_promote || dryRun) {
        continue;
      }
      const promotion = await promoteCandidateToStable({
        candidateArtifactId: candidateArtifact.artifact_id,
        decidedBy,
        reasonCodes: [
          "learning_lifecycle_promotion",
          ...review.reason_codes
        ]
      });
      if (promotion.reusedExisting) {
        reusedStableArtifacts.push(promotion);
      } else {
        promotedStableArtifacts.push(promotion);
      }
    }

    const decayedCandidates = applyDecay
      ? await applyLearningDecay({
          namespace,
          namespaceKey: targetNamespaceKey,
          decidedBy,
          dryRun,
          referenceTime
        })
      : [];
    const conflicts = await detectLifecycleConflicts({
      namespace,
      namespaceKey: targetNamespaceKey
    });

    return {
      reviews,
      promotedStableArtifacts,
      reusedStableArtifacts,
      decayedCandidates,
      conflicts
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
    reviewLearningCandidate,
    promoteCandidateToStable,
    supersedeStableArtifact,
    applyLearningDecay,
    detectLifecycleConflicts,
    processLearningLifecycle,
    getStats
  };
}
