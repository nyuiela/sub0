"use client";

export interface SimulateMarketsColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

export function SimulateMarketsColumn({
  selectedAgentId,
  className = "",
}: SimulateMarketsColumnProps) {
  return (
    <aside className={className} aria-label="Markets list for simulate">
      <p className="text-xs text-muted-foreground">
        Market list. Add markets to the current agent here. Agent:{" "}
        {selectedAgentId ?? "none selected"}.
      </p>
    </aside>
  );
}
