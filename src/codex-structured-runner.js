import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const configuredSeedCodexHome = normalizeSeedCodexHome(process.env.UMC_CODEX_SEED_HOME);
const defaultCodexHome = configuredSeedCodexHome || path.join(os.homedir(), ".codex");

function normalizeSeedCodexHome(value) {
  if (typeof value !== "string") {
    return "";
  }
  const normalized = value.trim();
  return normalized || "";
}

function buildSanitizedCodexEnv({
  model,
  reasoningEffort,
  codexHome
}) {
  const baseEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("CODEX_"))
  );

  return {
    ...baseEnv,
    MODEL_NAME: model,
    ...(codexHome ? { CODEX_HOME: codexHome } : {}),
    ...(reasoningEffort ? { CODEX_MODEL_REASONING_EFFORT: reasoningEffort } : {})
  };
}

export function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

export async function createTemporaryCodexHome(reasoningEffort = "low") {
  const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-home-"));
  const filesToCopy = ["auth.json", "config.toml"];

  for (const fileName of filesToCopy) {
    const sourcePath = path.join(defaultCodexHome, fileName);
    const targetPath = path.join(tempHome, fileName);
    try {
      await fs.copyFile(sourcePath, targetPath);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  const configPath = path.join(tempHome, "config.toml");
  let configContent = "";

  try {
    configContent = await fs.readFile(configPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  if (/^model_reasoning_effort\s*=.*$/m.test(configContent)) {
    configContent = configContent.replace(
      /^model_reasoning_effort\s*=.*$/m,
      `model_reasoning_effort = ${JSON.stringify(reasoningEffort)}`
    );
  } else {
    configContent = `${configContent.trimEnd()}\nmodel_reasoning_effort = ${JSON.stringify(reasoningEffort)}\n`;
  }

  await fs.writeFile(configPath, configContent, "utf8");

  return tempHome;
}

export async function createMinimalCodexHome(reasoningEffort = "low") {
  const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), "umc-codex-home-"));
  const sourceAuthPath = path.join(defaultCodexHome, "auth.json");
  const targetAuthPath = path.join(tempHome, "auth.json");

  try {
    await fs.copyFile(sourceAuthPath, targetAuthPath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  const configContent = `model_reasoning_effort = ${JSON.stringify(reasoningEffort)}\n`;
  await fs.writeFile(path.join(tempHome, "config.toml"), configContent, "utf8");

  return tempHome;
}

export function parseCodexJsonLines(stdout = "") {
  return String(stdout || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

export function extractStructuredPayload(stdout = "") {
  const events = parseCodexJsonLines(stdout);
  let payload = null;
  let usage = null;

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];

    if (event?.type === "turn.completed" && event?.usage && !usage) {
      usage = event.usage;
    }

    const messageText = event?.item?.type === "agent_message"
      ? normalizeString(event.item.text)
      : "";
    if (messageText) {
      payload = JSON.parse(messageText);
      break;
    }
  }

  if (!payload) {
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (typeof event === "object" && event && !Array.isArray(event)) {
        payload = event;
        break;
      }
    }
  }

  if (!payload) {
    throw new Error("No JSON payload found in codex exec output.");
  }

  return {
    payload,
    usage
  };
}

export function normalizeExecErrorMetadata(error) {
  return {
    exitCode: Number.isFinite(error?.code) ? Number(error.code) : null,
    signal: normalizeString(error?.signal),
    killed: error?.killed === true,
    timedOut: error?.code === "ETIMEDOUT" || /timed out/i.test(String(error?.message || ""))
  };
}

export function tryRecoverStructuredPayloadFromExecError(error, startedAt) {
  const stdout = String(error?.stdout || "");
  if (!stdout.trim()) {
    return null;
  }

  try {
    const extracted = extractStructuredPayload(stdout);
    return {
      payload: extracted.payload,
      usage: extracted.usage,
      stdout,
      stderr: normalizeString(error?.stderr),
      elapsedMs: Date.now() - startedAt,
      recoveredFromExecError: true,
      execError: normalizeExecErrorMetadata(error)
    };
  } catch {
    return null;
  }
}

export async function runStructuredCodexPrompt({
  prompt,
  schema,
  model = "gpt-5.4",
  reasoningEffort = "low",
  cwd = process.cwd(),
  codexHome = "",
  maxBuffer = 16 * 1024 * 1024,
  timeoutMs = 120000
} = {}) {
  const promptPath = path.join(
    os.tmpdir(),
    `umc-codex-prompt-${process.pid}-${Date.now()}.txt`
  );
  const schemaPath = path.join(
    os.tmpdir(),
    `umc-codex-schema-${process.pid}-${Date.now()}.json`
  );

  await fs.writeFile(promptPath, `${String(prompt || "").trim()}\n`, "utf8");
  await fs.writeFile(schemaPath, `${JSON.stringify(schema, null, 2)}\n`, "utf8");

  const startedAt = Date.now();

  try {
    try {
      const promptText = await fs.readFile(promptPath, "utf8");
      const { stdout, stderr } = await new Promise((resolve, reject) => {
        const child = spawn(
          "codex",
          [
            "exec",
            "--json",
            "-m",
            model,
            "--ephemeral",
            "--color",
            "never",
            "--output-schema",
            schemaPath,
            "--skip-git-repo-check",
            "-C",
            cwd,
            "-"
          ],
          {
            cwd,
            env: buildSanitizedCodexEnv({
              model,
              reasoningEffort,
              codexHome
            }),
            stdio: ["pipe", "pipe", "pipe"]
          }
        );

        let stdout = "";
        let stderr = "";
        let settled = false;
        let timedOut = false;
        let timer = null;

        const trimBuffer = (value) => {
          if (value.length <= maxBuffer) {
            return value;
          }
          return value.slice(value.length - maxBuffer);
        };

        const finish = (payload) => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timer);
          resolve(payload);
        };

        const fail = (error) => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timer);
          reject(error);
        };

        child.stdout.on("data", (chunk) => {
          stdout = trimBuffer(stdout + String(chunk));
        });
        child.stderr.on("data", (chunk) => {
          stderr = trimBuffer(stderr + String(chunk));
        });
        child.on("error", (error) => {
          error.stdout = stdout;
          error.stderr = stderr;
          fail(error);
        });
        child.on("close", (code, signal) => {
          if (timedOut) {
            const error = new Error(`codex exec timed out after ${timeoutMs}ms`);
            error.code = "ETIMEDOUT";
            error.signal = signal || "SIGKILL";
            error.killed = true;
            error.stdout = stdout;
            error.stderr = stderr;
            fail(error);
            return;
          }
          if (code !== 0) {
            const error = new Error(`codex exec exited with code ${code}`);
            error.code = code;
            error.signal = signal || "";
            error.killed = false;
            error.stdout = stdout;
            error.stderr = stderr;
            fail(error);
            return;
          }
          finish({ stdout, stderr });
        });

        timer = setTimeout(() => {
          timedOut = true;
          child.kill("SIGKILL");
        }, timeoutMs);

        child.stdin.end(promptText);
      });

      const extracted = extractStructuredPayload(stdout);

      return {
        payload: extracted.payload,
        usage: extracted.usage,
        stdout: String(stdout || ""),
        stderr: normalizeString(stderr),
        elapsedMs: Date.now() - startedAt,
        recoveredFromExecError: false,
        execError: null
      };
    } catch (error) {
      const recovered = tryRecoverStructuredPayloadFromExecError(error, startedAt);
      if (recovered) {
        return recovered;
      }
      throw error;
    }
  } finally {
    await fs.rm(promptPath, { force: true });
    await fs.rm(schemaPath, { force: true });
  }
}
