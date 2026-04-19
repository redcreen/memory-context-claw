import {
  estimateTokenCountFromText,
  normalizeWhitespace
} from "./utils.js";
import {
  applySoftEvictionPlan,
  normalizeDialogueTurns
} from "./dialogue-working-set.js";

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function compactText(value, maxChars = 0) {
  const normalized = normalizeWhitespace(value);
  const limit = Math.max(0, Math.trunc(Number(maxChars || 0)));
  if (!normalized || limit <= 0 || normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

export function renderDialogueTurns(turns = []) {
  return normalizeDialogueTurns(turns)
    .map((turn) => `${turn.id} ${turn.role}: ${turn.content}`)
    .join("\n");
}

export function findTurnIndexById(turns = [], turnId = "") {
  return normalizeDialogueTurns(turns).findIndex((turn) => turn.id === normalizeString(turnId));
}

export function sliceTurnsThroughId(turns = [], turnId = "") {
  const normalizedTurns = normalizeDialogueTurns(turns);
  const turnIndex = normalizedTurns.findIndex((turn) => turn.id === normalizeString(turnId));
  if (turnIndex === -1) {
    return normalizedTurns;
  }
  return normalizedTurns.slice(0, turnIndex + 1);
}

export function buildSemanticPinNotes({
  turns = [],
  pinTurnIds = []
} = {}) {
  const normalizedTurns = normalizeDialogueTurns(turns);
  const pinSet = new Set(Array.isArray(pinTurnIds) ? pinTurnIds : []);
  return normalizedTurns
    .filter((turn) => pinSet.has(turn.id))
    .map((turn) => `${turn.role}: ${turn.content}`);
}

export function buildSummaryFirstWorkingSetText({
  applied = {},
  semanticPinNotes = []
} = {}) {
  const keepTurns = normalizeDialogueTurns(applied?.keepTurns);
  const latestUserTurn = [...keepTurns].reverse().find((turn) => turn.role === "user");
  const taskStateSummary = compactText(
    normalizeString(applied?.archiveSummary || applied?.reasoningSummary),
    220
  );
  const latestUserAsk = compactText(latestUserTurn?.content || "", 140);
  const compactPins = (Array.isArray(semanticPinNotes) ? semanticPinNotes : [])
    .map((item) => compactText(item, 140))
    .filter(Boolean);
  const sections = [];
  const rawKeepText = renderDialogueTurns(keepTurns);

  if (taskStateSummary) {
    sections.push(`Task state summary:\n${taskStateSummary}`);
  }
  if (latestUserAsk) {
    sections.push(`Latest user ask:\n- ${latestUserAsk}`);
  }
  if (compactPins.length > 0) {
    sections.push([
      "Semantic pins:",
      ...compactPins.map((item) => `- ${item}`)
    ].join("\n"));
  }

  if (sections.length === 0) {
    const fallbackTurns = keepTurns
      .filter((turn) => turn.role === "user")
      .slice(-1);
    const fallbackText = renderDialogueTurns(
      fallbackTurns.length > 0 ? fallbackTurns : keepTurns.slice(-1)
    );
    if (fallbackText) {
      sections.push(`Recent raw context:\n${fallbackText}`);
    }
  }

  const summaryFirstText = sections.join("\n\n");
  if (rawKeepText) {
    const summaryEstimate = estimateTokenCountFromText(summaryFirstText);
    const rawEstimate = estimateTokenCountFromText(rawKeepText);
    const rawStillCheap = rawEstimate <= 80;
    const compactSummaryWouldHideTooMuch = (
      rawStillCheap
      && keepTurns.length <= 5
      && compactPins.length === 0
      && Boolean(taskStateSummary)
    );
    if (rawEstimate <= summaryEstimate || compactSummaryWouldHideTooMuch) {
      return `Recent raw context:\n${rawKeepText}`;
    }
  }

  return summaryFirstText;
}

export function buildShadowContextSnapshot({
  turns = [],
  decision = {}
} = {}) {
  const applied = applySoftEvictionPlan({ turns, decision });
  const baselineRawTranscript = renderDialogueTurns(turns);
  const shadowRawTranscript = renderDialogueTurns(applied.keepTurns);
  const semanticPinNotes = buildSemanticPinNotes({
    turns,
    pinTurnIds: applied.pinnedOnlyTurnIds
  });
  const archiveSummary = normalizeString(applied.archiveSummary);
  const compactArchiveSummary = normalizeWhitespace(archiveSummary)
    ? normalizeWhitespace(archiveSummary).slice(0, 96).trim().replace(/[，。,.\s]+$/u, "")
    : "";
  const includeArchiveSummary = Boolean(compactArchiveSummary)
    && semanticPinNotes.length === 0
    && applied.keepTurns.length <= 1
    && ["switch", "resolve"].includes(applied.relation);
  const injectedArchiveSummary = includeArchiveSummary ? `${compactArchiveSummary}...` : "";
  const shadowPackageText = buildSummaryFirstWorkingSetText({
    applied,
    semanticPinNotes
  });

  return {
    applied,
    baselineRawTranscript,
    shadowRawTranscript,
    semanticPinNotes,
    archiveSummary,
    injectedArchiveSummary,
    baselinePromptEstimate: estimateTokenCountFromText(baselineRawTranscript),
    shadowRawPromptEstimate: estimateTokenCountFromText(shadowRawTranscript),
    shadowPackageEstimate: estimateTokenCountFromText(shadowPackageText),
    shadowPackageText
  };
}
