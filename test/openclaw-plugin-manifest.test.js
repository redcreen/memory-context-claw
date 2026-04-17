import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "openclaw.plugin.json"), "utf8")
);

test("openclaw plugin manifest exposes dialogue working-set shadow config", () => {
  const shadow =
    manifest?.configSchema?.properties?.dialogueWorkingSetShadow;
  assert.ok(shadow, "dialogueWorkingSetShadow should exist in configSchema");
  assert.equal(shadow.type, "object");
  assert.equal(shadow.additionalProperties, false);
  assert.ok(shadow.properties.enabled);
  assert.ok(shadow.properties.model);
  assert.ok(shadow.properties.timeoutMs);
  assert.ok(shadow.properties.outputDir);
});

test("openclaw plugin manifest exposes guarded working-set config", () => {
  const guarded =
    manifest?.configSchema?.properties?.dialogueWorkingSetGuarded;
  assert.ok(guarded, "dialogueWorkingSetGuarded should exist in configSchema");
  assert.equal(guarded.type, "object");
  assert.equal(guarded.additionalProperties, false);
  assert.ok(guarded.properties.enabled);
  assert.ok(guarded.properties.allowedRelations);
  assert.ok(guarded.properties.minReductionRatio);
  assert.ok(guarded.properties.minEvictedTurns);
});

