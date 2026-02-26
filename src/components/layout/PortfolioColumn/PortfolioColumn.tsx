"use client";

import { PositionsColumn } from "@/components/layout/PositionsColumn";
import { TradesColumn } from "@/components/layout/TradesColumn";

export interface PortfolioColumnProps {
  className?: string;
}

/**
 * Parent column that displays Positions and Trades as two rows.
 * Used on the markets page instead of separate positions and trades columns.
 */
export function PortfolioColumn({ className = "" }: PortfolioColumnProps) {
  return (
    <article
      className={`flex h-full min-h-0 flex-col overflow-hidden ${className}`.trim()}
      aria-label="Portfolio: positions and trades"
    >
      <section
        className="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-border"
        aria-label="Positions"
      >
        <h3 className="shrink-0 border-b border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground">
          Positions
        </h3>
        <div className="min-h-0 flex-1 overflow-auto">
          <PositionsColumn className="min-h-0" />
        </div>
      </section>
      <section
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        aria-label="Trades"
      >
        <h3 className="shrink-0 border-b border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground">
          Trades
        </h3>
        <div className="min-h-0 flex-1 overflow-auto">
          <TradesColumn limit={25} className="min-h-0" />
        </div>
      </section>
    </article>
  );
}
