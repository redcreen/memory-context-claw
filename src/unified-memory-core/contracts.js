import { randomUUID } from "node:crypto";

export const SHARED_CONTRACT_VERSION = "1.0.0";

export const SOURCE_TYPES = ["manual", "file", "directory", "conversation"];
export const VISIBILITY_LEVELS = ["private", "workspace", "shared", "public"];
export const REGISTRY_STATES = [
  "source_artifact",
  "candidate",
  "observation",
  "stable",
  "dropped",
  "superseded"
];
export const ARTIFACT_TYPES = [
  "source_artifact",
  "candidate_artifact",
  "stable_artifact"
];

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertPlainObject(value, label) {
  if (!isPlainObject(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function assertStringArray(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array`);
  }
  return value.map((item, index) => assertNonEmptyString(item, `${label}[${index}]`));
}

function assertTimestamp(value, label) {
  const normalized = assertNonEmptyString(value, label);
  if (Number.isNaN(Date.parse(normalized))) {
    throw new TypeError(`${label} must be a valid timestamp`);
  }
  return normalized;
}

function assertOptionalNumber(value, label) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new TypeError(`${label} must be a number`);
  }
  return value;
}

function assertOptionalObject(value, label) {
  if (value === undefined || value === null) {
    return {};
  }
  assertPlainObject(value, label);
  return value;
}

export function createNamespaceKey(namespace) {
  const parsed = parseNamespace(namespace);
  return [parsed.tenant, parsed.scope, parsed.resource, parsed.key].join(":");
}

export function parseVisibility(value) {
  const normalized = assertNonEmptyString(value, "visibility");
  if (!VISIBILITY_LEVELS.includes(normalized)) {
    throw new TypeError(
      `visibility must be one of ${VISIBILITY_LEVELS.join(", ")}`
    );
  }
  return normalized;
}

export function parseNamespace(value) {
  assertPlainObject(value, "namespace");
  const tenant = assertNonEmptyString(value.tenant, "namespace.tenant");
  const scope = assertNonEmptyString(value.scope, "namespace.scope");
  const resource = assertNonEmptyString(value.resource, "namespace.resource");
  const key = assertNonEmptyString(value.key, "namespace.key");
  const host = value.host === undefined ? "" : String(value.host).trim();

  return {
    tenant,
    scope,
    resource,
    key,
    ...(host ? { host } : {})
  };
}

export function parseExportContract(value) {
  assertPlainObject(value, "export_contract");
  return {
    export_id: assertNonEmptyString(value.export_id, "export_contract.export_id"),
    contract_version: assertNonEmptyString(
      value.contract_version,
      "export_contract.contract_version"
    ),
    consumer: assertNonEmptyString(value.consumer, "export_contract.consumer"),
    namespace: parseNamespace(value.namespace),
    visibility: parseVisibility(value.visibility),
    artifact_refs: assertStringArray(value.artifact_refs, "export_contract.artifact_refs"),
    generated_at: assertTimestamp(value.generated_at, "export_contract.generated_at"),
    metadata: assertOptionalObject(value.metadata, "export_contract.metadata")
  };
}

export function parseSourceArtifact(value) {
  assertPlainObject(value, "source_artifact");
  const sourceType = assertNonEmptyString(value.source_type, "source_artifact.source_type");
  if (!SOURCE_TYPES.includes(sourceType)) {
    throw new TypeError(`source_artifact.source_type must be one of ${SOURCE_TYPES.join(", ")}`);
  }

  return {
    artifact_id: assertNonEmptyString(value.artifact_id, "source_artifact.artifact_id"),
    artifact_type: "source_artifact",
    contract_version: assertNonEmptyString(
      value.contract_version,
      "source_artifact.contract_version"
    ),
    source_id: assertNonEmptyString(value.source_id, "source_artifact.source_id"),
    source_type: sourceType,
    declared_by: assertNonEmptyString(value.declared_by, "source_artifact.declared_by"),
    namespace: parseNamespace(value.namespace),
    visibility: parseVisibility(value.visibility),
    locator: assertOptionalObject(value.locator, "source_artifact.locator"),
    normalized_payload: assertOptionalObject(
      value.normalized_payload,
      "source_artifact.normalized_payload"
    ),
    raw_metadata: assertOptionalObject(value.raw_metadata, "source_artifact.raw_metadata"),
    fingerprint: assertNonEmptyString(value.fingerprint, "source_artifact.fingerprint"),
    ingest_run_id: assertNonEmptyString(value.ingest_run_id, "source_artifact.ingest_run_id"),
    created_at: assertTimestamp(value.created_at, "source_artifact.created_at"),
    export_hints: Array.isArray(value.export_hints) ? [...value.export_hints] : []
  };
}

export function parseCandidateArtifact(value) {
  assertPlainObject(value, "candidate_artifact");
  const state = assertNonEmptyString(value.state, "candidate_artifact.state");
  if (!["candidate", "observation", "dropped"].includes(state)) {
    throw new TypeError("candidate_artifact.state must be candidate, observation, or dropped");
  }

  return {
    artifact_id: assertNonEmptyString(value.artifact_id, "candidate_artifact.artifact_id"),
    artifact_type: "candidate_artifact",
    contract_version: assertNonEmptyString(
      value.contract_version,
      "candidate_artifact.contract_version"
    ),
    state,
    namespace: parseNamespace(value.namespace),
    visibility: parseVisibility(value.visibility),
    title: assertNonEmptyString(value.title, "candidate_artifact.title"),
    summary: assertNonEmptyString(value.summary, "candidate_artifact.summary"),
    source_artifact_id: assertNonEmptyString(
      value.source_artifact_id,
      "candidate_artifact.source_artifact_id"
    ),
    evidence_refs: assertStringArray(value.evidence_refs, "candidate_artifact.evidence_refs"),
    fingerprint: assertNonEmptyString(value.fingerprint, "candidate_artifact.fingerprint"),
    confidence: assertOptionalNumber(value.confidence, "candidate_artifact.confidence") ?? 0,
    attributes: assertOptionalObject(value.attributes, "candidate_artifact.attributes"),
    export_hints: Array.isArray(value.export_hints) ? [...value.export_hints] : [],
    created_at: assertTimestamp(value.created_at, "candidate_artifact.created_at"),
    updated_at: assertTimestamp(value.updated_at, "candidate_artifact.updated_at")
  };
}

export function parseStableArtifact(value) {
  assertPlainObject(value, "stable_artifact");
  const state = assertNonEmptyString(value.state, "stable_artifact.state");
  if (!["stable", "observation", "superseded"].includes(state)) {
    throw new TypeError("stable_artifact.state must be stable, observation, or superseded");
  }

  return {
    artifact_id: assertNonEmptyString(value.artifact_id, "stable_artifact.artifact_id"),
    artifact_type: "stable_artifact",
    contract_version: assertNonEmptyString(
      value.contract_version,
      "stable_artifact.contract_version"
    ),
    state,
    namespace: parseNamespace(value.namespace),
    visibility: parseVisibility(value.visibility),
    title: assertNonEmptyString(value.title, "stable_artifact.title"),
    summary: assertNonEmptyString(value.summary, "stable_artifact.summary"),
    source_candidate_id: assertNonEmptyString(
      value.source_candidate_id,
      "stable_artifact.source_candidate_id"
    ),
    evidence_refs: assertStringArray(value.evidence_refs, "stable_artifact.evidence_refs"),
    fingerprint: assertNonEmptyString(value.fingerprint, "stable_artifact.fingerprint"),
    attributes: assertOptionalObject(value.attributes, "stable_artifact.attributes"),
    export_hints: Array.isArray(value.export_hints) ? [...value.export_hints] : [],
    created_at: assertTimestamp(value.created_at, "stable_artifact.created_at"),
    updated_at: assertTimestamp(value.updated_at, "stable_artifact.updated_at")
  };
}

export function parseDecisionTrail(value) {
  assertPlainObject(value, "decision_trail");
  const fromState = assertNonEmptyString(value.from_state, "decision_trail.from_state");
  const toState = assertNonEmptyString(value.to_state, "decision_trail.to_state");
  if (!REGISTRY_STATES.includes(fromState)) {
    throw new TypeError("decision_trail.from_state is invalid");
  }
  if (!REGISTRY_STATES.includes(toState)) {
    throw new TypeError("decision_trail.to_state is invalid");
  }

  return {
    decision_id: assertNonEmptyString(value.decision_id, "decision_trail.decision_id"),
    artifact_id: assertNonEmptyString(value.artifact_id, "decision_trail.artifact_id"),
    artifact_type: assertNonEmptyString(value.artifact_type, "decision_trail.artifact_type"),
    namespace: parseNamespace(value.namespace),
    visibility: parseVisibility(value.visibility),
    from_state: fromState,
    to_state: toState,
    decided_by: assertNonEmptyString(value.decided_by, "decision_trail.decided_by"),
    decided_at: assertTimestamp(value.decided_at, "decision_trail.decided_at"),
    reason_codes: assertStringArray(value.reason_codes, "decision_trail.reason_codes"),
    evidence_refs: assertStringArray(value.evidence_refs, "decision_trail.evidence_refs"),
    metadata: assertOptionalObject(value.metadata, "decision_trail.metadata")
  };
}

export function parseRegistryRecord(value) {
  assertPlainObject(value, "registry_record");
  const recordType = assertNonEmptyString(value.record_type, "registry_record.record_type");
  const state = assertNonEmptyString(value.state, "registry_record.state");
  if (!REGISTRY_STATES.includes(state)) {
    throw new TypeError(`registry_record.state must be one of ${REGISTRY_STATES.join(", ")}`);
  }

  return {
    record_id: assertNonEmptyString(value.record_id, "registry_record.record_id"),
    record_type: recordType,
    state,
    namespace: parseNamespace(value.namespace),
    visibility: parseVisibility(value.visibility),
    evidence_refs: assertStringArray(value.evidence_refs, "registry_record.evidence_refs"),
    created_at: assertTimestamp(value.created_at, "registry_record.created_at"),
    updated_at: assertTimestamp(value.updated_at, "registry_record.updated_at"),
    payload: assertOptionalObject(value.payload, "registry_record.payload")
  };
}

export function createContractTimestamp(clock = () => new Date()) {
  return clock().toISOString();
}

export function createContractId(prefix, idGenerator = randomUUID) {
  return `${assertNonEmptyString(prefix, "prefix")}_${idGenerator()}`;
}
