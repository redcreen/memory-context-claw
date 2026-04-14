#!/usr/bin/env node

import { spawn } from "node:child_process";

const repoRoot = process.cwd();

const steps = [
  {
    name: "memory-intent-contract",
    command: "node",
    args: ["--test", "test/unified-memory-core/memory-intent-contract.test.js"]
  },
  {
    name: "memory-intent-runtime",
    command: "node",
    args: [
      "--test",
      "test/codex-adapter.test.js",
      "test/memory-intent-replay-cases.test.js",
      "test/umc-cli.test.js"
    ]
  },
  {
    name: "memory-intent-governance",
    command: "node",
    args: [
      "--test",
      "test/unified-memory-core/contracts.test.js",
      "test/unified-memory-core/source-system.test.js",
      "test/unified-memory-core/reflection-system.test.js"
    ]
  }
];

function runStep(step) {
  return new Promise((resolve, reject) => {
    const child = spawn(step.command, step.args, {
      cwd: repoRoot,
      stdio: "inherit",
      shell: process.platform === "win32"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${step.name} failed with exit code ${code}`));
    });

    child.on("error", reject);
  });
}

for (const step of steps) {
  console.error(`[memory-intent-gate] running ${step.name}`);
  await runStep(step);
}

console.error("[memory-intent-gate] all checks passed");
