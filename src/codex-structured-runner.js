import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const defaultCodexHome = path.join(os.homedir(), ".codex");

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

export async function runStructuredCodexPrompt({
  prompt,
  schema,
  model = "gpt-5.4",
  reasoningEffort = "low",
  cwd = process.cwd(),
  codexHome = "",
  maxBuffer = 16 * 1024 * 1024
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
    const { stdout, stderr } = await execFileAsync(
      "zsh",
      [
        "-c",
        'codex exec --json -m "$MODEL_NAME" --ephemeral --color never --output-schema "$SCHEMA_PATH" --skip-git-repo-check -C "$WORKDIR_PATH" - < "$PROMPT_PATH"'
      ],
      {
        cwd,
        env: {
          ...process.env,
          MODEL_NAME: model,
          PROMPT_PATH: promptPath,
          SCHEMA_PATH: schemaPath,
          WORKDIR_PATH: cwd,
          ...(codexHome ? { CODEX_HOME: codexHome } : {}),
          ...(reasoningEffort ? { CODEX_MODEL_REASONING_EFFORT: reasoningEffort } : {})
        },
        maxBuffer
      }
    );

    const extracted = extractStructuredPayload(stdout);

    return {
      payload: extracted.payload,
      usage: extracted.usage,
      stdout: String(stdout || ""),
      stderr: normalizeString(stderr),
      elapsedMs: Date.now() - startedAt
    };
  } finally {
    await fs.rm(promptPath, { force: true });
    await fs.rm(schemaPath, { force: true });
  }
}
