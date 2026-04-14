import test from "node:test";
import assert from "node:assert/strict";

import {
  parseCandidateArtifact,
  parseDecisionTrail,
  parseExportContract,
  parseNamespace,
  parsePolicyInputArtifact,
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
  const policyInput = parsePolicyInputArtifact({
    policy_input_id: "policy_input:openclaw:artifact_stable_1",
    contract_version: "1.0.0",
    policy_contract_version: "policy-input/v1",
    consumer: "openclaw",
    namespace,
    source_artifact_id: stable.artifact_id,
    source_fingerprint: stable.fingerprint,
    signal_type: "rule",
    policy_kind: "presentation",
    polarity: "positive",
    title: stable.title,
    statement: "Keep outputs concise.",
    confidence: 0.8,
    query_match_terms: ["concise", "output"],
    effects: {
      ranking_weight: 0.16
    },
    evidence_refs: [stable.artifact_id],
    rollback: {
      mode: "ignore_policy_input"
    },
    created_at: "2026-04-11T00:00:00.000Z"
  });

  assert.equal(source.artifact_type, "source_artifact");
  assert.equal(candidate.artifact_type, "candidate_artifact");
  assert.equal(stable.artifact_type, "stable_artifact");
  assert.equal(decision.to_state, "stable");
  assert.equal(exportContract.consumer, "openclaw");
  assert.equal(policyInput.consumer, "openclaw");
});

test("artifact contracts accept accepted_action source artifacts", () => {
  const source = parseSourceArtifact({
    artifact_id: "artifact_source_action_1",
    artifact_type: "source_artifact",
    contract_version: "1.0.0",
    source_id: "source_action_1",
    source_type: "accepted_action",
    declared_by: "test",
    namespace,
    visibility: "workspace",
    locator: { kind: "accepted_action", value: "publish_site" },
    normalized_payload: {
      format: "accepted_action",
      action_type: "publish_site",
      status: "succeeded",
      accepted: true,
      execution_succeeded: true,
      text: "accepted action publish_site; status succeeded; user accepted"
    },
    raw_metadata: { source_type: "accepted_action", action_type: "publish_site" },
    fingerprint: "action123",
    ingest_run_id: "ingest_action_1",
    created_at: "2026-04-11T00:00:00.000Z"
  });

  assert.equal(source.source_type, "accepted_action");
  assert.equal(source.normalized_payload.action_type, "publish_site");
});

test("artifact contracts accept memory_intent source artifacts", () => {
  const source = parseSourceArtifact({
    artifact_id: "artifact_source_memory_intent_1",
    artifact_type: "source_artifact",
    contract_version: "1.0.0",
    source_id: "source_memory_intent_1",
    source_type: "memory_intent",
    declared_by: "test",
    namespace,
    visibility: "workspace",
    locator: { kind: "memory_intent", value: "tool_routing_preference:durable" },
    normalized_payload: {
      format: "memory_intent",
      should_write_memory: true,
      category: "tool_routing_preference",
      durability: "durable",
      confidence: 0.98,
      summary: "User wants Xiaohongshu links handled with capture_xiaohongshu_note in future conversations.",
      admission_route: "candidate_rule",
      structured_rule: {
        trigger: {
          content_kind: "xiaohongshu_link",
          domains: ["xhslink.com", "xiaohongshu.com"]
        },
        action: {
          tool: "capture_xiaohongshu_note"
        }
      },
      text: "memory intent category: tool_routing_preference"
    },
    raw_metadata: { source_type: "memory_intent", category: "tool_routing_preference" },
    fingerprint: "memoryintent123",
    ingest_run_id: "ingest_memory_intent_1",
    created_at: "2026-04-11T00:00:00.000Z"
  });

  assert.equal(source.source_type, "memory_intent");
  assert.equal(source.normalized_payload.category, "tool_routing_preference");
  assert.equal(source.normalized_payload.structured_rule.action.tool, "capture_xiaohongshu_note");
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
