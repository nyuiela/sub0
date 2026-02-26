"use client";

export interface SimulateDiscoveredColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

export function SimulateDiscoveredColumn({
  selectedAgentId,
  className = "",
}: SimulateDiscoveredColumnProps) {
  return (
    <section className={className} aria-label="Discovered markets and analysis">
      <p className="text-xs text-muted-foreground">
        Discovered/added markets under analysis. Tags: PENDING, TRADE, DISCARD.
      </p>
    </section>
  );
}
