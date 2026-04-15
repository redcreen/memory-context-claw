function normalizePromptText(value) {
  return String(value || "").trim();
}

export function isMemoryScopedPrompt(message) {
  const text = normalizePromptText(message);
  if (!text) return false;
  return [
    /^based only on your memory for this agent[,，:：]?\s*/i,
    /^only based on your memory for this agent[,，:：]?\s*/i,
    /^仅根据你当前这个 agent 的记忆[，,:：]?\s*/u,
    /^只根据你当前这个 agent 的记忆[，,:：]?\s*/u,
    /^只根据当前记忆[，,:：]?\s*/u,
    /^仅根据当前记忆[，,:：]?\s*/u
  ].some((pattern) => pattern.test(text));
}

export function buildAgentEvalPrompt(message, { toolHintEnabled = true } = {}) {
  const text = normalizePromptText(message);
  if (!text) return "";
  if (!toolHintEnabled) return text;
  if (isMemoryScopedPrompt(text)) return text;
  return `Use the memory_search tool first if needed before answering. ${text}`;
}
