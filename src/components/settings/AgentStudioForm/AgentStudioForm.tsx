"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import * as Switch from "@radix-ui/react-switch";
import * as RadioGroup from "@radix-ui/react-radio-group";
import type { MDEditorProps } from "@uiw/react-md-editor";
import {
  agentStudioSchema,
  MODEL_OPTIONS,
  getDefaultModelOption,
  STRATEGY_OPTIONS,
  TOOL_OPTIONS,
  type AgentStudioFormValues,
  type StrategyPref,
} from "@/lib/settings.schema";

function MarkdownPreview({ source }: { source: string }) {
  const [Comp, setComp] = useState<React.ComponentType<{ source: string }> | null>(null);
  useEffect(() => {
    import("@uiw/react-md-editor").then((mod) => {
      const M = (mod.default as { Markdown?: React.ComponentType<{ source: string }> }).Markdown;
      if (M) setComp(() => M);
    });
  }, []);
  if (Comp) return <Comp source={source} />;
  return (
    <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
      {source || "—"}
    </pre>
  );
}
import { getMyAgents, getAgent, updateAgent } from "@/lib/api/agents";
import type { Agent } from "@/types/agent.types";
import {
  OPENCLAW_DOC_META,
  getDefaultOpenClawTemplate,
  type OpenClawDocId,
} from "@/types/openclaw.types";

const MDEditor = dynamic<MDEditorProps>(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

import "@uiw/react-md-editor/markdown-editor.css";

const DEFAULT_OPENCLAW = getDefaultOpenClawTemplate();

function getModelFromAgent(agent: Agent): string {
  const ms = agent.modelSettings;
  if (ms && typeof ms === "object" && "model" in ms && typeof ms.model === "string")
    return ms.model;
  return getDefaultModelOption();
}

function getTemperatureFromAgent(agent: Agent): number {
  const ms = agent.modelSettings;
  if (ms && typeof ms === "object" && typeof ms.temperature === "number")
    return Math.max(0, Math.min(2, ms.temperature));
  return 0.7;
}

function getStrategyFromAgent(agent: Agent): StrategyPref {
  const s = agent.strategy?.preference;
  if (s === "AMM_ONLY" || s === "ORDERBOOK" || s === "HYBRID") return s;
  return "HYBRID";
}

function getToolsFromAgent(agent: Agent): Record<string, boolean> {
  const ms = agent.modelSettings;
  if (!ms || typeof ms !== "object" || !("tools" in ms)) {
    return {
      toolInternetSearch: false,
      toolNewsCrawler: false,
      toolTwitter: false,
      toolSportsData: false,
    };
  }
  const t = ms.tools as Record<string, boolean> | undefined;
  return {
    toolInternetSearch: t?.internetSearch ?? false,
    toolNewsCrawler: t?.newsCrawler ?? false,
    toolTwitter: t?.twitter ?? false,
    toolSportsData: t?.sportsData ?? false,
  };
}

function getOpenClawFromAgent(agent: Agent): AgentStudioFormValues["openclaw"] {
  const ms = agent.modelSettings;
  const def = getDefaultOpenClawTemplate();
  if (!ms || typeof ms !== "object" || !("openclaw" in ms)) {
    return {
      ...def,
      persona: agent.persona ?? def.persona,
    };
  }
  const oc = ms.openclaw as Record<string, string> | undefined;
  if (!oc || typeof oc !== "object") {
    return { ...def, persona: agent.persona ?? def.persona };
  }
  return {
    soul: typeof oc.soul === "string" ? oc.soul : def.soul,
    persona: typeof oc.persona === "string" ? oc.persona : agent.persona ?? def.persona,
    skill: typeof oc.skill === "string" ? oc.skill : def.skill,
    methodology: typeof oc.methodology === "string" ? oc.methodology : def.methodology,
    failed_tests: typeof oc.failed_tests === "string" ? oc.failed_tests : def.failed_tests,
    context: typeof oc.context === "string" ? oc.context : def.context,
    constraints: typeof oc.constraints === "string" ? oc.constraints : def.constraints,
  };
}

export function AgentStudioForm() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] = useState<string | "new">("new");
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [openclawTab, setOpenclawTab] = useState<OpenClawDocId>("soul");

  const form = useForm<AgentStudioFormValues>({
    resolver: zodResolver(agentStudioSchema),
    defaultValues: {
      agentId: undefined,
      name: "",
      persona: DEFAULT_OPENCLAW.persona,
      openclaw: DEFAULT_OPENCLAW,
      strategyPreference: "HYBRID",
      maxSlippage: 1,
      spreadTolerance: 0.5,
      model: getDefaultModelOption(),
      temperature: 0.7,
      toolInternetSearch: false,
      toolNewsCrawler: false,
      toolTwitter: false,
      toolSportsData: false,
    },
  });

  useEffect(() => {
    let cancelled = false;
    getMyAgents({ limit: 100 })
      .then((res) => {
        if (!cancelled) setAgents(res.data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load agents");
      })
      .finally(() => {
        if (!cancelled) setLoadingAgents(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedId === "new" || !selectedId) {
      form.reset({
        agentId: undefined,
        name: "",
        persona: DEFAULT_OPENCLAW.persona,
        openclaw: DEFAULT_OPENCLAW,
        strategyPreference: "HYBRID",
        maxSlippage: 1,
        spreadTolerance: 0.5,
        model: getDefaultModelOption(),
        temperature: 0.7,
        toolInternetSearch: false,
        toolNewsCrawler: false,
        toolTwitter: false,
        toolSportsData: false,
      });
      return;
    }
    setLoadingAgent(true);
    getAgent(selectedId)
      .then((agent) => {
        const tools = getToolsFromAgent(agent);
        const openclaw = getOpenClawFromAgent(agent);
        form.reset({
          agentId: agent.id,
          name: agent.name,
          persona: openclaw.persona,
          openclaw,
          strategyPreference: getStrategyFromAgent(agent),
          maxSlippage: agent.strategy?.maxSlippage ?? 1,
          spreadTolerance: agent.strategy?.spreadTolerance ?? 0.5,
          model: getModelFromAgent(agent),
          temperature: getTemperatureFromAgent(agent),
          ...tools,
        });
      })
      .catch(() => toast.error("Failed to load agent"))
      .finally(() => setLoadingAgent(false));
  }, [selectedId]);

  const onSubmit = async (data: AgentStudioFormValues) => {
    const id =
      selectedId !== "new" ? (data.agentId ?? selectedId) : null;
    if (!id) {
      toast.info(
        "Agent creation requires wallet key setup. Use the app flow to create an agent."
      );
      return;
    }
    try {
      await updateAgent(id, {
        name: data.name,
        persona: data.openclaw.persona,
        modelSettings: {
          model: data.model,
          temperature: data.temperature,
          strategyPreference: data.strategyPreference,
          maxSlippage: data.maxSlippage,
          spreadTolerance: data.spreadTolerance,
          openclaw: data.openclaw,
          tools: {
            internetSearch: data.toolInternetSearch,
            newsCrawler: data.toolNewsCrawler,
            twitter: data.toolTwitter,
            sportsData: data.toolSportsData,
          },
        },
      });
      toast.success("Agent saved");
      const list = await getMyAgents({ limit: 100 });
      setAgents(list.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save agent");
    }
  };

  const activeOpenclawContent = form.watch(`openclaw.${openclawTab}`) ?? "";

  return (
    <section className="flex flex-col gap-6 p-4" aria-labelledby="agent-studio-heading">
      <header id="agent-studio-heading">
        <h2 className="text-lg font-semibold text-foreground">Agent Studio</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your AI trading agent persona, strategy, and tools.
        </p>
      </header>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <article
          className="rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
        >
          <h3 className="text-sm font-medium text-foreground">Agent</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value as string | "new")}
              disabled={loadingAgents}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent-violet focus:outline-none focus:ring-1 focus:ring-accent-violet"
              aria-label="Select agent"
            >
              <option value="new">Create New Agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {loadingAgent && (
              <span className="text-sm text-muted-foreground">Loading…</span>
            )}
          </div>
        </article>

        <article
          className="rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
        >
          <h3 className="text-sm font-medium text-foreground">OpenClaw template</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Soul, persona, skill, methodology, failed_tests, context, constraints (e.g. soul.md, skill.md, persona.md).
          </p>
          <nav className="mt-3 flex flex-wrap gap-1 border-b border-border pb-2" aria-label="OpenClaw docs">
            {OPENCLAW_DOC_META.map((meta) => (
              <button
                key={meta.id}
                type="button"
                onClick={() => setOpenclawTab(meta.id)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-violet ${
                  openclawTab === meta.id
                    ? "bg-accent-violet/20 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
                aria-current={openclawTab === meta.id ? "true" : undefined}
              >
                {meta.label}
              </button>
            ))}
          </nav>
          <p className="mt-1 text-xs text-muted-foreground">
            {OPENCLAW_DOC_META.find((m) => m.id === openclawTab)?.description}
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col">
              <span className="mb-1 text-xs font-medium text-muted-foreground">Edit</span>
              <Controller
                name={`openclaw.${openclawTab}`}
                control={form.control}
                render={({ field }) => (
                  <div data-color-mode="dark" className="flex-1 overflow-hidden rounded-lg">
                    <MDEditor
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? "")}
                      height={280}
                      preview="edit"
                      visibleDragbar={false}
                    />
                  </div>
                )}
              />
            </div>
            <div className="flex flex-col">
              <span className="mb-1 text-xs font-medium text-muted-foreground">Preview</span>
              <div className="min-h-[280px] overflow-auto rounded-lg border border-border bg-background p-4">
                <MarkdownPreview source={activeOpenclawContent} />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-muted-foreground">
              Agent name
            </label>
            <input
              {...form.register("name")}
              className="mt-1 w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent-violet focus:outline-none focus:ring-1 focus:ring-accent-violet"
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-danger">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
        </article>

        <article
          className="rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
        >
          <h3 className="text-sm font-medium text-foreground">Trading strategy</h3>
          <Controller
            name="strategyPreference"
            control={form.control}
            render={({ field }) => (
              <RadioGroup.Root
                value={field.value}
                onValueChange={field.onChange}
                className="mt-3 flex flex-wrap gap-4"
                aria-label="Strategy preference"
              >
                {STRATEGY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <RadioGroup.Item
                      value={opt.value}
                      className="h-4 w-4 rounded-full border-2 border-border bg-background outline-none focus:ring-2 focus:ring-accent-violet data-[state=checked]:border-accent-violet data-[state=checked]:bg-accent-violet"
                    />
                    <span className="text-sm text-foreground">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup.Root>
            )}
          />
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Max slippage (%) — {form.watch("maxSlippage")}%
              </label>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                {...form.register("maxSlippage", { valueAsNumber: true })}
                className="mt-1 w-full accent-accent-violet"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Spread tolerance — {form.watch("spreadTolerance")}
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                {...form.register("spreadTolerance", { valueAsNumber: true })}
                className="mt-1 w-full accent-accent-violet"
              />
            </div>
          </div>
        </article>

        <article
          className="rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
        >
          <h3 className="text-sm font-medium text-foreground">Model</h3>
          <div className="mt-3 flex flex-wrap gap-4">
            <select
              {...form.register("model")}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
              aria-label="Model"
            >
              {MODEL_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.comingSoon === true}
                >
                  {opt.comingSoon === true ? `${opt.label} (Coming soon)` : opt.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Creativity</span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                {...form.register("temperature", { valueAsNumber: true })}
                className="w-32 accent-accent-blue"
              />
              <span className="text-xs tabular-nums text-muted-foreground">
                {form.watch("temperature")}
              </span>
            </div>
          </div>
        </article>

        <article
          className="rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
        >
          <h3 className="text-sm font-medium text-foreground">Tools (X402)</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Enable endpoints for the agent.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {TOOL_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-border/50 bg-background/50 px-4 py-3"
              >
                <span className="text-sm text-foreground">{opt.label}</span>
                <Controller
                  name={opt.id}
                  control={form.control}
                  render={({ field }) => (
                    <Switch.Root
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="relative h-6 w-11 shrink-0 rounded-full border border-border bg-muted outline-none focus:ring-2 focus:ring-accent-blue data-[state=checked]:border-accent-blue data-[state=checked]:bg-accent-blue"
                    >
                      <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5" />
                    </Switch.Root>
                  )}
                />
              </label>
            ))}
          </div>
        </article>

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-fit rounded-lg bg-accent-violet px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-violet-hover disabled:opacity-50"
        >
          {form.formState.isSubmitting ? "Saving…" : "Save agent"}
        </button>
      </form>
    </section>
  );
}
