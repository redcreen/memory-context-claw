#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createStandaloneRuntime,
  renderStage34AcceptanceReport
} from "../src/unified-memory-core/index.js";

function readFlag(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

function readBooleanFlag(name) {
  return process.argv.includes(name);
}

function readNumberFlag(name, fallback) {
  const value = Number(readFlag(name, ""));
  return Number.isFinite(value) ? value : fallback;
}

const registryDir = readFlag("--registry-dir", "")
  || await fs.mkdtemp(path.join(os.tmpdir(), "umc-stage34-acceptance-"));

const runtime = createStandaloneRuntime({
  config: {
    registryDir,
    tenant: readFlag("--tenant", "local"),
    scope: readFlag("--scope", "workspace"),
    resource: readFlag("--resource", "unified-memory-core"),
    key: readFlag("--key", "stage34-acceptance"),
    visibility: readFlag("--visibility", "workspace")
  }
});

const report = await runtime.runStage34Acceptance({
  declaredSources: [
    {
      sourceType: readFlag("--source-type", "manual"),
      declaredBy: readFlag("--declared-by", "stage34-acceptance-script"),
      namespace: {
        tenant: readFlag("--tenant", "local"),
        scope: readFlag("--scope", "workspace"),
        resource: readFlag("--resource", "unified-memory-core"),
        key: readFlag("--key", "stage34-acceptance")
      },
      visibility: readFlag("--visibility", "workspace"),
      ...(readFlag("--source-type", "manual") === "conversation"
        ? {
            messages: [
              {
                role: readFlag("--role", "user"),
                content: readFlag(
                  "--content",
                  "Remember this: the user prefers concise progress reports."
                )
              }
            ]
          }
        : readFlag("--source-type", "manual") === "manual"
          ? {
              content: readFlag(
                "--content",
                "Remember this: the user prefers concise progress reports."
              )
            }
          : { path: readFlag("--path", "") })
    }
  ],
  dryRun: readBooleanFlag("--dry-run"),
  autoPromote: !readBooleanFlag("--no-promote"),
  query: readFlag("--query", "summarize the current governed policy"),
  taskPrompt: readFlag("--task-prompt", "apply current governed coding policy"),
  comparisonWindowDays: readNumberFlag("--comparison-window-days", 7),
  maxCandidates: readNumberFlag("--max-candidates", 6),
  maxItems: readNumberFlag("--max-items", 6),
  maxPolicyInputs: readNumberFlag("--max-policy-inputs", 8)
});

if (readFlag("--format", "markdown") === "markdown") {
  console.log(renderStage34AcceptanceReport(report));
} else {
  console.log(JSON.stringify(report, null, 2));
}
