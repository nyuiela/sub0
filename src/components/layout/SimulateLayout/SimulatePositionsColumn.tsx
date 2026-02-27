"use client";

export interface SimulatePositionsColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

export function SimulatePositionsColumn({
  selectedAgentId,
  className = "",
}: SimulatePositionsColumnProps) {
  return (
    <section className={className} aria-label="Markets with positions">
      <p className="text-xs text-muted-foreground">
        Positions will appear here when the agent has opened positions (after analysis and trade execution).
      </p>
    </section>
  );
}
