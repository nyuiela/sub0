"use client";

import { AgentDashboard } from "@/components/agent-dashboard";

export interface TrackerStatsColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

export function TrackerStatsColumn({
  selectedAgentId,
  className = "",
}: TrackerStatsColumnProps) {
  if (selectedAgentId == null) {
    return (
      <aside
        className={`flex flex-col items-center justify-center rounded bg-surface p-6 text-sm text-muted-foreground ${className}`.trim()}
        aria-label="Statistics"
      >
        <p>Select an agent to view statistics and charts.</p>
      </aside>
    );
  }

  return (
    <aside
      className={`flex flex-col overflow-hidden ${className}`.trim()}
      aria-label="Agent dashboard"
    >
      <div className="flex-1 overflow-auto p-2">
        <AgentDashboard agentId={selectedAgentId} />
      </div>
    </aside>
  );
}
