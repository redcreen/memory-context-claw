#!/usr/bin/env node

import { spawn } from "node:child_process";

const query = process.argv.slice(2).join(" ").trim() || "Lossless 插件 和 长期记忆 的区别";

const steps = [
  {
    name: "unit-tests",
    command: "npm",
    args: ["test"]
  },
  {
    name: "golden-eval",
    command: "npm",
    args: ["run", "eval"]
  },
  {
    name: "preset-compare",
    command: "npm",
    args: ["run", "smoke:compare", "--", query]
  }
];

function runStep(step) {
  return new Promise((resolve, reject) => {
    const child = spawn(step.command, step.args, {
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
  console.error(`[verify] running ${step.name}`);
  await runStep(step);
}

console.error("[verify] all checks passed");
