#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const date = new Date().toISOString().slice(0, 10);

const forwarded = process.argv.slice(2);
const hasFlag = (name) => forwarded.includes(name);
const args = [
  path.resolve(__dirname, "./eval-openclaw-cli-memory-benchmark.js"),
  "--entrypoints",
  "agent",
  ...(!hasFlag("--write-json")
    ? ["--write-json", path.resolve(__dirname, `../reports/openclaw-cli-agent-answer-matrix-${date}.json`)]
    : []),
  ...(!hasFlag("--write-markdown")
    ? ["--write-markdown", path.resolve(__dirname, `../reports/generated/openclaw-cli-agent-answer-matrix-${date}.md`)]
    : []),
  ...forwarded
];

try {
  const result = await execFileAsync("node", args, {
    cwd: path.resolve(__dirname, ".."),
    maxBuffer: 8 * 1024 * 1024
  });

  process.stdout.write(String(result.stdout || ""));
  process.stderr.write(String(result.stderr || ""));
} catch (error) {
  process.stdout.write(String(error.stdout || ""));
  process.stderr.write(String(error.stderr || error.message || ""));
  process.exitCode = Number(error.code || 1);
}
