/**
 * Zod schemas for Settings and Agent Studio forms.
 * Aligned with Prisma/API: profile, agent strategy, model settings, vault.
 * OpenClaw template: soul, persona, skill, methodology, failed_tests, context, constraints.
 */

import { z } from "zod/v3";
import { OPENCLAW_DOC_IDS } from "@/types/openclaw.types";

export const strategyPrefEnum = z.enum(["AMM_ONLY", "ORDERBOOK", "HYBRID"]);
export type StrategyPref = z.infer<typeof strategyPrefEnum>;

export const profileSchema = z.object({
  username: z.string().min(1, "Username is required").max(64).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

const openclawDocSchema = z.object({
  soul: z.string().max(50_000),
  persona: z.string().max(50_000),
  skill: z.string().max(50_000),
  methodology: z.string().max(50_000),
  failed_tests: z.string().max(50_000),
  context: z.string().max(50_000),
  constraints: z.string().max(50_000),
});

export const agentStudioSchema = z.object({
  agentId: z.string().optional(),
  name: z.string().min(1, "Agent name is required").max(120),
  persona: z.string().max(50_000),
  openclaw: openclawDocSchema,
  strategyPreference: strategyPrefEnum,
  maxSlippage: z.number().min(0.1).max(5),
  spreadTolerance: z.number().min(0).max(1),
  model: z.string().min(1, "Model is required"),
  temperature: z.number().min(0).max(2),
  toolInternetSearch: z.boolean(),
  toolNewsCrawler: z.boolean(),
  toolTwitter: z.boolean(),
  toolSportsData: z.boolean(),
});

export type AgentStudioFormValues = z.infer<typeof agentStudioSchema>;

export const vaultSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (v) => !Number.isNaN(Number(v)) && Number(v) > 0,
    "Enter a valid positive amount"
  ),
  action: z.enum(["deposit", "withdraw"]),
});

export type VaultFormValues = z.infer<typeof vaultSchema>;

export const MODEL_OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
] as const;

export const STRATEGY_OPTIONS: { value: StrategyPref; label: string }[] = [
  { value: "AMM_ONLY", label: "AMM only" },
  { value: "ORDERBOOK", label: "Order book" },
  { value: "HYBRID", label: "Hybrid" },
];

export const TOOL_OPTIONS = [
  { id: "toolInternetSearch" as const, label: "Internet Search" },
  { id: "toolNewsCrawler" as const, label: "News Crawler" },
  { id: "toolTwitter" as const, label: "X / Twitter Posts" },
  { id: "toolSportsData" as const, label: "Sports Data" },
] as const;
