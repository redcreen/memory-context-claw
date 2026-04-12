#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createStandaloneRuntime,
  renderStage5AcceptanceReport
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

const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "umc-stage5-acceptance-"));
const registryDir = readFlag("--registry-dir", "")
  || path.join(fixtureRoot, "registry");
const splitTargetDir = readFlag("--target-dir", "")
  || path.join(fixtureRoot, "split-rehearsal-target");
const filePath = path.join(fixtureRoot, "notes.md");
const directoryPath = path.join(fixtureRoot, "workspace");
const imagePath = path.join(fixtureRoot, "signal.png");

await fs.mkdir(directoryPath, { recursive: true });
await fs.writeFile(
  filePath,
  [
    "Prefer tests and docs when behavior changes.",
    "Keep the maintenance workflow scriptable."
  ].join("\n"),
  "utf8"
);
await fs.writeFile(path.join(directoryPath, "MEMORY.md"), "workspace memory root\n", "utf8");
await fs.writeFile(path.join(directoryPath, "memory.md"), "daily memory snapshot\n", "utf8");
await fs.writeFile(
  imagePath,
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1+L1EAAAAASUVORK5CYII=",
    "base64"
  )
);

const namespace = {
  tenant: readFlag("--tenant", "local"),
  scope: readFlag("--scope", "workspace"),
  resource: readFlag("--resource", "unified-memory-core"),
  key: readFlag("--key", "stage5-acceptance")
};

const runtime = createStandaloneRuntime({
  config: {
    registryDir,
    ...namespace,
    visibility: readFlag("--visibility", "workspace")
  }
});

const declaredSources = [
  {
    sourceType: "manual",
    declaredBy: readFlag("--declared-by", "stage5-acceptance-script"),
    namespace,
    visibility: readFlag("--visibility", "workspace"),
    content: readFlag(
      "--content",
      "Remember this: the user prefers concise progress reports."
    )
  },
  {
    sourceType: "file",
    declaredBy: "stage5-acceptance-script",
    namespace,
    visibility: readFlag("--visibility", "workspace"),
    path: filePath
  },
  {
    sourceType: "directory",
    declaredBy: "stage5-acceptance-script",
    namespace,
    visibility: readFlag("--visibility", "workspace"),
    path: directoryPath
  },
  {
    sourceType: "url",
    declaredBy: "stage5-acceptance-script",
    namespace,
    visibility: readFlag("--visibility", "workspace"),
    url: "https://example.com/unified-memory-core/stage5",
    title: "Stage 5 maintenance workflow",
    content: "Terminal-first maintenance workflows should stay reproducible and compact."
  },
  {
    sourceType: "image",
    declaredBy: "stage5-acceptance-script",
    namespace,
    visibility: readFlag("--visibility", "workspace"),
    path: imagePath,
    altText: "Compact terminal-first workflow diagram for governed maintenance runs.",
    caption: "Image source for Stage 5 source adapter hardening."
  }
];

const report = await runtime.runStage5Acceptance({
  declaredSources,
  dryRun: readBooleanFlag("--dry-run"),
  autoPromote: !readBooleanFlag("--no-promote"),
  query: readFlag("--query", "summarize the current governed policy"),
  taskPrompt: readFlag("--task-prompt", "apply current governed coding policy"),
  comparisonWindowDays: readNumberFlag("--comparison-window-days", 7),
  maxCandidates: readNumberFlag("--max-candidates", 6),
  maxItems: readNumberFlag("--max-items", 6),
  maxPolicyInputs: readNumberFlag("--max-policy-inputs", 8),
  repoRoot: readFlag("--repo-root", process.cwd()),
  splitTargetDir
});

if (readFlag("--format", "markdown") === "markdown") {
  console.log(renderStage5AcceptanceReport(report));
} else {
  console.log(JSON.stringify(report, null, 2));
}
