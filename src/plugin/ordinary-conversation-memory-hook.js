import {
  createMemoryRegistry,
  createNamespaceKey,
  createReflectionSystem,
  createSourceSystem,
  parseVisibility,
  resolveOpenClawAgentNamespace,
  resolveOpenClawNamespace,
  resolveRegistryRoot
} from "../unified-memory-core/index.js";
import { extractLatestUserPrompt, messageContentToText } from "../utils.js";

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function normalizeStringMap(values) {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [normalizeString(key), normalizeString(value)])
      .filter(([key, value]) => key && value)
  );
}

function normalizeText(value, fallback = "") {
  return normalizeString(value, fallback).replace(/\s+/g, " ").trim();
}

function hasChineseText(value = "") {
  return /[\u4e00-\u9fff]/u.test(String(value || ""));
}

function resolveWorkspaceIdForAgent(governedExports = {}, agentId = "") {
  const overrides = normalizeStringMap(governedExports.agentWorkspaceIds);
  const normalizedAgentId = normalizeString(agentId);

  if (normalizedAgentId && overrides[normalizedAgentId]) {
    return overrides[normalizedAgentId];
  }

  return normalizeString(governedExports.workspaceId, "default-workspace");
}

function resolveOrdinaryConversationConfig(pluginConfig = {}) {
  const raw = pluginConfig?.openclawAdapter?.ordinaryConversationMemory || {};
  const governedExports = pluginConfig?.openclawAdapter?.governedExports || {};
  const registryResolution = resolveRegistryRoot({
    explicitDir: governedExports.registryDir
  });

  return {
    enabled: raw.enabled !== false,
    visibility: parseVisibility(raw.visibility || "workspace"),
    maxUserChars: Number.isFinite(raw.maxUserChars)
      ? Math.max(32, Math.min(4000, Number(raw.maxUserChars)))
      : 800,
    governedExports: {
      registryDir: registryResolution.registryDir,
      registryResolution,
      workspaceId: resolveWorkspaceIdForAgent(governedExports, ""),
      agentWorkspaceIds: normalizeStringMap(governedExports.agentWorkspaceIds),
      agentNamespace: {
        enabled: governedExports?.agentNamespace?.enabled === true
      },
      tenant: normalizeString(governedExports.tenant, "local"),
      scope: normalizeString(governedExports.scope, "workspace"),
      resource: normalizeString(governedExports.resource, "openclaw-shared-memory"),
      host: normalizeString(governedExports.host, "")
    }
  };
}

function resolveOrdinaryConversationNamespace(config, ctx = {}) {
  const governedExports = config.governedExports;
  const workspaceId = resolveWorkspaceIdForAgent(governedExports, ctx.agentId);
  const baseContext = {
    workspaceId,
    tenant: governedExports.tenant,
    scope: governedExports.scope,
    resource: governedExports.resource,
    host: governedExports.host
  };

  if (governedExports.agentNamespace.enabled && normalizeString(ctx.agentId)) {
    return resolveOpenClawAgentNamespace({
      ...baseContext,
      agentId: normalizeString(ctx.agentId)
    });
  }

  return resolveOpenClawNamespace(baseContext);
}

function lastAssistantReply(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const item = messages[index];
    if (!item || item.role !== "assistant") {
      continue;
    }
    const text = normalizeText(messageContentToText(item.content));
    if (text) {
      return text;
    }
  }
  return "";
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

const SESSION_MARKERS = [
  /\bthis session\b/i,
  /\bfor this session\b/i,
  /\bin this chat\b/i,
  /\bfor this chat\b/i,
  /\bonly in this project\b/i,
  /\bfor this project only\b/i,
  /这个会话里/u,
  /这轮会话/u,
  /在这个项目里/u,
  /离开这个项目/u,
  /只在这个项目/u,
  /本轮/u
];

const ONE_OFF_MARKERS = [
  /\bthis time only\b/i,
  /\bjust this once\b/i,
  /\bonly this time\b/i,
  /\bdon't remember\b/i,
  /\bdo not remember\b/i,
  /\bno need to remember\b/i,
  /只处理这一次/u,
  /只这一次/u,
  /不用记住/u,
  /别记住/u,
  /不要记住/u
];

const DURABLE_FUTURE_MARKERS = [
  /\bfrom now on\b/i,
  /\bgoing forward\b/i,
  /\bin future\b/i,
  /\bwhenever i\b/i,
  /\bany time i\b/i,
  /\bdefault to\b/i,
  /\bremember this\b/i,
  /\balways\b/i,
  /\bprefer\b/i,
  /\bi usually\b/i,
  /\bmy timezone is\b/i,
  /以后/u,
  /之后/u,
  /默认/u,
  /记住/u,
  /平时/u,
  /优先/u
];

const TOOL_ROUTING_MARKERS = [
  /\b(?:use|run|call|invoke|route(?:\s+it)?\s+through|handle(?:\s+it)?\s+with)\s+(?:the\s+)?[a-z][a-z0-9]*_[a-z0-9_]+\b/i,
  /\btool\b/i,
  /工具/u
];

const REPLY_STYLE_MARKERS = [
  /\breply in\b/i,
  /\brespond in\b/i,
  /\bkeep replies short\b/i,
  /回复/u,
  /都用中文/u,
  /尽量短/u
];

const PROFILE_FACT_MARKERS = [
  /\bmy timezone is\b/i,
  /\bi prefer\b/i,
  /\bi usually\b/i,
  /\bdefault to chinese\b/i,
  /\bprefer chinese\b/i,
  /\bdefault to\b/i,
  /\bprefer .*updates?\b/i,
  /我平时/u,
  /默认优先给我中文/u,
  /都用中文回复/u,
  /北京时间/u,
  /时区/u
];

function inferTriggerDescriptor(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return null;
  }

  const domains = [];
  let contentKind = "";
  let label = "";

  const patterns = [
    {
      test: /小红书|xiaohongshu|xhslink/i,
      contentKind: "xiaohongshu_link",
      labelEn: "a Xiaohongshu link",
      labelZh: "小红书链接",
      domains: ["xhslink.com", "xiaohongshu.com"]
    },
    {
      test: /\bpull request\b|\bpr link\b|PR 链接/u,
      contentKind: "pull_request_link",
      labelEn: "a pull request link",
      labelZh: "PR 链接",
      domains: ["github.com"]
    },
    {
      test: /github/i,
      contentKind: "github_repo_link",
      labelEn: "a GitHub repository link",
      labelZh: "GitHub 仓库链接",
      domains: ["github.com"]
    },
    {
      test: /slack thread|Slack 线程/u,
      contentKind: "slack_thread",
      labelEn: "a Slack thread URL",
      labelZh: "Slack 线程链接",
      domains: []
    },
    {
      test: /notion export|Notion 导出/u,
      contentKind: "notion_export",
      labelEn: "a Notion export package",
      labelZh: "Notion 导出包",
      domains: []
    },
    {
      test: /receipt screenshot|发票截图/u,
      contentKind: "receipt_screenshot",
      labelEn: "a receipt screenshot",
      labelZh: "发票截图",
      domains: []
    },
    {
      test: /csv export|CSV 导出/u,
      contentKind: "csv_export",
      labelEn: "a CSV export",
      labelZh: "CSV 导出",
      domains: []
    },
    {
      test: /hotel options|酒店方案/u,
      contentKind: "hotel_options",
      labelEn: "hotel options",
      labelZh: "酒店方案",
      domains: []
    }
  ];

  for (const pattern of patterns) {
    if (!pattern.test.test(normalized)) {
      continue;
    }
    contentKind = pattern.contentKind;
    label = hasChineseText(normalized) ? pattern.labelZh : pattern.labelEn;
    domains.push(...pattern.domains);
    break;
  }

  if (!contentKind && !domains.length && !label) {
    return null;
  }

  return {
    content_kind: contentKind,
    domains,
    label
  };
}

function extractToolName(text = "") {
  const normalized = normalizeText(text);
  if (!normalized) {
    return "";
  }

  const patterns = [
    /\b(?:use|run|call|invoke|route(?:\s+it)?\s+through|handle(?:\s+it)?\s+with)\s+(?:the\s+)?([a-z][a-z0-9]*_[a-z0-9_]+)\b/i,
    /(?:用|调用|走|先用|优先用|先跑|优先跑)\s*([a-z][a-z0-9]*_[a-z0-9_]+)\b/u
  ];

  for (const pattern of patterns) {
    const value = normalizeString(normalized.match(pattern)?.[1]);
    if (value) {
      return value;
    }
  }

  return "";
}

function inferStructuredRule(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return null;
  }

  const triggerDescriptor = inferTriggerDescriptor(normalized);
  const toolName = extractToolName(normalized);

  if (!toolName && !triggerDescriptor) {
    return null;
  }

  return {
    trigger: {
      content_kind: normalizeString(triggerDescriptor?.content_kind),
      domains: Array.isArray(triggerDescriptor?.domains) ? triggerDescriptor.domains : [],
      label: normalizeString(triggerDescriptor?.label)
    },
    action: {
      tool: toolName
    }
  };
}

function extractNamedMemoryCue(text = "") {
  const normalized = normalizeText(text);
  if (!normalized) {
    return null;
  }

  const patterns = [
    { kind: "keyword", match: normalized.match(/\bkeyword\s+[`'"]?([a-z0-9_-]+)[`'"]?/i) },
    { kind: "tag", match: normalized.match(/\btag(?:\s+the\s+result)?(?:\s+with)?\s+[`'"]?([a-z0-9_-]+)[`'"]?/i) },
    { kind: "codename", match: normalized.match(/\bcodename(?:d)?(?:\s+(?:called|is))?\s+[`'"]?([a-z0-9_-]+)[`'"]?/i) },
    { kind: "代号", match: normalized.match(/代号(?:叫做|是)?\s*([^\s，。；;、]+)/u) },
    { kind: "关键词", match: normalized.match(/关键词(?:叫做|是)?\s*([^\s，。；;、]+)/u) },
    { kind: "标签", match: normalized.match(/打\s*([a-z0-9_-]+)\s*标签/i) },
    { kind: "标签", match: normalized.match(/标签(?:叫做|是)?\s*([a-z0-9_-]+)/i) }
  ];

  for (const item of patterns) {
    const value = normalizeString(item.match?.[1]);
    if (value) {
      return {
        kind: item.kind,
        value
      };
    }
  }

  return null;
}

function extractPriorityActionClause(text = "", isChinese = false) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return "";
  }

  if (isChinese) {
    const match = normalized.match(/(先[^。；;，,]+)/u);
    return normalizeString(match?.[1]);
  }

  const patterns = [
    /\b(first\s+[^.;,]+)/i,
    /\b(check\s+[^.;,]*?\bfirst)\b/i,
    /\b(compare\s+[^.;,]*?\bfirst)\b/i,
    /\b(show\s+[^.;,]*?\bfirst)\b/i,
    /\b(use\s+[^.;,]*?\bfirst)\b/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const clause = normalizeString(match?.[1]);
    if (clause) {
      return clause;
    }
  }

  return "";
}

function buildOrdinaryConversationSummary({
  userMessage = "",
  category = "",
  structuredRule = null,
  namedCue = null
} = {}) {
  const userText = normalizeText(userMessage);
  if (!userText) {
    return "";
  }

  const isChinese = hasChineseText(userText);
  const trigger = structuredRule?.trigger || {};
  const action = structuredRule?.action || {};
  const triggerLabel = normalizeString(trigger.label);
  const actionTool = normalizeString(action.tool);
  const cueValue = normalizeString(namedCue?.value);
  const priorityClause = extractPriorityActionClause(userText, isChinese);

  if ((category === "durable_rule" || category === "tool_routing_preference") && triggerLabel) {
    if (actionTool && cueValue) {
      return isChinese
        ? `只要用户发${triggerLabel}，先用 ${actionTool}，并使用 ${cueValue}${namedCue?.kind === "标签" || namedCue?.kind === "tag" ? " 标签" : namedCue?.kind === "关键词" || namedCue?.kind === "keyword" ? " 关键词" : " 代号"}。`
        : `When the user sends ${triggerLabel}, use ${actionTool} first and use ${namedCue?.kind === "tag" ? "tag" : namedCue?.kind === "keyword" ? "keyword" : "codename"} ${cueValue}.`;
    }
    if (cueValue) {
      if (priorityClause) {
        return isChinese
          ? `只要用户发${triggerLabel}，${priorityClause}，默认规则${namedCue?.kind === "关键词" || namedCue?.kind === "keyword" ? "关键词" : "代号"}是 ${cueValue}。`
          : `When the user sends ${triggerLabel}, ${priorityClause}, and the default rule ${namedCue?.kind === "keyword" ? "keyword" : "codename"} is ${cueValue}.`;
      }
      return isChinese
        ? `只要用户发${triggerLabel}，默认规则${namedCue?.kind === "关键词" || namedCue?.kind === "keyword" ? "关键词" : "代号"}是 ${cueValue}。`
        : `When the user sends ${triggerLabel}, the default rule ${namedCue?.kind === "keyword" ? "keyword" : "codename"} is ${cueValue}.`;
    }
    if (actionTool) {
      return isChinese
        ? `只要用户发${triggerLabel}，先用 ${actionTool}。`
        : `When the user sends ${triggerLabel}, use ${actionTool} first.`;
    }
  }

  if (cueValue && (category === "durable_rule" || category === "tool_routing_preference")) {
    return isChinese
      ? `默认规则${namedCue?.kind === "关键词" || namedCue?.kind === "keyword" ? "关键词" : "代号"}是 ${cueValue}。`
      : `The default rule ${namedCue?.kind === "keyword" ? "keyword" : "codename"} is ${cueValue}.`;
  }

  return userText;
}

export function classifyOrdinaryConversationMemoryIntent({ userMessage = "", assistantReply = "" } = {}) {
  const userText = normalizeText(userMessage);
  const assistantText = normalizeText(assistantReply);

  if (!userText) {
    return null;
  }

  const lowercase = userText.toLowerCase();
  const sessionScoped = matchesAny(userText, SESSION_MARKERS);
  const oneOff = matchesAny(userText, ONE_OFF_MARKERS);
  const durableFuture = matchesAny(userText, DURABLE_FUTURE_MARKERS);
  const replyStyle = matchesAny(userText, REPLY_STYLE_MARKERS);
  const profileFact = matchesAny(userText, PROFILE_FACT_MARKERS);
  const structuredRule = inferStructuredRule(userText);
  const namedCue = extractNamedMemoryCue(userText);
  const toolRouting = matchesAny(userText, TOOL_ROUTING_MARKERS) || Boolean(structuredRule?.action?.tool);
  const likelySmallTalk = /堵|哈哈|随便聊|just chatting|traffic/i.test(userText);

  if (likelySmallTalk && !durableFuture && !profileFact && !toolRouting) {
    return null;
  }

  if (oneOff && !sessionScoped) {
    return null;
  }

  if (sessionScoped || (replyStyle && !durableFuture && !profileFact && !toolRouting)) {
    return {
      should_write_memory: true,
      category: "session_constraint",
      durability: "session",
      confidence: 0.91,
      summary: buildOrdinaryConversationSummary({
        userMessage: userText,
        category: "session_constraint",
        structuredRule,
        namedCue
      }),
      user_message: userText,
      assistant_reply: assistantText,
      structured_rule: structuredRule
    };
  }

  if (toolRouting && durableFuture) {
    return {
      should_write_memory: true,
      category: "tool_routing_preference",
      durability: "durable",
      confidence: 0.96,
      summary: buildOrdinaryConversationSummary({
        userMessage: userText,
        category: "tool_routing_preference",
        structuredRule,
        namedCue
      }),
      user_message: userText,
      assistant_reply: assistantText,
      structured_rule: structuredRule
    };
  }

  if (profileFact && !toolRouting) {
    return {
      should_write_memory: true,
      category: "user_profile_fact",
      durability: "durable",
      confidence: 0.9,
      summary: buildOrdinaryConversationSummary({
        userMessage: userText,
        category: "user_profile_fact",
        structuredRule,
        namedCue
      }),
      user_message: userText,
      assistant_reply: assistantText,
      structured_rule: null
    };
  }

  if (durableFuture) {
    return {
      should_write_memory: true,
      category: "durable_rule",
      durability: "durable",
      confidence: lowercase.includes("github") ? 0.93 : 0.84,
      summary: buildOrdinaryConversationSummary({
        userMessage: userText,
        category: "durable_rule",
        structuredRule,
        namedCue
      }),
      user_message: userText,
      assistant_reply: assistantText,
      structured_rule: structuredRule
    };
  }

  return null;
}

export function createOpenClawOrdinaryConversationMemorySource({
  event = {},
  ctx = {},
  pluginConfig = {}
} = {}) {
  const config = resolveOrdinaryConversationConfig(pluginConfig);
  if (!config.enabled || !event.success) {
    return null;
  }

  const messages = Array.isArray(event.messages) ? event.messages : [];
  const userMessage = normalizeText(extractLatestUserPrompt(messages));
  const assistantReply = normalizeText(lastAssistantReply(messages));

  if (!userMessage || userMessage.length > config.maxUserChars) {
    return null;
  }

  const memoryIntent = classifyOrdinaryConversationMemoryIntent({
    userMessage,
    assistantReply
  });

  if (!memoryIntent?.should_write_memory) {
    return null;
  }

  return {
    sourceType: "memory_intent",
    declaredBy: "openclaw-plugin:ordinary-conversation",
    namespace: resolveOrdinaryConversationNamespace(config, ctx),
    visibility: config.visibility,
    shouldWriteMemory: true,
    category: memoryIntent.category,
    durability: memoryIntent.durability,
    confidence: memoryIntent.confidence,
    summary: memoryIntent.summary,
    userMessage: memoryIntent.user_message,
    assistantReply: memoryIntent.assistant_reply,
    structuredRule: memoryIntent.structured_rule
  };
}

export function createOpenClawOrdinaryConversationHookRuntime(options = {}) {
  const clock = options.clock || (() => new Date());
  const logger = options.logger;
  const pluginConfig = options.pluginConfig || {};
  const config = resolveOrdinaryConversationConfig(pluginConfig);
  const registry = createMemoryRegistry({
    rootDir: config.governedExports.registryDir,
    clock
  });
  const sourceSystem = createSourceSystem({
    clock,
    defaultNamespace: resolveOrdinaryConversationNamespace(config, {}),
    defaultVisibility: config.visibility
  });
  const reflectionSystem = createReflectionSystem({
    registry,
    clock
  });
  const writeChains = new Map();

  async function withNamespaceWriteLock(namespace, task) {
    const namespaceKey = createNamespaceKey(namespace);
    const previous = writeChains.get(namespaceKey) || Promise.resolve();
    const next = previous.then(task, task);
    const settled = next.finally(() => {
      if (writeChains.get(namespaceKey) === settled) {
        writeChains.delete(namespaceKey);
      }
    });
    writeChains.set(namespaceKey, settled);
    return settled;
  }

  async function captureAgentEnd(event = {}, ctx = {}) {
    const declaredSource = createOpenClawOrdinaryConversationMemorySource({
      event,
      ctx,
      pluginConfig
    });

    if (!declaredSource) {
      return null;
    }

    return withNamespaceWriteLock(declaredSource.namespace, async () => {
      const sourceResult = await sourceSystem.ingestDeclaredSource(declaredSource);
      const sourceRecord = await registry.persistSourceArtifact(sourceResult.sourceArtifact);
      const reflection = await reflectionSystem.runReflection({
        sourceArtifacts: [sourceResult.sourceArtifact],
        persistCandidates: true,
        decidedBy: declaredSource.declaredBy
      });
      const promoted = [];

      for (const output of reflection.outputs) {
        if (!output.recommendation.should_promote) {
          continue;
        }
        promoted.push(await registry.promoteCandidateToStable({
          candidateArtifactId: output.candidate_artifact.artifact_id,
          decidedBy: declaredSource.declaredBy,
          reasonCodes: [
            "openclaw_memory_intent_promotion",
            `label:${output.primary_label}`,
            `route:${output.candidate_artifact.attributes?.memory_intent_admission_route || "unknown"}`
          ]
        }));
      }

      logger?.info?.(
        `[unified-memory-core] openclaw ordinary conversation memory captured (namespace=${createNamespaceKey(declaredSource.namespace)}, route=${reflection.outputs[0]?.candidate_artifact?.attributes?.memory_intent_admission_route || "unknown"}, promoted=${promoted.length})`
      );

      return {
        declared_source: declaredSource,
        sourceManifest: sourceResult.sourceManifest,
        sourceArtifact: sourceResult.sourceArtifact,
        sourceRecord,
        reflection,
        promoted
      };
    });
  }

  return {
    enabled: config.enabled,
    config,
    captureAgentEnd
  };
}
