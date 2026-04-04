#!/usr/bin/env node

import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  applyGatewayGpuPolicy,
  extractJsonPayload,
  parseRuntimeArgs,
  summarizeMainMemory
} from "../src/runtime-config.js";

const execFileAsync = promisify(execFile);

function printUsage() {
  console.log(
    [
      "Usage: node scripts/configure-local-runtime.js [options]",
      "",
      "Options:",
      "  --check                 Only inspect current setup",
      "  --remove                Remove CPU-safe gateway override",
      "  --dry-run               Print intended actions without writing changes",
      "  --skip-build            Do not rebuild node-llama-cpp CPU runtime",
      "  --skip-reload           Do not reload the OpenClaw gateway launch agent",
      "  --launch-agent <path>   Override launch agent plist path",
      "  --openclaw-bin <path>   OpenClaw binary or command (default: openclaw)",
      "  --llama-bin <path>      node-llama-cpp binary or command (default: node-llama-cpp)",
      "  --help                  Show this message"
    ].join("\n")
  );
}

async function loadPlistJson(plistPath) {
  const { stdout } = await execFileAsync("plutil", ["-convert", "json", "-o", "-", plistPath], {
    maxBuffer: 4 * 1024 * 1024
  });
  return JSON.parse(stdout);
}

async function savePlistJson(plistPath, value) {
  const tempDir = await fs.mkdtemp(`${process.env.TMPDIR || "/tmp/"}context-assembly-claw-`);
  const tempJsonPath = `${tempDir}/${randomUUID()}.json`;
  await fs.writeFile(tempJsonPath, JSON.stringify(value, null, 2));
  try {
    await execFileAsync("plutil", ["-convert", "xml1", "-o", plistPath, tempJsonPath], {
      maxBuffer: 4 * 1024 * 1024
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function configureLaunchAgent(options) {
  const plist = await loadPlistJson(options.launchAgentPath);
  const next = applyGatewayGpuPolicy(plist, { remove: options.remove });

  if (!options.check && next.changed && !options.dryRun) {
    await savePlistJson(options.launchAgentPath, next.plist);
  }

  return {
    changed: next.changed,
    previousValue: next.previousValue,
    nextValue: next.nextValue
  };
}

async function runCommand(cmd, args, extraEnv = {}) {
  return await execFileAsync(cmd, args, {
    env: { ...process.env, ...extraEnv },
    maxBuffer: 8 * 1024 * 1024
  });
}

async function ensureCpuOnlyRuntime(options) {
  if (options.skipBuild || options.remove || options.check) {
    return { skipped: true };
  }

  await runCommand(
    options.llamaBin,
    ["source", "build", "--gpu", "false", "--noUsageExample"],
    { NODE_LLAMA_CPP_GPU: "false" }
  );

  const { stdout } = await runCommand(
    "node",
    [
      "-e",
      [
        "import('node-llama-cpp')",
        ".then(async ({getLlama,LlamaLogLevel}) => {",
        "  const llama = await getLlama({ logLevel: LlamaLogLevel.error });",
        "  console.log(JSON.stringify({ gpu: llama.gpu, supportsGpuOffloading: llama.supportsGpuOffloading }));",
        "  await llama.dispose();",
        "})",
        ".catch((error) => { console.error(error); process.exit(1); });"
      ].join("")
    ],
    { NODE_LLAMA_CPP_GPU: "false" }
  );

  const verification = JSON.parse(stdout.trim());
  if (verification.gpu !== false) {
    throw new Error(`CPU-only verification failed: expected gpu=false, got ${JSON.stringify(verification)}`);
  }

  return {
    skipped: false,
    verification
  };
}

async function reloadGateway(options) {
  if (options.skipReload || options.check) {
    return { skipped: true };
  }

  const plistPath = options.launchAgentPath;
  await execFileAsync("launchctl", ["unload", plistPath], { maxBuffer: 1024 * 1024 }).catch(() => {});
  await execFileAsync("launchctl", ["load", plistPath], { maxBuffer: 1024 * 1024 });
  return { skipped: false };
}

async function readMemoryStatus(options) {
  const { stdout } = await runCommand(options.openclawBin, ["memory", "status", "--json"]);
  return extractJsonPayload(stdout);
}

async function main() {
  if (process.platform !== "darwin") {
    throw new Error("This helper currently targets macOS launchd-based OpenClaw Gateway deployments.");
  }

  const options = parseRuntimeArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    process.exit(0);
  }
  const launchAgent = await configureLaunchAgent(options);
  const build = await ensureCpuOnlyRuntime(options);
  const reload = await reloadGateway(options);
  const memoryStatus = await readMemoryStatus(options);

  console.log(
    JSON.stringify(
      {
        mode: options.remove ? "remove" : options.check ? "check" : "apply",
        dryRun: options.dryRun,
        launchAgentPath: options.launchAgentPath,
        launchAgent,
        build,
        reload,
        mainMemory: summarizeMainMemory(memoryStatus)
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
