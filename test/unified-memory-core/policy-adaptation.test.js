import test from "node:test";
import assert from "node:assert/strict";

import { parseStableArtifact } from "../../src/unified-memory-core/contracts.js";
import {
  applyPolicyToMemoryItems,
  applyPolicyToScoredCandidates,
  buildPolicyProjection,
  createPolicyContext
} from "../../src/unified-memory-core/policy-adaptation.js";

function createStableLearningArtifact({
  artifactId,
  title,
  summary,
  polarity = "positive",
  signalType = "preference"
}) {
  return parseStableArtifact({
    artifact_id: artifactId,
    artifact_type: "stable_artifact",
    contract_version: "1.0.0",
    state: "stable",
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "openclaw-shared-memory",
      key: "policy-demo"
    },
    visibility: "workspace",
    title,
    summary,
    source_candidate_id: `candidate_${artifactId}`,
    evidence_refs: [`candidate_${artifactId}`],
    fingerprint: `fingerprint_${artifactId}`,
    attributes: {
      learning_signal_type: signalType,
      learning_polarity: polarity,
      learning_topic_signature: summary.toLowerCase().replace(/\W+/g, "").slice(0, 24),
      promotion_score: 0.88
    },
    export_hints: [`learning:${signalType}`],
    created_at: "2026-04-12T00:00:00.000Z",
    updated_at: "2026-04-12T00:00:00.000Z"
  });
}

test("policy projection creates deterministic policy inputs from stable learning artifacts", () => {
  const projection = buildPolicyProjection({
    consumer: "openclaw",
    artifacts: [
      createStableLearningArtifact({
        artifactId: "artifact_concise",
        title: "preference:concise-progress",
        summary: "The user prefers concise progress reports."
      }),
      createStableLearningArtifact({
        artifactId: "artifact_guardrail",
        title: "rule:no-hardcode",
        summary: "Do not hardcode brittle implementation choices.",
        polarity: "negative",
        signalType: "rule"
      })
    ]
  });

  assert.equal(projection.policy_inputs.length, 2);
  assert.equal(projection.policy_contract_version, "policy-input/v1");
  assert.equal(projection.policy_summary.compact_mode_inputs, 1);
  assert.equal(projection.policy_summary.guardrail_inputs, 1);
});

test("policy context validates export policy inputs and surfaces compact-mode guidance", () => {
  const projection = buildPolicyProjection({
    consumer: "codex",
    artifacts: [
      createStableLearningArtifact({
        artifactId: "artifact_concise",
        title: "preference:concise-progress",
        summary: "The user prefers concise progress reports."
      })
    ]
  });

  const context = createPolicyContext({
    exportResults: [
      {
        exportContract: {
          artifact_refs: ["artifact_concise"]
        },
        payload: {
          policy_inputs: projection.policy_inputs
        }
      }
    ],
    consumer: "codex"
  });

  assert.equal(context.enabled, true);
  assert.equal(context.supporting_context_mode, "compact");
  assert.match(context.policy_block, /Governed Policy Guidance/);
});

test("policy adaptation boosts relevant governed candidates and keeps codex memory compact", () => {
  const projection = buildPolicyProjection({
    consumer: "openclaw",
    artifacts: [
      createStableLearningArtifact({
        artifactId: "artifact_concise",
        title: "preference:concise-progress",
        summary: "The user prefers concise progress reports."
      }),
      createStableLearningArtifact({
        artifactId: "artifact_guardrail",
        title: "rule:no-hardcode",
        summary: "Do not hardcode brittle implementation choices.",
        polarity: "negative",
        signalType: "rule"
      })
    ]
  });

  const context = createPolicyContext({
    exportResults: [
      {
        exportContract: {
          artifact_refs: ["artifact_concise", "artifact_guardrail"]
        },
        payload: {
          policy_inputs: projection.policy_inputs
        }
      }
    ],
    consumer: "openclaw"
  });

  const scored = applyPolicyToScoredCandidates(
    [
      {
        path: "umc://openclaw-export/artifact_concise",
        canonicalPath: "umc://openclaw-export/artifact_concise",
        pathKind: "governedArtifact",
        snippet: "The user prefers concise progress reports.",
        weightedScore: 0.4,
        finalScore: 0.4
      },
      {
        path: "/tmp/notes.md",
        canonicalPath: "/tmp/notes.md",
        pathKind: "workspaceDoc",
        snippet: "Hardcoded quick fix without tests.",
        weightedScore: 0.42,
        finalScore: 0.42
      }
    ],
    {
      policyContext: context,
      query: "给我一个简洁的项目进展更新"
    }
  );

  assert.equal(scored.candidates[0].pathKind, "governedArtifact");
  assert.ok(scored.candidates[0].finalScore > scored.candidates[1].finalScore);

  const codexProjection = buildPolicyProjection({
    consumer: "codex",
    artifacts: [
      createStableLearningArtifact({
        artifactId: "artifact_concise",
        title: "preference:concise-progress",
        summary: "The user prefers concise progress reports."
      })
    ]
  });
  const codexContext = createPolicyContext({
    exportResults: [
      {
        exportContract: {
          artifact_refs: ["artifact_concise"]
        },
        payload: {
          policy_inputs: codexProjection.policy_inputs
        }
      }
    ],
    consumer: "codex"
  });
  const memory = applyPolicyToMemoryItems(
    [
      {
        memory_id: "artifact_concise",
        title: "preference:concise-progress",
        summary: "The user prefers concise progress reports."
      },
      {
        memory_id: "artifact_other",
        title: "note:verbose",
        summary: "Write a very long retrospective."
      }
    ],
    {
      policyContext: codexContext,
      prompt: "给我简洁的进展汇报",
      maxItems: 6
    }
  );

  assert.equal(memory.memory_items.length, 2);
  assert.equal(memory.memory_items[0].memory_id, "artifact_concise");
  assert.equal(memory.adaptation.recommended_max_memory_items, 4);
});
