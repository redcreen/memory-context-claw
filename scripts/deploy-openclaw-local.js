#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const deployRoot = path.join(process.env.HOME || "", ".openclaw", "extensions", "memory-context-claw");

function run(cmd, args) {
  execFileSync(cmd, args, {
    cwd: repoRoot,
    stdio: "inherit"
  });
}

fs.mkdirSync(deployRoot, { recursive: true });

run("rsync", [
  "-a",
  "--delete",
  "--exclude", ".git",
  "--exclude", "node_modules",
  "--exclude", ".obsidian",
  `${repoRoot}/`,
  `${deployRoot}/`
]);

console.log(`Deployed memory-context-claw to ${deployRoot}`);
