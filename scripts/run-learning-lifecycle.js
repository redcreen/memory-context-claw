#!/usr/bin/env node

import { createStandaloneRuntime } from "../src/unified-memory-core/standalone-runtime.js";
import { renderLearningLifecycleReport } from "../src/unified-memory-core/index.js";

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

const runtime = createStandaloneRuntime({
  config: {
    registryDir: readFlag("--registry-dir", ""),
    tenant: readFlag("--tenant", "local"),
    scope: readFlag("--scope", "workspace"),
    resource: readFlag("--resource", "unified-memory-core"),
    key: readFlag("--key", "default"),
    visibility: readFlag("--visibility", "workspace")
  }
});

const report = await runtime.runLearningLifecycle({
  declaredSources: [
    {
      sourceType: readFlag("--source-type", "manual"),
      declaredBy: readFlag("--declared-by", "learning-lifecycle-script"),
      namespace: {
        tenant: readFlag("--tenant", "local"),
        scope: readFlag("--scope", "workspace"),
        resource: readFlag("--resource", "unified-memory-core"),
        key: readFlag("--key", "default")
      },
      visibility: readFlag("--visibility", "workspace"),
      ...(readFlag("--source-type", "manual") === "conversation"
        ? {
            messages: [
              {
                role: readFlag("--role", "user"),
                content: readFlag("--content", "")
              }
            ]
          }
        : readFlag("--source-type", "manual") === "manual"
          ? { content: readFlag("--content", "") }
          : { path: readFlag("--path", "") })
    }
  ],
  dryRun: readBooleanFlag("--dry-run"),
  autoPromote: !readBooleanFlag("--no-promote")
});

if (readFlag("--format", "json") === "markdown") {
  console.log(renderLearningLifecycleReport(report.learning_audit));
} else {
  console.log(JSON.stringify(report, null, 2));
}
