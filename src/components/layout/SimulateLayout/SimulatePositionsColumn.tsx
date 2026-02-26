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
        Markets with positions. Payout and reason per position. Live balance via WebSocket.
      </p>
    </section>
  );
}
