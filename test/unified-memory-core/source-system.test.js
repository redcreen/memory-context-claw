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
