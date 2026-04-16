#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function optionalFlag(flag, value) {
  const normalized = normalizeString(value);
  return normalized ? [flag, normalized] : [];
}

function numericFlag(flag, value) {
  const normalized = normalizeString(value);
  return normalized ? [flag, normalized] : [];
}

async function main() {
  const repoRoot = normalizeString(process.env.UMC_EVAL_REPO_ROOT, "/workspace");
  const script = normalizeString(process.env.UMC_EVAL_SCRIPT);
  if (!script) {
    throw new Error("UMC_EVAL_SCRIPT is required inside the Docker runner.");
  }

  const args = [
    path.resolve(repoRoot, script),
    ...optionalFlag("--cases", normalizeString(process.env.UMC_EVAL_CASES)),
    ...optionalFlag("--agent", normalizeString(process.env.UMC_EVAL_AGENT)),
    ...optionalFlag("--fixture-root", normalizeString(process.env.UMC_EVAL_FIXTURE_ROOT)),
    ...optionalFlag("--plugin-path", normalizeString(process.env.UMC_EVAL_PLUGIN_PATH, repoRoot)),
    ...optionalFlag(
      "--embed-model-path",
      normalizeString(process.env.UMC_EVAL_EMBED_MODEL_PATH, process.env.OPENCLAW_EMBED_MODEL_PATH)
    ),
    ...optionalFlag("--auth-profiles-path", normalizeString(process.env.UMC_EVAL_AUTH_PROFILES_PATH)),
    ...optionalFlag("--preset", normalizeString(process.env.UMC_EVAL_PRESET)),
    ...optionalFlag("--agent-model", normalizeString(process.env.UMC_EVAL_AGENT_MODEL)),
    ...optionalFlag("--write-json", normalizeString(process.env.UMC_EVAL_WRITE_JSON)),
    ...optionalFlag("--write-markdown", normalizeString(process.env.UMC_EVAL_WRITE_MARKDOWN)),
    ...optionalFlag("--format", normalizeString(process.env.UMC_EVAL_FORMAT, "markdown")),
    ...optionalFlag("--only", normalizeString(process.env.UMC_EVAL_ONLY)),
    ...numericFlag("--max-cases", process.env.UMC_EVAL_MAX_CASES),
    ...numericFlag("--shard-size", process.env.UMC_EVAL_SHARD_SIZE),
    ...numericFlag("--shard-count", process.env.UMC_EVAL_SHARD_COUNT),
    ...numericFlag("--agent-timeout-ms", process.env.UMC_EVAL_AGENT_TIMEOUT_MS),
    ...(normalizeString(process.env.UMC_EVAL_KEEP_STATE) === "1" ? ["--keep-state"] : [])
  ];

  const extraArgs = normalizeString(process.env.UMC_EVAL_EXTRA_ARGS);
  if (extraArgs) {
    args.push(...extraArgs.split(/\s+/).filter(Boolean));
  }

  await new Promise((resolve, reject) => {
    const child = spawn("node", args, {
      cwd: repoRoot,
      env: process.env,
      stdio: "inherit"
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Docker eval entry exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
