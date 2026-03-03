"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { MDEditorProps } from "@uiw/react-md-editor";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Switch from "@radix-ui/react-switch";
import { updateAgent } from "@/lib/api/agents";
import { toast } from "sonner";
import {
  MODEL_OPTIONS,
  getDefaultModelOption,
  STRATEGY_OPTIONS,
  TOOL_OPTIONS,
  type StrategyPref,
} from "@/lib/settings.schema";
import type { Agent } from "@/types/agent.types";
import {
  OPENCLAW_DOC_META,
  type OpenClawDocId,
  type OpenClawTemplate,
} from "@/types/openclaw.types";

const MDEditor = dynamic<MDEditorProps>(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

import "@uiw/react-md-editor/markdown-editor.css";

const EDITOR_HEIGHT = 280;
const CUSTOM_MODEL_VALUE = "__custom__";

interface OpenClawDocsEditorProps {
  openclaw: OpenClawTemplate;
  onChange: (id: OpenClawDocId, value: string) => void;
}

function OpenClawDocsEditor({ openclaw, onChange }: OpenClawDocsEditorProps) {
  const [activeTab, setActiveTab] = useState<OpenClawDocId>("soul");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const activeMeta = OPENCLAW_DOC_META.find((m) => m.id === activeTab);
  const currentValue = openclaw[activeTab];

  const handleEdit = () => {
    setEditContent(currentValue);
    setIsEditing(true);
  };

  const handleSave = () => {
    onChange(activeTab, editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent("");
  };

  return (
    <div className="rounded-lg border border-border bg-surface">
      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {OPENCLAW_DOC_META.map((meta) => (
          <button
            key={meta.id}
            type="button"
            onClick={() => {
              setActiveTab(meta.id);
              setIsEditing(false);
            }}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${activeTab === meta.id
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            title={meta.description}
          >
            {meta.label.split(" (")[0]}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {activeMeta?.label}
          </span>
          <div className="flex gap-1">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded bg-success px-2 py-1 text-xs font-medium text-white hover:opacity-90"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleEdit}
                className="rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div data-color-mode="dark" className="overflow-hidden rounded border border-border">
            <MDEditor
              value={editContent}
              onChange={(v) => setEditContent(v ?? "")}
              height={EDITOR_HEIGHT}
              preview="edit"
              visibleDragbar={false}
            />
          </div>
        ) : (
          <div className="prose prose-xs max-w-none">
            <pre className="whitespace-pre-wrap text-xs text-foreground font-mono bg-muted/30 rounded p-3 h-48 overflow-auto">
              {currentValue || "No content. Click Edit to add."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

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

function getStrategyFromAgent(agent: Agent): {
  preference: StrategyPref;
  maxSlippage: number;
  spreadTolerance: number;
} {
  const s = agent.strategy;
  const pref = s?.preference;
  const preference: StrategyPref =
    pref === "AMM_ONLY" || pref === "ORDERBOOK" || pref === "HYBRID" ? pref : "HYBRID";
  return {
    preference,
    maxSlippage: typeof s?.maxSlippage === "number" ? s.maxSlippage : 1,
    spreadTolerance: typeof s?.spreadTolerance === "number" ? s.spreadTolerance : 0.5,
  };
}

function getOpenclawFromAgent(agent: Agent): OpenClawTemplate {
  const ms = agent.modelSettings;
  if (!ms || typeof ms !== "object" || !("openclaw" in ms)) {
    return {
      soul: "",
      persona: "",
      skill: "",
      methodology: "",
      failed_tests: "",
      context: "",
      constraints: "",
    };
  }
  const oc = ms.openclaw as Record<string, unknown> | undefined;
  if (!oc || typeof oc !== "object") {
    return {
      soul: "",
      persona: "",
      skill: "",
      methodology: "",
      failed_tests: "",
      context: "",
      constraints: "",
    };
  }
  const str = (v: unknown): string =>
    typeof v === "string" ? v : "";
  return {
    soul: str(oc.soul),
    persona: str(oc.persona),
    skill: str(oc.skill),
    methodology: str(oc.methodology),
    failed_tests: str(oc.failed_tests),
    context: str(oc.context),
    constraints: str(oc.constraints),
  };
}

export interface SimulateConfigEditorProps {
  agent: Agent;
  onAgentUpdated?: (agent: Agent) => void;
  className?: string;
}

export function SimulateConfigEditor({
  agent,
  onAgentUpdated,
  className = "",
}: SimulateConfigEditorProps) {
  const [openclaw, setOpenclaw] = useState<OpenClawTemplate>(() =>
    getOpenclawFromAgent(agent)
  );
  const [saving, setSaving] = useState(false);

  const savedModel = getModelFromAgent(agent);
  const modelMatch = MODEL_OPTIONS.some((o) => o.value === savedModel);
  const [modelSelect, setModelSelect] = useState(modelMatch ? savedModel : CUSTOM_MODEL_VALUE);
  const [customModel, setCustomModel] = useState(modelMatch ? "" : savedModel);
  const [temperature, setTemperature] = useState(() => getTemperatureFromAgent(agent));
  const [tools, setTools] = useState<Record<string, boolean>>(() => getToolsFromAgent(agent));
  const [strategy, setStrategy] = useState(() => getStrategyFromAgent(agent));

  useEffect(() => {
    setOpenclaw(getOpenclawFromAgent(agent));
  }, [agent.id, agent.modelSettings]);

  useEffect(() => {
    const saved = getModelFromAgent(agent);
    const match = MODEL_OPTIONS.some((o) => o.value === saved);
    setModelSelect(match ? saved : CUSTOM_MODEL_VALUE);
    setCustomModel(match ? "" : saved);
    setTemperature(getTemperatureFromAgent(agent));
    setTools(getToolsFromAgent(agent));
    setStrategy(getStrategyFromAgent(agent));
  }, [agent.id, agent.modelSettings, agent.strategy]);

  const effectiveModel = useMemo(
    () => (modelSelect === CUSTOM_MODEL_VALUE ? customModel.trim() : modelSelect),
    [modelSelect, customModel]
  );

  const setDoc = useCallback((id: OpenClawDocId, value: string) => {
    setOpenclaw((prev) => ({ ...prev, [id]: value ?? "" }));
  }, []);

  const setTool = useCallback((id: string, value: boolean) => {
    setTools((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const prevMs =
        agent.modelSettings && typeof agent.modelSettings === "object"
          ? agent.modelSettings
          : {};
      const updated = await updateAgent(agent.id, {
        persona: openclaw.persona || undefined,
        modelSettings: {
          ...prevMs,
          model: effectiveModel || undefined,
          temperature,
          strategyPreference: strategy.preference,
          maxSlippage: strategy.maxSlippage,
          spreadTolerance: strategy.spreadTolerance,
          openclaw,
          tools: {
            internetSearch: tools.toolInternetSearch ?? false,
            newsCrawler: tools.toolNewsCrawler ?? false,
            twitter: tools.toolTwitter ?? false,
            sportsData: tools.toolSportsData ?? false,
          },
        },
      });
      onAgentUpdated?.(updated);
      toast.success("Config saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save config");
    } finally {
      setSaving(false);
    }
  }, [
    agent.id,
    agent.modelSettings,
    effectiveModel,
    openclaw,
    strategy,
    temperature,
    tools,
    onAgentUpdated,
  ]);

  return (
    <article
      className={`flex flex-col gap-4 rounded-lg border border-border bg-surface p-3 ${className}`.trim()}
      aria-label="Agent config editor"
    >
      <p className="text-xs text-muted-foreground">
        Model, tools, strategy, and OpenClaw docs. Save to apply.
      </p>

      <section aria-labelledby="simulate-model-heading">
        <h3 id="simulate-model-heading" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Model
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={modelSelect}
            onChange={(e) => setModelSelect(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            aria-label="Select model"
          >
            {MODEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} disabled={o.comingSoon === true}>
                {o.comingSoon === true ? `${o.label} (Coming soon)` : o.label}
              </option>
            ))}
            <option value={CUSTOM_MODEL_VALUE}>Other (custom)</option>
          </select>
          {modelSelect === CUSTOM_MODEL_VALUE && (
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="e.g. gpt-4o-mini"
              className="w-40 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              aria-label="Custom model name"
            />
          )}
          <label className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Temperature</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-24 accent-primary"
            />
            <span className="text-xs tabular-nums text-muted-foreground">{temperature}</span>
          </label>
        </div>
      </section>

      <section aria-labelledby="simulate-tools-heading">
        <h3 id="simulate-tools-heading" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Tools (X402)
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {TOOL_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center justify-between rounded border border-border/50 bg-background/50 px-3 py-2"
            >
              <span className="text-sm text-foreground">{opt.label}</span>
              <Switch.Root
                checked={tools[opt.id] ?? false}
                onCheckedChange={(v) => setTool(opt.id, v)}
                className="relative h-6 w-11 shrink-0 rounded-full border border-border bg-muted data-[state=checked]:bg-primary"
              >
                <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5" />
              </Switch.Root>
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="simulate-strategy-heading">
        <h3 id="simulate-strategy-heading" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Trading strategy
        </h3>
        <RadioGroup.Root
          value={strategy.preference}
          onValueChange={(v) =>
            setStrategy((prev) => ({
              ...prev,
              preference: v === "AMM_ONLY" || v === "ORDERBOOK" || v === "HYBRID" ? v : "HYBRID",
            }))
          }
          className="mb-3 flex flex-wrap gap-4"
          aria-label="Strategy preference"
        >
          {STRATEGY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2">
              <RadioGroup.Item
                value={opt.value}
                className="h-4 w-4 rounded-full border-2 border-border bg-background data-[state=checked]:border-primary data-[state=checked]:bg-primary"
              />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
        </RadioGroup.Root>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-muted-foreground">Max slippage (%) — {strategy.maxSlippage}</span>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={strategy.maxSlippage}
              onChange={(e) =>
                setStrategy((prev) => ({ ...prev, maxSlippage: Number(e.target.value) }))
              }
              className="mt-1 w-full accent-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Spread tolerance — {strategy.spreadTolerance}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={strategy.spreadTolerance}
              onChange={(e) =>
                setStrategy((prev) => ({ ...prev, spreadTolerance: Number(e.target.value) }))
              }
              className="mt-1 w-full accent-primary"
            />
          </label>
        </div>
      </section>

      <section aria-labelledby="simulate-openclaw-heading">
        <h3
          id="simulate-openclaw-heading"
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
        >
          OpenClaw Docs
        </h3>
        <OpenClawDocsEditor openclaw={openclaw} onChange={setDoc} />
      </section>
      <footer className="mt-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save config"}
        </button>
      </footer>
    </article>
  );
}
