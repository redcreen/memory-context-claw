import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import scenarios from "../evals/openclaw-docker-scenarios.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("openclaw docker scenarios have unique ids and existing repo paths", async () => {
  const ids = new Set();
  for (const scenario of scenarios) {
    assert.ok(typeof scenario.id === "string" && scenario.id.length > 0);
    assert.equal(ids.has(scenario.id), false, `duplicate scenario id: ${scenario.id}`);
    ids.add(scenario.id);

    const scriptPath = path.resolve(repoRoot, scenario.script);
    const casesPath = path.resolve(repoRoot, scenario.cases);
    assert.equal((await fs.stat(scriptPath)).isFile(), true, `missing script: ${scenario.script}`);
    assert.equal((await fs.stat(casesPath)).isFile(), true, `missing cases: ${scenario.cases}`);
  }
});
