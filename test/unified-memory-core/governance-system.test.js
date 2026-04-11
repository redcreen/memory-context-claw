import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createGovernanceSystem,
  renderGovernanceAuditReport
} from "../../src/unified-memory-core/governance-system.js";
import { createMemoryRegistry } from "../../src/unified-memory-core/memory-registry.js";
import { ingestDeclaredSourceToCandidate } from "../../src/unified-memory-core/pipeline.js";
import { createProjectionSystem } from "../../src/unified-memory-core/projection-system.js";
import { createSourceSystem } from "../../src/unified-memory-core/source-system.js";

async function seedStableArtifact({ sourceSystem, registry, namespace, content, visibility = "workspace" }) {
  const { candidateArtifact } = await ingestDeclaredSourceToCandidate({
    declaredSource: {
      sourceType: "manual",
      declaredBy: "test",
      namespace,
      visibility,
      content
    },
    sourceSystem,
    registry,
    decidedBy: "test-suite"
  });

  return registry.promoteCandidateToStable({
    candidateArtifactId: candidateArtifact.artifact_id,
    decidedBy: "test-suite",
    reasonCodes: ["governance_seed"]
  });
}

test("governance system audits a namespace and renders a non-destructive report", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-governance-"));
  const clock = () => new Date("2026-04-11T00:00:00.000Z");
  const sourceSystem = createSourceSystem({ clock });
  const registry = createMemoryRegistry({ rootDir: registryRoot, clock });
  const projectionSystem = createProjectionSystem({ registry, clock });
  const governanceSystem = createGovernanceSystem({ registry, projectionSystem, clock });
  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "audit-demo"
  };

  await seedStableArtifact({
    sourceSystem,
    registry,
    namespace,
    content: "Governance System 需要审计 registry 和 exports 的一致性"
  });

  const report = await governanceSystem.auditNamespace({ namespace });
  const markdown = renderGovernanceAuditReport(report);

  assert.equal(report.summary.records_scanned, 3);
  assert.equal(report.summary.exported_artifacts, 1);
  assert.equal(report.findings.length, 0);
  assert.match(markdown, /Unified Memory Core Governance Audit/);
  assert.match(markdown, /recordsScanned: `3`/);
  assert.match(markdown, /Findings/);
});

test("governance system creates dry-run repair records and replay runs", async () => {
  const governanceSystem = createGovernanceSystem({
    registry: {
      async listRecords() {
        return [];
      },
      async listDecisionTrails() {
        return [];
      }
    },
    projectionSystem: {
      async buildGenericExport() {
        return {
          exportVersion: "v1",
          exportContract: { artifact_refs: [] }
        };
      }
    },
    clock: () => new Date("2026-04-11T00:00:00.000Z"),
    idGenerator: (() => {
      let index = 0;
      return () => `id${++index}`;
    })()
  });

  const namespace = {
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    key: "repair-demo"
  };

  const repair = governanceSystem.createRepairRecord({
    namespace,
    findingCode: "candidate_missing_decision_trail",
    action: "mark_for_review",
    decidedBy: "maintainer",
    targetRecordIds: ["artifact_1"],
    notes: ["default dry-run"]
  });

  const replay = governanceSystem.createReplayRun({
    namespace,
    exportId: "export_1",
    replayedBy: "maintainer",
    inputRefs: ["artifact_1", "decision_1"],
    result: "queued",
    notes: ["replay after repair"]
  });

  const ownership = governanceSystem.buildRegressionOwnershipMap();

  assert.equal(repair.dry_run, true);
  assert.equal(repair.finding_code, "candidate_missing_decision_trail");
  assert.equal(replay.result, "queued");
  assert.deepEqual(ownership.governance_system, [
    "test/unified-memory-core/governance-system.test.js"
  ]);
});
