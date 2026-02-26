"use client";

import { useState } from "react";
import { updateAgent } from "@/lib/api/agents";
import { getDiceBearAvatarUrl } from "@/lib/avatar";
import type { Agent, AgentStatus } from "@/types/agent.types";

export interface StatusStripProps {
  agent: Agent;
  onUpdate: (updated: Agent) => void;
  className?: string;
}

export function StatusStrip({
  agent,
  onUpdate,
  className = "",
}: StatusStripProps) {
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const next: AgentStatus =
      agent.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setSaving(true);
    try {
      const updated = await updateAgent(agent.id, { status: next });
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  }

  const isActive = agent.status === "ACTIVE";
  const buttonLabel = isActive
    ? "Pause (stop agent)"
    : "Resume (start agent; next cron cycle will run it)";
  const indicatorColor = isActive
    ? "bg-success"
    : agent.status === "PAUSED"
      ? "bg-warning"
      : "bg-muted";

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded border border-border bg-surface px-3 py-2 ${className}`.trim()}
      aria-label="Agent status"
    >
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- DiceBear data URI */}
        <img
          src={getDiceBearAvatarUrl(agent.persona ?? agent.id, "persona")}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 rounded-full object-cover"
        />
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${indicatorColor}`}
          aria-hidden
        />
        <span className="text-sm font-medium text-foreground">
          {agent.status}
        </span>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving}
        title={buttonLabel}
        aria-label={buttonLabel}
        className={`rounded px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-50 ${
          isActive
            ? "bg-warning text-white hover:opacity-90"
            : "bg-success text-white hover:opacity-90"
        }`}
      >
        {saving ? "…" : isActive ? "Pause" : "Resume"}
      </button>
    </div>
  );
}
