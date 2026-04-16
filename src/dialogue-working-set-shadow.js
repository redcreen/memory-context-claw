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

export function buildShadowContextSnapshot({
  turns = [],
  decision = {}
} = {}) {
  const applied = applySoftEvictionPlan({ turns, decision });
  const baselineRawTranscript = renderDialogueTurns(turns);
  const shadowRawTranscript = renderDialogueTurns(applied.keepTurns);
  const semanticPinNotes = buildSemanticPinNotes({
    turns,
    pinTurnIds: applied.pinTurnIds
  });
  const archiveSummary = normalizeString(applied.archiveSummary);
  const compactArchiveSummary = normalizeWhitespace(archiveSummary)
    ? normalizeWhitespace(archiveSummary).slice(0, 96).trim().replace(/[，。,.\s]+$/u, "")
    : "";
  const includeArchiveSummary = Boolean(compactArchiveSummary)
    && semanticPinNotes.length === 0
    && applied.keepTurns.length <= 2
    && ["switch", "resolve"].includes(applied.relation);
  const injectedArchiveSummary = includeArchiveSummary ? `${compactArchiveSummary}...` : "";
  const semanticPinsText = semanticPinNotes.join("\n");
  const shadowPackageText = [
    shadowRawTranscript ? `Active raw turns:\n${shadowRawTranscript}` : "",
    semanticPinNotes.length ? `Semantic pins:\n${semanticPinsText}` : "",
    injectedArchiveSummary ? `Archived summary:\n${injectedArchiveSummary}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");

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
