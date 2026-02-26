"use client";

import { useState, useMemo, useEffect } from "react";
import { updateAgent } from "@/lib/api/agents";
import type { Agent } from "@/types/agent.types";
import { MODEL_OPTIONS, getDefaultModelOption } from "@/lib/settings.schema";

const CUSTOM_MODEL_VALUE = "__custom__";

export interface AgentSettingsFormProps {
  agent: Agent;
  onUpdate: (updated: Agent) => void;
  className?: string;
}

type SettingsTab = "configuration" | "tools";

export function AgentSettingsForm({
  agent,
  onUpdate,
  className = "",
}: AgentSettingsFormProps) {
  const [tab, setTab] = useState<SettingsTab>("configuration");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelSettings = (agent.modelSettings ?? {}) as Record<string, unknown>;
  const temperature =
    typeof modelSettings.temperature === "number"
      ? modelSettings.temperature
      : typeof modelSettings.temperature === "string"
        ? Number(modelSettings.temperature)
        : 0.7;
  const savedModel = String(modelSettings.model ?? modelSettings.modelName ?? "");
  const presetMatch = MODEL_OPTIONS.some((o) => o.value === savedModel);
  const [modelSelect, setModelSelect] = useState(presetMatch ? savedModel : CUSTOM_MODEL_VALUE);
  const [customModel, setCustomModel] = useState(presetMatch ? "" : savedModel);
  useEffect(() => {
    const match = MODEL_OPTIONS.some((o) => o.value === savedModel);
    setModelSelect(match ? savedModel : CUSTOM_MODEL_VALUE);
    setCustomModel(match ? "" : savedModel);
  }, [agent.id, savedModel]);
  const effectiveModel = useMemo(
    () => (modelSelect === CUSTOM_MODEL_VALUE ? customModel.trim() : modelSelect),
    [modelSelect, customModel]
  );

  const strategy = agent.strategy ?? {};
  const maxSlippage = strategy.maxSlippage ?? 0;
  const spreadTolerance = strategy.spreadTolerance ?? 0;

  async function handleSaveConfig() {
    setSaving(true);
    setError(null);
    const tempInput = (document.getElementById("agent-temp") as HTMLInputElement | null)?.value;
    const temp = tempInput != null ? Number(tempInput) : temperature;
    try {
      const updated = await updateAgent(agent.id, {
        modelSettings: {
          ...modelSettings,
          temperature: Number.isFinite(temp) ? temp : 0.7,
          model: effectiveModel || undefined,
        },
      });
      onUpdate(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-lg border border-border bg-surface ${className}`.trim()}
      aria-label="Agent management and settings"
    >
      <nav
        role="tablist"
        aria-label="Settings sections"
        className="flex border-b border-border"
      >
        {(
          [
            ["configuration", "Configuration"],
            ["tools", "Tools"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`min-w-[80px] border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              tab === key
                ? "border-primary text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-auto p-3">
        {error != null && (
          <p className="mb-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {tab === "configuration" && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="agent-temp"
                className="mb-1 block text-xs font-medium text-muted"
              >
                Temperature
              </label>
              <input
                id="agent-temp"
                type="number"
                min={0}
                max={2}
                step={0.1}
                defaultValue={temperature}
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
            </div>
            <div>
              <label
                htmlFor="agent-model"
                className="mb-1 block text-xs font-medium text-muted"
              >
                Model
              </label>
              <select
                id="agent-model"
                value={modelSelect}
                onChange={(e) => setModelSelect(e.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                aria-label="Select model"
              >
                {MODEL_OPTIONS.map((o) => (
                  <option
                    key={o.value}
                    value={o.value}
                    disabled={o.comingSoon === true}
                  >
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
                  className="mt-2 w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                  aria-label="Custom model name"
                />
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted">
                Strategy (read-only)
              </p>
              <p className="text-xs text-muted">
                Max Slippage: {maxSlippage} · Spread Tolerance: {spreadTolerance}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save configuration"}
            </button>
          </div>
        )}

        {tab === "tools" && (
          <div className="space-y-2">
            <p className="text-xs text-muted">
              X402 endpoint toggles for this agent. Configure which tools the
              agent can call (coming soon).
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
