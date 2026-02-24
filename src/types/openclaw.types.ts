/**
 * OpenClaw-style agent template: multiple markdown files that define
 * soul (personality/values), skills, methodology, failed_tests, persona, etc.
 * Stored in agent modelSettings.openclaw and optionally mirrored to persona for API.
 */

export const OPENCLAW_DOC_IDS = [
  "soul",
  "persona",
  "skill",
  "methodology",
  "failed_tests",
  "context",
  "constraints",
] as const;

export type OpenClawDocId = (typeof OPENCLAW_DOC_IDS)[number];

export interface OpenClawTemplate {
  soul: string;
  persona: string;
  skill: string;
  methodology: string;
  failed_tests: string;
  context: string;
  constraints: string;
}

export interface OpenClawDocMeta {
  id: OpenClawDocId;
  label: string;
  description: string;
}

export const OPENCLAW_DOC_META: OpenClawDocMeta[] = [
  {
    id: "soul",
    label: "Soul (soul.md)",
    description: "Personality, values, and long-term instructions. Loaded first every cycle.",
  },
  {
    id: "persona",
    label: "Persona (persona.md)",
    description: "Who the agent is and how it presents. Primary system prompt content.",
  },
  {
    id: "skill",
    label: "Skill (skill.md)",
    description: "Skills and capabilities. YAML frontmatter + instructions.",
  },
  {
    id: "methodology",
    label: "Methodology",
    description: "How the agent reasons and makes decisions.",
  },
  {
    id: "failed_tests",
    label: "Failed tests (failed_tests.md)",
    description: "Known failure cases and how to avoid them.",
  },
  {
    id: "context",
    label: "Context",
    description: "Domain context and background knowledge.",
  },
  {
    id: "constraints",
    label: "Constraints",
    description: "Hard boundaries and guardrails.",
  },
];

const DEFAULT_SOUL = `---
name: Agent Soul
version: 1
enabled: true
---

# Personality overview
Define who this AI is: traits, role, and what it is NOT.

# Communication style
Tone, language patterns, and formatting preferences.

# Behavioral guidelines
What the agent does and does not do.

# Guardrails
Hard boundaries that must not be crossed.
`;

const DEFAULT_PERSONA = `You are a prediction market trading agent.
Define your persona, constraints, and context here.
This markdown is used as the system prompt for the LLM.
`;

const DEFAULT_SKILL = `---
name: Trading Skill
description: Prediction market trading capabilities
---

# Skills
- Analyze markets and outcomes
- Place and manage orders within risk limits
- Use tools (search, news, data) when configured
`;

const DEFAULT_METHODOLOGY = `# Reasoning methodology
- Gather relevant data before deciding
- Apply risk and slippage limits
- Prefer high-conviction, size-limited positions
`;

const DEFAULT_FAILED_TESTS = `# Failed tests (anti-patterns)
Document cases that should not repeat:
- Example: Over-sizing in low-liquidity markets
- Example: Ignoring max drawdown limits
`;

const DEFAULT_CONTEXT = `# Domain context
- Prediction markets: binary or multi-outcome
- AMM vs order book execution
- Slippage and spread tolerance
`;

const DEFAULT_CONSTRAINTS = `# Constraints
- Never exceed max slippage or spread tolerance
- Respect strategy preference (AMM / order book / hybrid)
- Do not expose keys or internal state
`;

export function getDefaultOpenClawTemplate(): OpenClawTemplate {
  return {
    soul: DEFAULT_SOUL,
    persona: DEFAULT_PERSONA,
    skill: DEFAULT_SKILL,
    methodology: DEFAULT_METHODOLOGY,
    failed_tests: DEFAULT_FAILED_TESTS,
    context: DEFAULT_CONTEXT,
    constraints: DEFAULT_CONSTRAINTS,
  };
}

const MAX_DOC_LENGTH = 50_000;

export function trimOpenClawDoc(value: string, max = MAX_DOC_LENGTH): string {
  if (value.length <= max) return value;
  return value.slice(0, max);
}
