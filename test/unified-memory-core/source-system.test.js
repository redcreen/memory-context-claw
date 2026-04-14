import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createSourceSystem } from "../../src/unified-memory-core/source-system.js";

test("source system normalizes manual input into a source artifact", async () => {
  const sourceSystem = createSourceSystem({
    idGenerator: (() => {
      let index = 0;
      return () => `id${++index}`;
    })(),
    clock: () => new Date("2026-04-11T00:00:00.000Z")
  });

  const result = await sourceSystem.ingestDeclaredSource({
    sourceType: "manual",
    declaredBy: "test",
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "demo"
    },
    visibility: "workspace",
    content: "  hello   unified memory core  "
  });

  assert.equal(result.sourceManifest.source_type, "manual");
  assert.equal(result.sourceArtifact.normalized_payload.text, "hello unified memory core");
  assert.equal(result.sourceArtifact.visibility, "workspace");
});

test("source system snapshots directory sources for replay", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-source-"));
  await fs.writeFile(path.join(tempDir, "a.md"), "hello", "utf8");
  await fs.mkdir(path.join(tempDir, "nested"));
  await fs.writeFile(path.join(tempDir, "nested", "b.md"), "world", "utf8");

  const sourceSystem = createSourceSystem();
  const result = await sourceSystem.ingestDeclaredSource({
    sourceType: "directory",
    declaredBy: "test",
    path: tempDir,
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "snapshot"
    },
    visibility: "private"
  });

  assert.equal(result.sourceArtifact.source_type, "directory");
  assert.equal(result.sourceArtifact.normalized_payload.entry_count, 3);
  assert.match(
    JSON.stringify(result.sourceArtifact.normalized_payload.entries),
    /nested\/b\.md/
  );
});

test("source system normalizes url sources from local-first snapshots", async () => {
  const sourceSystem = createSourceSystem();
  const result = await sourceSystem.ingestDeclaredSource({
    sourceType: "url",
    declaredBy: "test",
    url: "https://example.com/stage5",
    title: "Stage 5 maintenance",
    content: "Maintenance workflows should stay scriptable and reproducible.",
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "url"
    },
    visibility: "workspace"
  });

  assert.equal(result.sourceArtifact.source_type, "url");
  assert.equal(result.sourceArtifact.normalized_payload.url, "https://example.com/stage5");
  assert.match(result.sourceArtifact.normalized_payload.text, /scriptable and reproducible/);
});

test("source system snapshots image sources with text context", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "umc-image-"));
  const imagePath = path.join(tempDir, "signal.png");
  await fs.writeFile(
    imagePath,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1+L1EAAAAASUVORK5CYII=",
      "base64"
    )
  );

  const sourceSystem = createSourceSystem();
  const result = await sourceSystem.ingestDeclaredSource({
    sourceType: "image",
    declaredBy: "test",
    path: imagePath,
    altText: "Compact terminal-first workflow diagram.",
    caption: "Stage 5 image source.",
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "image"
    },
    visibility: "workspace"
  });

  assert.equal(result.sourceArtifact.source_type, "image");
  assert.equal(result.sourceArtifact.normalized_payload.media_type, "image/png");
  assert.match(result.sourceArtifact.normalized_payload.text, /terminal-first workflow/);
  assert.equal(typeof result.sourceArtifact.normalized_payload.sha256, "string");
});

test("source system normalizes accepted_action sources into structured evidence", async () => {
  const sourceSystem = createSourceSystem();
  const result = await sourceSystem.ingestDeclaredSource({
    sourceType: "accepted_action",
    declaredBy: "test",
    actionType: "publish_site",
    status: "succeeded",
    accepted: true,
    succeeded: true,
    agentId: "code",
    targets: ["redcreen/redcreen.github.io", "https://redcreen.github.io/demo/"],
    artifacts: ["dist/index.html"],
    outputs: {
      finalUrl: "https://redcreen.github.io/demo/",
      manifestPath: "dist/manifest.json"
    },
    content: "User accepted the publish target for the site release.",
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "accepted-action"
    },
    visibility: "workspace"
  });

  assert.equal(result.sourceArtifact.source_type, "accepted_action");
  assert.equal(result.sourceArtifact.normalized_payload.action_type, "publish_site");
  assert.equal(result.sourceArtifact.normalized_payload.execution_succeeded, true);
  assert.match(result.sourceArtifact.normalized_payload.text, /redcreen\/redcreen\.github\.io/);
  assert.deepEqual(result.sourceArtifact.normalized_payload.artifact_paths, ["dist/index.html"]);
  assert.deepEqual(result.sourceArtifact.normalized_payload.target_descriptors, [
    {
      value: "redcreen/redcreen.github.io",
      kind: "repository",
      reuse_class: "reusable_target",
      is_reusable: true
    },
    {
      value: "https://redcreen.github.io/demo/",
      kind: "url_path",
      reuse_class: "outcome_target",
      is_reusable: false,
      host: "redcreen.github.io",
      pathname: "/demo/"
    }
  ]);
  assert.deepEqual(result.sourceArtifact.normalized_payload.artifact_descriptors, [
    {
      value: "dist/index.html",
      kind: "artifact_path",
      reuse_class: "outcome_artifact",
      is_reusable: false,
      extension: ".html"
    }
  ]);
  assert.deepEqual(result.sourceArtifact.normalized_payload.output_descriptors, [
    {
      field_path: "finalUrl",
      value: "https://redcreen.github.io/demo/",
      kind: "output_url",
      reuse_class: "outcome_artifact",
      is_reusable: false,
      host: "redcreen.github.io",
      pathname: "/demo/"
    },
    {
      field_path: "manifestPath",
      value: "dist/manifest.json",
      kind: "output_path",
      reuse_class: "outcome_artifact",
      is_reusable: false
    }
  ]);
});

test("source system normalizes memory_intent sources into structured evidence", async () => {
  const sourceSystem = createSourceSystem();
  const result = await sourceSystem.ingestDeclaredSource({
    sourceType: "memory_intent",
    declaredBy: "test",
    shouldWriteMemory: true,
    category: "tool_routing_preference",
    durability: "durable",
    confidence: 0.98,
    summary: "User wants Xiaohongshu links handled with capture_xiaohongshu_note in future conversations.",
    userMessage: "以后你收到小红书的链接，就使用 capture_xiaohongshu_note 工具来处理；记住了！",
    assistantReply: "记住了。以后收到小红书链接时，我会优先使用 capture_xiaohongshu_note 来处理。",
    structuredRule: {
      trigger: {
        content_kind: "xiaohongshu_link",
        domains: ["xhslink.com", "xiaohongshu.com"]
      },
      action: {
        tool: "capture_xiaohongshu_note"
      }
    },
    namespace: {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "memory-intent"
    },
    visibility: "workspace"
  });

  assert.equal(result.sourceArtifact.source_type, "memory_intent");
  assert.equal(result.sourceArtifact.normalized_payload.format, "memory_intent");
  assert.equal(result.sourceArtifact.normalized_payload.admission_route, "candidate_rule");
  assert.equal(result.sourceArtifact.normalized_payload.structured_rule.action.tool, "capture_xiaohongshu_note");
  assert.deepEqual(result.sourceArtifact.normalized_payload.structured_rule.trigger.domains, [
    "xhslink.com",
    "xiaohongshu.com"
  ]);
});
