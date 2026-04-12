function wrapText(text, width = 78) {
  const words = String(text || "").trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines = [];
  let current = words[0];
  for (const word of words.slice(1)) {
    if (`${current} ${word}`.length > width) {
      lines.push(current);
      current = word;
      continue;
    }
    current = `${current} ${word}`;
  }
  lines.push(current);
  return lines;
}

function renderAlignedEntries(entries, {
  indent = 2,
  width = 78,
  minKeyWidth = 16
} = {}) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }

  const keyWidth = Math.max(
    minKeyWidth,
    ...entries.map((entry) => String(entry.label).length)
  );
  const descriptionWidth = Math.max(24, width - indent - keyWidth - 3);
  const lines = [];

  for (const entry of entries) {
    const descriptionLines = wrapText(entry.description, descriptionWidth);
    lines.push(
      `${" ".repeat(indent)}${String(entry.label).padEnd(keyWidth)}  ${descriptionLines[0]}`
    );
    for (const line of descriptionLines.slice(1)) {
      lines.push(`${" ".repeat(indent + keyWidth + 2)}  ${line}`);
    }
  }

  return lines;
}

function renderExamples(examples = [], { mode = "full" } = {}) {
  const lines = [];
  for (const example of examples) {
    if (!isAvailableInMode(example, mode)) {
      continue;
    }
    lines.push(`  ${example.command}`);
    if (example.description) {
      lines.push(`    ${example.description}`);
    }
  }
  return lines;
}

function uniqueOptions(optionGroups = []) {
  const seen = new Set();
  const merged = [];
  for (const option of optionGroups.flat()) {
    if (!option || seen.has(option.flag)) {
      continue;
    }
    seen.add(option.flag);
    merged.push(option);
  }
  return merged;
}

function intersectOptions(commands = []) {
  if (!Array.isArray(commands) || commands.length === 0) {
    return [];
  }

  const [firstCommand, ...rest] = commands;
  const firstOptions = Array.isArray(firstCommand.options) ? firstCommand.options : [];
  return firstOptions.filter((option) => rest.every((command) => (
    Array.isArray(command.options) && command.options.some((candidate) => candidate.flag === option.flag)
  )));
}

const HELP_OPTION = {
  flag: "-h, --help",
  description: "Display help for command"
};

const WRAPPER_OPTIONS = [
  {
    flag: "--portable",
    description: "Force the portable CLI backend even when full scripts are present"
  },
  {
    flag: "--print-cli-path",
    description: "Print the resolved wrapper and backend paths before running"
  },
  {
    flag: "--no-cli-path",
    description: "Suppress wrapper and backend path output"
  },
  HELP_OPTION
];

const REGISTRY_OPTIONS = [
  {
    flag: "--registry-dir <dir>",
    description: "Override the registry root directory"
  }
];

const NAMESPACE_OPTIONS = [
  {
    flag: "--tenant <tenant>",
    description: "Namespace tenant (default: local)"
  },
  {
    flag: "--scope <scope>",
    description: "Namespace scope (default: workspace)"
  },
  {
    flag: "--resource <name>",
    description: "Namespace resource (default: unified-memory-core)"
  },
  {
    flag: "--key <key>",
    description: "Namespace key (default: default)"
  },
  {
    flag: "--host <host>",
    description: "Optional host discriminator for host-neutral registry layouts"
  },
  {
    flag: "--visibility <level>",
    description: "Artifact visibility (default: workspace)"
  }
];

const SOURCE_INPUT_OPTIONS = [
  {
    flag: "--source-type <type>",
    description: "Declared source type (manual|conversation|file|directory|url|image)"
  },
  {
    flag: "--content <text>",
    description: "Inline content for manual, conversation, or URL sources"
  },
  {
    flag: "--path <path>",
    description: "Local file, directory, or image path"
  },
  {
    flag: "--url <url>",
    description: "Canonical URL for URL-backed sources"
  },
  {
    flag: "--title <title>",
    description: "Human-readable title for URL sources"
  },
  {
    flag: "--content-type <mime>",
    description: "Explicit content type for URL sources"
  },
  {
    flag: "--role <role>",
    description: "Conversation role when --source-type conversation is used"
  },
  {
    flag: "--alt-text <text>",
    description: "Alt text for image sources"
  },
  {
    flag: "--caption <text>",
    description: "Caption for image sources"
  },
  {
    flag: "--ocr-text <text>",
    description: "OCR text for image sources"
  },
  {
    flag: "--declared-by <name>",
    description: "Writer id recorded in the artifact"
  }
];

const DECLARED_SOURCES_OPTIONS = [
  {
    flag: "--sources-file <json>",
    description: "Read declared sources from a JSON array or { declaredSources: [] } file"
  }
];

const FORMAT_OPTION = [
  {
    flag: "--format <format>",
    description: "Render output as markdown or json"
  }
];

const PROMOTION_OPTIONS = [
  {
    flag: "--dry-run",
    description: "Plan the operation without mutating artifacts"
  },
  {
    flag: "--promote",
    description: "Promote eligible candidates during the run"
  }
];

const LEARNING_LOOP_OPTIONS = [
  {
    flag: "--query <text>",
    description: "Policy or retrieval query used during loop validation"
  },
  {
    flag: "--task-prompt <text>",
    description: "Task prompt used for policy adaptation validation"
  },
  {
    flag: "--comparison-window-days <days>",
    description: "Time-window width for learning comparisons"
  },
  {
    flag: "--max-openclaw-candidates <n>",
    description: "Maximum OpenClaw candidates when auditing lifecycle outputs"
  },
  {
    flag: "--max-candidates <n>",
    description: "Maximum candidates considered during policy adaptation"
  },
  {
    flag: "--max-items <n>",
    description: "Maximum export items for policy adaptation checks"
  },
  {
    flag: "--max-policy-inputs <n>",
    description: "Maximum policy inputs emitted to consumers"
  }
];

const EXPORT_OPTIONS = [
  {
    flag: "--consumer <name>",
    description: "Consumer to build or inspect (generic|openclaw|codex)"
  },
  {
    flag: "--allowed-visibilities <list>",
    description: "Comma-separated visibility filter"
  },
  {
    flag: "--allowed-states <list>",
    description: "Comma-separated state filter"
  }
];

const EXPORT_REPRO_OPTIONS = [
  {
    flag: "--consumers <list>",
    description: "Comma-separated consumers for reproducibility audit"
  },
  {
    flag: "--runs <n>",
    description: "Repeated export runs for deterministic comparison"
  }
];

const REVIEW_OPTIONS = [
  {
    flag: "--repo-root <dir>",
    description: "Repository root for independent execution and release reviews"
  }
];

const MIGRATION_OPTIONS = [
  {
    flag: "--source-dir <dir>",
    description: "Source registry directory"
  },
  {
    flag: "--target-dir <dir>",
    description: "Target registry directory"
  },
  {
    flag: "--apply",
    description: "Perform the migration or split rehearsal instead of planning only"
  }
];

const GOVERNANCE_REPAIR_OPTIONS = [
  {
    flag: "--finding-code <code>",
    description: "Governance finding code to repair"
  },
  {
    flag: "--action <action>",
    description: "Repair action to record"
  },
  {
    flag: "--decided-by <name>",
    description: "Actor recorded in the repair decision"
  },
  {
    flag: "--target-record-ids <list>",
    description: "Comma-separated record ids scoped to the repair"
  },
  {
    flag: "--notes <list>",
    description: "Comma-separated notes captured with the repair record"
  },
  {
    flag: "--dry-run",
    description: "Plan the repair without mutating decision state"
  }
];

const GOVERNANCE_REPLAY_OPTIONS = [
  {
    flag: "--replayed-by <name>",
    description: "Actor recorded for the replay run"
  },
  {
    flag: "--export-id <id>",
    description: "Export id to replay"
  },
  {
    flag: "--input-refs <list>",
    description: "Comma-separated export input refs"
  },
  {
    flag: "--result <status>",
    description: "Replay result marker (default: queued)"
  },
  {
    flag: "--notes <list>",
    description: "Comma-separated notes captured with the replay record"
  }
];

const OPENCLAW_INSTALL_OPTIONS = [
  {
    flag: "--archive <bundle.tgz>",
    description: "Existing release bundle archive to install for verification"
  },
  {
    flag: "--openclaw-bin <path>",
    description: "OpenClaw CLI binary to use"
  },
  {
    flag: "--profile <name>",
    description: "OpenClaw profile name for isolated installation testing"
  },
  {
    flag: "--workspace <path>",
    description: "Workspace path used during the install verification"
  },
  {
    flag: "--output-dir <dir>",
    description: "Directory for generated bundle and verification artifacts"
  },
  {
    flag: "--expected-text <text>",
    description: "Text expected from the host validation query"
  },
  {
    flag: "--keep-profile",
    description: "Keep the temporary OpenClaw profile after verification"
  },
  {
    flag: "--keep-bundle",
    description: "Keep the generated release bundle after verification"
  }
];

const RELEASE_BUILD_OPTIONS = [
  {
    flag: "--repo-root <dir>",
    description: "Repository root used as the release bundle source"
  },
  {
    flag: "--output-dir <dir>",
    description: "Directory where the bundle archive should be written"
  }
];

const CLI_GROUPS = [
  {
    name: "source",
    summary: "Ingest declared sources into the registry",
    description: "Add declared source artifacts that can later be reflected, governed, and exported.",
    commands: [
      {
        name: "add",
        summary: "Persist one declared source artifact",
        usage: "source add [options]",
        options: uniqueOptions([
          SOURCE_INPUT_OPTIONS,
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc source add --source-type manual --content \"Remember this: prefer concise summaries.\"",
            description: "Persist one manual memory input."
          },
          {
            command: "umc source add --source-type file --path ./workspace/notes/family.md",
            description: "Persist a local note file as a declared source."
          },
          {
            command: "umc source add --source-type url --url https://example.com/profile --title \"Profile\" --content \"Durable profile facts.\"",
            description: "Persist a URL-backed source with inline content."
          }
        ]
      }
    ],
    examples: [
      {
        command: "umc source add --source-type manual --content \"Remember this: prefer concise summaries.\"",
        description: "Add one manual source artifact."
      },
      {
        command: "umc source add --source-type image --path ./workspace/memory/family-photo.png --caption \"Family trip\"",
        description: "Add an image source with attached context."
      }
    ]
  },
  {
    name: "learn",
    summary: "Run reflection, lifecycle, and policy loops",
    description: "Drive self-learning flows from one source or a declared source set.",
    commands: [
      {
        name: "daily-run",
        summary: "Run daily reflection for one or more declared sources",
        usage: "learn daily-run [options]",
        options: uniqueOptions([
          SOURCE_INPUT_OPTIONS,
          DECLARED_SOURCES_OPTIONS,
          PROMOTION_OPTIONS,
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc learn daily-run --sources-file ./tmp/sources.json --promote --format markdown",
            description: "Run a readable daily reflection batch."
          }
        ]
      },
      {
        name: "lifecycle-run",
        summary: "Run the Stage 3 learning lifecycle loop",
        usage: "learn lifecycle-run [options]",
        options: uniqueOptions([
          SOURCE_INPUT_OPTIONS,
          DECLARED_SOURCES_OPTIONS,
          PROMOTION_OPTIONS,
          LEARNING_LOOP_OPTIONS,
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc learn lifecycle-run --source-type manual --content \"Remember this: prefer concise progress reports.\" --format markdown",
            description: "Run the governed learning lifecycle for one manual input."
          }
        ]
      },
      {
        name: "policy-loop",
        summary: "Run the Stage 4 policy adaptation loop",
        usage: "learn policy-loop [options]",
        options: uniqueOptions([
          SOURCE_INPUT_OPTIONS,
          DECLARED_SOURCES_OPTIONS,
          PROMOTION_OPTIONS,
          LEARNING_LOOP_OPTIONS,
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc learn policy-loop --sources-file ./tmp/sources.json --query \"concise progress\" --task-prompt \"apply current governed coding policy\" --format markdown",
            description: "Run policy adaptation and render the audit in markdown."
          }
        ]
      }
    ],
    examples: [
      {
        command: "umc learn daily-run --sources-file ./tmp/sources.json --promote --format markdown",
        description: "Run daily reflection over a declared source batch."
      },
      {
        command: "umc learn lifecycle-run --source-type manual --content \"Remember this: prefer concise progress reports.\" --format markdown",
        description: "Run the Stage 3 lifecycle loop."
      },
      {
        command: "umc learn policy-loop --sources-file ./tmp/sources.json --query \"concise progress\" --format markdown",
        description: "Run the Stage 4 policy loop."
      }
    ]
  },
  {
    name: "reflect",
    summary: "Run one reflection pass from a declared source",
    description: "Execute a single reflection step without the larger lifecycle orchestration.",
    commands: [
      {
        name: "run",
        summary: "Reflect one declared source",
        usage: "reflect run [options]",
        options: uniqueOptions([
          SOURCE_INPUT_OPTIONS,
          PROMOTION_OPTIONS,
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc reflect run --source-type manual --content \"Remember this: new preference observed today.\" --promote",
            description: "Reflect one manual input and promote if eligible."
          }
        ]
      }
    ],
    examples: [
      {
        command: "umc reflect run --source-type manual --content \"Remember this: new preference observed today.\" --promote",
        description: "Run a single reflection pass."
      }
    ]
  },
  {
    name: "govern",
    summary: "Audit, repair, and replay governed artifacts",
    description: "Inspect governance signals, compare learning windows, and record repair or replay actions.",
    commands: [
      {
        name: "audit",
        summary: "Audit namespace governance state",
        usage: "govern audit [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          EXPORT_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc govern audit --format markdown",
            description: "Render the namespace governance audit."
          }
        ]
      },
      {
        name: "audit-learning",
        summary: "Audit the Stage 3 learning lifecycle",
        usage: "govern audit-learning [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          EXPORT_OPTIONS,
          LEARNING_LOOP_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc govern audit-learning --max-openclaw-candidates 12 --format markdown",
            description: "Inspect promoted learning artifacts and OpenClaw consumption."
          }
        ]
      },
      {
        name: "audit-policy",
        summary: "Audit the Stage 4 policy adaptation outputs",
        usage: "govern audit-policy [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          EXPORT_OPTIONS,
          LEARNING_LOOP_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc govern audit-policy --max-policy-inputs 8 --format markdown",
            description: "Inspect consumer-facing policy inputs."
          }
        ]
      },
      {
        name: "compare-learning",
        summary: "Compare learning outcomes across time windows",
        usage: "govern compare-learning [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          [
            {
              flag: "--current-window-days <days>",
              description: "Current comparison window length"
            },
            {
              flag: "--previous-window-days <days>",
              description: "Previous comparison window length"
            }
          ],
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc govern compare-learning --current-window-days 7 --previous-window-days 7 --format markdown",
            description: "Compare this week against the previous week."
          }
        ]
      },
      {
        name: "repair",
        summary: "Record a governance repair action",
        usage: "govern repair [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          EXPORT_OPTIONS,
          GOVERNANCE_REPAIR_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc govern repair --finding-code candidate_missing_decision_trail --action mark_for_review --format markdown",
            description: "Plan a generic governance repair record."
          }
        ]
      },
      {
        name: "repair-learning",
        summary: "Record a learning-specific governance repair action",
        usage: "govern repair-learning [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          GOVERNANCE_REPAIR_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc govern repair-learning --finding-code learning_candidate_ready_for_decay --action mark_learning_review --format markdown",
            description: "Plan a learning lifecycle repair."
          }
        ]
      },
      {
        name: "replay",
        summary: "Record a governance replay plan",
        usage: "govern replay [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          EXPORT_OPTIONS,
          GOVERNANCE_REPLAY_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc govern replay --result queued --format markdown",
            description: "Plan a generic replay run."
          }
        ]
      },
      {
        name: "replay-learning",
        summary: "Record a learning-specific replay plan",
        usage: "govern replay-learning [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          GOVERNANCE_REPLAY_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc govern replay-learning --result queued --format markdown",
            description: "Plan a learning replay run."
          }
        ]
      }
    ],
    examples: [
      {
        command: "umc govern audit-learning --format markdown",
        description: "Inspect the Stage 3 lifecycle audit."
      },
      {
        command: "umc govern audit-policy --format markdown",
        description: "Inspect Stage 4 policy inputs."
      },
      {
        command: "umc govern compare-learning --current-window-days 7 --previous-window-days 7 --format markdown",
        description: "Compare learning outputs across windows."
      }
    ]
  },
  {
    name: "export",
    summary: "Build and inspect consumer exports",
    description: "Work with generic, OpenClaw, and Codex consumer projections.",
    commands: [
      {
        name: "build",
        summary: "Build one consumer export payload",
        usage: "export build [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          EXPORT_OPTIONS,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc export build --consumer openclaw",
            description: "Build the OpenClaw export payload."
          }
        ]
      },
      {
        name: "inspect",
        summary: "Inspect one consumer export payload",
        usage: "export inspect [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          EXPORT_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc export inspect --consumer codex --format markdown",
            description: "Inspect the Codex export in markdown."
          }
        ]
      },
      {
        name: "reproducibility",
        summary: "Audit export determinism across repeated runs",
        usage: "export reproducibility [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          EXPORT_OPTIONS,
          EXPORT_REPRO_OPTIONS,
          LEARNING_LOOP_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc export reproducibility --consumers generic,openclaw,codex --runs 2 --format markdown",
            description: "Verify stable export determinism across consumers."
          }
        ]
      }
    ],
    examples: [
      {
        command: "umc export build --consumer openclaw",
        description: "Build a consumer export payload."
      },
      {
        command: "umc export inspect --consumer codex --format markdown",
        description: "Inspect a consumer export in readable form."
      }
    ]
  },
  {
    name: "maintenance",
    summary: "Run the end-to-end maintenance workflow",
    description: "Execute the combined maintenance workflow across reflection, governance, and exports.",
    commands: [
      {
        name: "run",
        summary: "Run the maintenance workflow",
        usage: "maintenance run [options]",
        options: uniqueOptions([
          SOURCE_INPUT_OPTIONS,
          DECLARED_SOURCES_OPTIONS,
          PROMOTION_OPTIONS,
          LEARNING_LOOP_OPTIONS,
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc maintenance run --sources-file ./tmp/sources.json --format markdown",
            description: "Run the full maintenance workflow over a source batch."
          }
        ]
      }
    ],
    examples: [
      {
        command: "umc maintenance run --sources-file ./tmp/sources.json --format markdown",
        description: "Run the end-to-end maintenance flow."
      }
    ]
  },
  {
    name: "registry",
    summary: "Inspect and migrate registry roots",
    description: "Inspect the active registry topology or plan a root migration.",
    commands: [
      {
        name: "inspect",
        summary: "Inspect the active registry topology",
        usage: "registry inspect [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc registry inspect --format markdown",
            description: "Render the current registry topology."
          }
        ]
      },
      {
        name: "migrate",
        summary: "Plan or apply a registry root migration",
        usage: "registry migrate [options]",
        options: uniqueOptions([
          REGISTRY_OPTIONS,
          MIGRATION_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc registry migrate --source-dir ~/.openclaw/unified-memory-core/registry --target-dir ~/.unified-memory-core/registry --format markdown",
            description: "Plan a host-neutral registry migration."
          }
        ]
      }
    ],
    examples: [
      {
        command: "umc registry inspect --format markdown",
        description: "Inspect the current registry root."
      },
      {
        command: "umc registry migrate --source-dir ~/.openclaw/unified-memory-core/registry --target-dir ~/.unified-memory-core/registry --format markdown",
        description: "Plan a registry migration."
      }
    ]
  },
  {
    name: "review",
    summary: "Review independent execution and split readiness",
    description: "Audit repo boundaries before independent execution changes or repo splits.",
    commands: [
      {
        name: "independent-execution",
        summary: "Review standalone execution readiness",
        usage: "review independent-execution [options]",
        options: uniqueOptions([
          REVIEW_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc review independent-execution --repo-root . --format markdown",
            description: "Audit independent execution readiness for the current repo."
          }
        ]
      },
      {
        name: "split-rehearsal",
        summary: "Plan or apply a registry split rehearsal",
        usage: "review split-rehearsal [options]",
        options: uniqueOptions([
          REVIEW_OPTIONS,
          MIGRATION_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc review split-rehearsal --source-dir ~/.unified-memory-core/registry --target-dir /tmp/umc-split --format markdown",
            description: "Plan a registry split rehearsal."
          }
        ]
      }
    ],
    examples: [
      {
        command: "umc review independent-execution --repo-root . --format markdown",
        description: "Review standalone readiness."
      },
      {
        command: "umc review split-rehearsal --source-dir ~/.unified-memory-core/registry --target-dir /tmp/umc-split --format markdown",
        description: "Plan a split rehearsal."
      }
    ]
  },
  {
    name: "verify",
    summary: "Run acceptance, install, and release gates",
    description: "Run repo-level, host-level, and release-preflight verification flows.",
    commands: [
      {
        name: "stage3-stage4",
        summary: "Run the Stage 3-4 acceptance flow",
        usage: "verify stage3-stage4 [options]",
        options: uniqueOptions([
          SOURCE_INPUT_OPTIONS,
          DECLARED_SOURCES_OPTIONS,
          PROMOTION_OPTIONS,
          LEARNING_LOOP_OPTIONS,
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc verify stage3-stage4 --sources-file ./tmp/sources.json --format markdown",
            description: "Run the Stage 3-4 acceptance gate."
          }
        ]
      },
      {
        name: "stage5",
        summary: "Run the Stage 5 acceptance flow",
        usage: "verify stage5 [options]",
        options: uniqueOptions([
          SOURCE_INPUT_OPTIONS,
          DECLARED_SOURCES_OPTIONS,
          PROMOTION_OPTIONS,
          LEARNING_LOOP_OPTIONS,
          REGISTRY_OPTIONS,
          NAMESPACE_OPTIONS,
          REVIEW_OPTIONS,
          MIGRATION_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc verify stage5 --sources-file ./tmp/sources.json --format markdown",
            description: "Run the Stage 5 acceptance gate."
          }
        ]
      },
      {
        name: "openclaw-install",
        summary: "Verify a release bundle through the real OpenClaw CLI",
        usage: "verify openclaw-install [options]",
        availability: ["full"],
        options: uniqueOptions([
          OPENCLAW_INSTALL_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc verify openclaw-install --format markdown",
            description: "Build or install a release bundle and validate it in an isolated OpenClaw profile."
          }
        ]
      },
      {
        name: "release-preflight",
        summary: "Run the complete release-preflight gate",
        usage: "verify release-preflight [options]",
        availability: ["full"],
        options: uniqueOptions([
          REVIEW_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc verify release-preflight --format markdown",
            description: "Run the strongest single release gate."
          }
        ]
      }
    ],
    examples: [
      {
        command: "umc verify stage3-stage4 --sources-file ./tmp/sources.json --format markdown",
        description: "Run the Stage 3-4 acceptance flow."
      },
      {
        command: "umc verify stage5 --sources-file ./tmp/sources.json --format markdown",
        description: "Run the Stage 5 acceptance flow."
      },
      {
        command: "umc verify release-preflight --format markdown",
        description: "Run the complete release-preflight gate.",
        availability: ["full"]
      }
    ]
  },
  {
    name: "release",
    summary: "Build releasable OpenClaw bundles",
    description: "Create a release bundle archive suitable for OpenClaw plugin installation.",
    commands: [
      {
        name: "build-bundle",
        summary: "Build an OpenClaw release bundle",
        usage: "release build-bundle [options]",
        availability: ["full"],
        options: uniqueOptions([
          RELEASE_BUILD_OPTIONS,
          FORMAT_OPTION,
          HELP_OPTION
        ]),
        examples: [
          {
            command: "umc release build-bundle --output-dir ./dist/openclaw-release --format markdown",
            description: "Build a distributable OpenClaw plugin bundle."
          }
        ]
      }
    ],
    examples: [
      {
        command: "umc release build-bundle --output-dir ./dist/openclaw-release --format markdown",
        description: "Build a releasable bundle archive."
      }
    ]
  }
];

const CLI_UTILITIES = [
  {
    name: "where",
    summary: "Print the active umc wrapper and backend paths",
    usage: "where",
    description: "Show the resolved wrapper path, backend path, and backend mode as JSON.",
    examples: [
      {
        command: "umc where",
        description: "Print the active command and backend locations."
      }
    ]
  },
  {
    name: "help",
    summary: "Display help for command",
    usage: "help [command] [subcommand]",
    description: "Show top-level, group, or subcommand help.",
    examples: [
      {
        command: "umc help",
        description: "Show top-level help."
      },
      {
        command: "umc help source",
        description: "Show help for the source command group."
      },
      {
        command: "umc help source add",
        description: "Show help for one specific subcommand."
      }
    ]
  }
];

function isAvailableInMode(item, mode) {
  return !Array.isArray(item.availability) || item.availability.includes(mode);
}

export function listCliGroups({ mode = "full" } = {}) {
  return CLI_GROUPS
    .map((group) => ({
      ...group,
      commands: group.commands.filter((command) => isAvailableInMode(command, mode))
    }))
    .filter((group) => group.commands.length > 0);
}

export function findCliGroup(name, { mode = "full" } = {}) {
  return listCliGroups({ mode }).find((group) => group.name === name) || null;
}

export function findCliCommand(groupName, commandName, { mode = "full" } = {}) {
  return findCliGroup(groupName, { mode })?.commands.find((command) => command.name === commandName) || null;
}

export function findCliUtility(name) {
  return CLI_UTILITIES.find((utility) => utility.name === name) || null;
}

export function classifyCliInvocation(positionals, { mode = "full" } = {}) {
  const [first = "", second = "", third = ""] = positionals;

  if (!first) {
    return { type: "root" };
  }

  if (first === "help") {
    if (!second) {
      return { type: "root" };
    }
    const utility = findCliUtility(second);
    if (utility && !third) {
      return { type: "utility", utility };
    }
    const group = findCliGroup(second, { mode });
    if (!group) {
      return { type: "unknown-group", name: second };
    }
    if (!third) {
      return { type: "group", group };
    }
    const command = findCliCommand(group.name, third, { mode });
    if (!command) {
      return { type: "unknown-subcommand", group, name: third };
    }
    return { type: "command", group, command };
  }

  const utility = findCliUtility(first);
  if (utility) {
    return { type: "utility", utility };
  }

  const group = findCliGroup(first, { mode });
  if (!group) {
    return { type: "unknown-group", name: first };
  }
  if (!second) {
    return { type: "group", group };
  }

  const command = findCliCommand(group.name, second, { mode });
  if (!command) {
    return { type: "unknown-subcommand", group, name: second };
  }

  return { type: "command", group, command };
}

export function renderRootHelp({
  programName = "umc",
  mode = "full"
} = {}) {
  const groups = listCliGroups({ mode });
  const lines = [];
  lines.push("Unified Memory Core CLI");
  lines.push("");
  lines.push(`Usage: ${programName} [options] [command]`);
  lines.push("");
  lines.push("Governed memory operations for source ingest, self-learning, export, and release verification.");
  lines.push("");
  lines.push("Options:");
  lines.push(...renderAlignedEntries(WRAPPER_OPTIONS.map((option) => ({
    label: option.flag,
    description: option.description
  })), { minKeyWidth: 18 }));
  lines.push("");
  lines.push("Commands:");
  lines.push(`  Hint: commands suffixed with * have subcommands. Run ${programName} <command> --help for details.`);
  lines.push(...renderAlignedEntries([
    ...groups.map((group) => ({
      label: `${group.name} *`,
      description: group.summary
    })),
    ...CLI_UTILITIES.map((utility) => ({
      label: utility.name,
      description: utility.summary
    }))
  ], { minKeyWidth: 18 }));
  lines.push("");
  lines.push("Examples:");
  lines.push(...renderExamples([
    {
      command: `${programName} source add --source-type manual --content "Remember this: prefer concise summaries."`,
      description: "Persist one manual source artifact."
    },
    {
      command: `${programName} learn lifecycle-run --source-type manual --content "Remember this: prefer concise progress reports." --format markdown`,
      description: "Run the governed Stage 3 lifecycle loop."
    },
    {
      command: `${programName} verify stage5 --sources-file ./tmp/sources.json --format markdown`,
      description: "Run the Stage 5 acceptance gate."
    },
    {
      command: `${programName} verify release-preflight --format markdown`,
      description: "Run the strongest release-preflight gate.",
      availability: ["full"]
    },
    {
      command: `${programName} where`,
      description: "Show which installed copy of umc is active."
    }
  ], { mode }));
  lines.push("");
  lines.push(`Run ${programName} help <command> for group help or ${programName} help <command> <subcommand> for one specific action.`);
  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderGroupHelp(groupName, {
  programName = "umc",
  mode = "full"
} = {}) {
  const group = findCliGroup(groupName, { mode });
  if (!group) {
    return renderRootHelp({ programName, mode });
  }

  const lines = [];
  lines.push(`Usage: ${programName} ${group.name} [options] [command]`);
  lines.push("");
  lines.push(group.description);
  lines.push("");
  lines.push("Commands:");
  lines.push(...renderAlignedEntries(group.commands.map((command) => ({
    label: command.name,
    description: command.summary
  })), { minKeyWidth: 20 }));
  lines.push("");
  lines.push("Common Options:");
  lines.push(...renderAlignedEntries(intersectOptions(group.commands).map((option) => ({
    label: option.flag,
    description: option.description
  })), { minKeyWidth: 24 }));
  lines.push("");
  lines.push("Examples:");
  lines.push(...renderExamples(group.examples, { mode }));
  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderCommandHelp(groupName, commandName, {
  programName = "umc",
  mode = "full"
} = {}) {
  const group = findCliGroup(groupName, { mode });
  const command = findCliCommand(groupName, commandName, { mode });
  if (!group || !command) {
    return renderGroupHelp(groupName, { programName, mode });
  }

  const lines = [];
  lines.push(`Usage: ${programName} ${command.usage}`);
  lines.push("");
  lines.push(command.summary);
  lines.push("");
  lines.push("Options:");
  lines.push(...renderAlignedEntries(command.options.map((option) => ({
    label: option.flag,
    description: option.description
  })), { minKeyWidth: 28 }));
  lines.push("");
  lines.push("Examples:");
  lines.push(...renderExamples(command.examples, { mode }));
  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderUtilityHelp(utilityName, {
  programName = "umc"
} = {}) {
  const utility = findCliUtility(utilityName);
  if (!utility) {
    return renderRootHelp({ programName });
  }

  const lines = [];
  lines.push(`Usage: ${programName} ${utility.usage}`);
  lines.push("");
  lines.push(utility.description);
  lines.push("");
  lines.push("Examples:");
  lines.push(...renderExamples(utility.examples));
  return `${lines.join("\n").trimEnd()}\n`;
}
