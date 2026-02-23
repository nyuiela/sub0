"use client";

import { useState } from "react";
import { updateAgent } from "@/lib/api/agents";
import type { Agent } from "@/types/agent.types";

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
  const modelName = String(modelSettings.model ?? modelSettings.modelName ?? "");

  const strategy = agent.strategy ?? {};
  const maxSlippage = strategy.maxSlippage ?? 0;
  const spreadTolerance = strategy.spreadTolerance ?? 0;

  async function handleSaveConfig() {
    setSaving(true);
    setError(null);
    const tempInput = (document.getElementById("agent-temp") as HTMLInputElement | null)?.value;
    const modelInput = (document.getElementById("agent-model") as HTMLInputElement | null)?.value;
    const temp = tempInput != null ? Number(tempInput) : temperature;
    const model = modelInput?.trim() ?? modelName;
    try {
      const updated = await updateAgent(agent.id, {
        modelSettings: {
          ...modelSettings,
          temperature: Number.isFinite(temp) ? temp : 0.7,
          model: model || undefined,
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
              <input
                id="agent-model"
                type="text"
                defaultValue={modelName}
                placeholder="e.g. gpt-4o-mini"
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
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
