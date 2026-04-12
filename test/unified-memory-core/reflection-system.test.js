import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createMemoryRegistry } from "../../src/unified-memory-core/memory-registry.js";
import { createReflectionSystem } from "../../src/unified-memory-core/reflection-system.js";
import { createSourceSystem } from "../../src/unified-memory-core/source-system.js";

function createIdGenerator() {
  let index = 0;
  return () => `id${++index}`;
}

function createFixedClock() {
  return () => new Date("2026-04-11T00:00:00.000Z");
}

test("reflection system labels preference and rule candidates deterministically", async () => {
  const sourceSystem = createSourceSystem({
    idGenerator: createIdGenerator(),
    clock: createFixedClock()
  });
  const reflectionSystem = createReflectionSystem({
    idGenerator: createIdGenerator(),
    clock: createFixedClock()
  });

  const { sourceArtifact } = await sourceSystem.ingestDeclaredSource({
    sourceType: "manual",
    declaredBy: "test",
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "reflection-demo"
    },
    visibility: "workspace",
    content: "User prefers concise summaries and must avoid hardcoded paths."
  });

  const result = await reflectionSystem.reflectSourceArtifact(sourceArtifact);

  assert.equal(result.primary_label, "stable_rule_candidate");
  assert.match(result.candidate_artifact.summary, /User prefers concise summaries/);
  assert.deepEqual(result.candidate_artifact.export_hints, [
    "stable_rule_candidate",
    "learning:rule"
  ]);
  assert.equal(result.recommendation.should_promote, true);
});

test("reflection system persists reflection candidates and decision trails", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-reflect-"));
  const registry = createMemoryRegistry({
    rootDir: registryRoot,
    clock: createFixedClock(),
    idGenerator: createIdGenerator()
  });
  const sourceSystem = createSourceSystem({
    idGenerator: createIdGenerator(),
    clock: createFixedClock()
  });
  const reflectionSystem = createReflectionSystem({
    registry,
    idGenerator: createIdGenerator(),
    clock: createFixedClock()
  });

  const { sourceArtifact } = await sourceSystem.ingestDeclaredSource({
    sourceType: "manual",
    declaredBy: "test",
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "reflection-persist"
    },
    visibility: "workspace",
    content: "This project prefers deterministic tests."
  });

  await registry.persistSourceArtifact(sourceArtifact);
  const result = await reflectionSystem.runReflection({
    sourceArtifacts: [sourceArtifact],
    persistCandidates: true,
    decidedBy: "test-reflection"
  });

  assert.equal(result.run.summary.candidate_count, 1);
  assert.equal(result.candidate_records.length, 1);
  assert.equal(result.decision_trails.length, 1);
  assert.equal(result.decision_trails[0].metadata.reflection_label, "stable_preference_candidate");
});

test("reflection system raises confidence for repeated sources in the same namespace", async () => {
  const registryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-reflect-repeat-"));
  const idGenerator = createIdGenerator();
  const clock = createFixedClock();
  const registry = createMemoryRegistry({
    rootDir: registryRoot,
    clock,
    idGenerator
  });
  const sourceSystem = createSourceSystem({
    idGenerator,
    clock
  });
  const reflectionSystem = createReflectionSystem({
    registry,
    idGenerator,
    clock
  });

  const declaredSource = {
    sourceType: "manual",
    declaredBy: "test",
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "reflection-repeat"
    },
    visibility: "workspace",
    content: "The user prefers concise answers."
  };

  const first = await sourceSystem.ingestDeclaredSource(declaredSource);
  await registry.persistSourceArtifact(first.sourceArtifact);
  const second = await sourceSystem.ingestDeclaredSource(declaredSource);
  const result = await reflectionSystem.reflectSourceArtifact(second.sourceArtifact);

  assert.equal(result.repeated_source_count, 1);
  assert.ok(result.candidate_artifact.confidence > 0.78);
});

test("reflection system treats Chinese should-style rules as stable rule candidates", async () => {
  const sourceSystem = createSourceSystem({
    idGenerator: createIdGenerator(),
    clock: createFixedClock()
  });
  const reflectionSystem = createReflectionSystem({
    idGenerator: createIdGenerator(),
    clock: createFixedClock()
  });

  const { sourceArtifact } = await sourceSystem.ingestDeclaredSource({
    sourceType: "manual",
    declaredBy: "test",
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "reflection-zh-rule"
    },
    visibility: "workspace",
    content: "订单与供应链执行应该拆成固定模块，并优先定义清晰的输入、动作和输出。"
  });

  const result = await reflectionSystem.reflectSourceArtifact(sourceArtifact);

  assert.equal(result.primary_label, "stable_rule_candidate");
  assert.equal(result.recommendation.should_promote, true);
});

test("reflection system splits accepted_action sources into target facts and outcome artifacts", async () => {
  const sourceSystem = createSourceSystem({
    idGenerator: createIdGenerator(),
    clock: createFixedClock()
  });
  const reflectionSystem = createReflectionSystem({
    idGenerator: createIdGenerator(),
    clock: createFixedClock()
  });

  const { sourceArtifact } = await sourceSystem.ingestDeclaredSource({
    sourceType: "accepted_action",
    declaredBy: "test",
    actionType: "publish_site",
    status: "succeeded",
    accepted: true,
    succeeded: true,
    agentId: "code",
    targets: ["redcreen/redcreen.github.io", "https://redcreen.github.io/brain-reinstall-jingangjing/"],
    artifacts: ["dist/index.html"],
    outputs: {
      finalUrl: "https://redcreen.github.io/brain-reinstall-jingangjing/",
      manifestPath: "dist/manifest.json"
    },
    content: "User accepted the publish target and the site release succeeded.",
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "reflection-accepted-action"
    },
    visibility: "workspace"
  });

  const result = await reflectionSystem.reflectSourceArtifact(sourceArtifact);

  assert.equal(result.primary_label, "stable_fact_candidate");
  assert.equal(result.output_count, 4);
  assert.equal(result.outputs[0].candidate_artifact.attributes.accepted_action_extraction_class, "target_fact");
  assert.equal(result.outputs[0].recommendation.should_promote, true);
  assert.deepEqual(
    result.outputs.map((item) => item.candidate_artifact.attributes.accepted_action_extraction_class),
    ["target_fact", "outcome_artifact", "outcome_artifact", "outcome_artifact"]
  );
  assert.deepEqual(
    result.outputs.map((item) => item.candidate_artifact.state),
    ["candidate", "observation", "observation", "observation"]
  );
  assert.match(result.outputs[0].candidate_artifact.summary, /reusable target redcreen\/redcreen\.github\.io/);
  assert.match(result.outputs[1].candidate_artifact.summary, /brain-reinstall-jingangjing/);
});
