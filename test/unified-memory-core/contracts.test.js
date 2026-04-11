import test from "node:test";
import assert from "node:assert/strict";

import {
  parseCandidateArtifact,
  parseDecisionTrail,
  parseExportContract,
  parseNamespace,
  parseSourceArtifact,
  parseStableArtifact
} from "../../src/unified-memory-core/contracts.js";

const namespace = {
  tenant: "local",
  scope: "workspace",
  resource: "unified-memory-core",
  key: "main"
};

test("parseNamespace accepts a governed namespace shape", () => {
  assert.deepEqual(parseNamespace(namespace), namespace);
});

test("artifact contracts validate source, candidate, stable, and export shapes", () => {
  const source = parseSourceArtifact({
    artifact_id: "artifact_source_1",
    artifact_type: "source_artifact",
    contract_version: "1.0.0",
    source_id: "source_1",
    source_type: "manual",
    declared_by: "test",
    namespace,
    visibility: "private",
    locator: { kind: "inline", value: "manual" },
    normalized_payload: { format: "text", text: "hello" },
    raw_metadata: { source_type: "manual" },
    fingerprint: "abc123",
    ingest_run_id: "ingest_1",
    created_at: "2026-04-11T00:00:00.000Z"
  });

  const candidate = parseCandidateArtifact({
    artifact_id: "artifact_candidate_1",
    artifact_type: "candidate_artifact",
    contract_version: "1.0.0",
    state: "candidate",
    namespace,
    visibility: "workspace",
    title: "manual candidate",
    summary: "hello",
    source_artifact_id: source.artifact_id,
    evidence_refs: [source.artifact_id],
    fingerprint: "def456",
    confidence: 0.8,
    attributes: { kind: "mvp" },
    created_at: "2026-04-11T00:00:00.000Z",
    updated_at: "2026-04-11T00:00:00.000Z"
  });

  const stable = parseStableArtifact({
    artifact_id: "artifact_stable_1",
    artifact_type: "stable_artifact",
    contract_version: "1.0.0",
    state: "stable",
    namespace,
    visibility: "shared",
    title: "stable memory",
    summary: "hello",
    source_candidate_id: candidate.artifact_id,
    evidence_refs: [candidate.artifact_id, source.artifact_id],
    fingerprint: "ghi789",
    attributes: { kind: "mvp" },
    created_at: "2026-04-11T00:00:00.000Z",
    updated_at: "2026-04-11T00:00:00.000Z"
  });

  const decision = parseDecisionTrail({
    decision_id: "decision_1",
    artifact_id: stable.artifact_id,
    artifact_type: "stable_artifact",
    namespace,
    visibility: "shared",
    from_state: "observation",
    to_state: "stable",
    decided_by: "test",
    decided_at: "2026-04-11T00:00:00.000Z",
    reason_codes: ["approved"],
    evidence_refs: [candidate.artifact_id]
  });

  const exportContract = parseExportContract({
    export_id: "export_1",
    contract_version: "1.0.0",
    consumer: "openclaw",
    namespace,
    visibility: "workspace",
    artifact_refs: [stable.artifact_id],
    generated_at: "2026-04-11T00:00:00.000Z"
  });

  assert.equal(source.artifact_type, "source_artifact");
  assert.equal(candidate.artifact_type, "candidate_artifact");
  assert.equal(stable.artifact_type, "stable_artifact");
  assert.equal(decision.to_state, "stable");
  assert.equal(exportContract.consumer, "openclaw");
});

test("contracts reject invalid visibility", () => {
  assert.throws(
    () =>
      parseCandidateArtifact({
        artifact_id: "artifact_candidate_1",
        artifact_type: "candidate_artifact",
        contract_version: "1.0.0",
        state: "candidate",
        namespace,
        visibility: "team-only",
        title: "manual candidate",
        summary: "hello",
        source_artifact_id: "artifact_source_1",
        evidence_refs: ["artifact_source_1"],
        fingerprint: "def456",
        created_at: "2026-04-11T00:00:00.000Z",
        updated_at: "2026-04-11T00:00:00.000Z"
      }),
    /visibility/
  );
});
