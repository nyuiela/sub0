"use client";

import { DEFAULT_COLUMN_IDS } from "@/types/layout.types";
import { MiniMarketCardSkeleton } from "@/components/market";

const CARD_SKELETON_COUNT = 6;
const RESIZE_HANDLE_WIDTH = "8px";

export function DraggableColumnsSkeleton() {
  const gridTemplateColumns = [
    "0.35fr",
    RESIZE_HANDLE_WIDTH,
    "0.3fr",
    RESIZE_HANDLE_WIDTH,
    "0.2fr",
    RESIZE_HANDLE_WIDTH,
    "0.15fr",
  ].join(" ");

  return (
    <section
      className="flex flex-1 flex-col min-h-0 p-2"
      aria-busy="true"
      aria-label="Loading dashboard columns"
    >
      <div
        className="grid grid-rows-1 flex-1 min-h-0 overflow-hidden gap-0"
        style={{ gridTemplateColumns }}
      >
        {DEFAULT_COLUMN_IDS.flatMap((columnId, i) => {
          const isAgents = columnId === "agents";
          const isNew = columnId === "new";
          const isPositions = columnId === "positions";
          const isNews = columnId === "news";

          const columnEl = (
            <section
              key={columnId}
              className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg bg-surface"
            >
              <header className="flex items-center gap-2 px-4 py-3">
                <span className="text-disabled" aria-hidden>
                  ⋮⋮
                </span>
                <div className="h-4 w-20 animate-pulse rounded bg-muted/50" />
              </header>
              <div className="min-h-0 flex-1 overflow-auto p-1">
                {isAgents && (
                  <div className="flex flex-col gap-3" aria-label="Loading agents">
                    <div className="h-[200px] animate-pulse rounded-lg bg-muted/50" />
                    <ul className="space-y-0">
                      {Array.from({ length: 5 }, (_, j) => (
                        <li
                          key={j}
                          className="border-b border-border bg-surface p-3 last:border-b-0"
                        >
                          <div className="mb-1.5 h-3 w-2/3 animate-pulse rounded bg-muted/50" />
                          <div className="mb-1.5 h-3 w-1/2 animate-pulse rounded bg-muted/50" />
                          <div className="h-3 w-3/4 animate-pulse rounded bg-muted/50" />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {isNew && (
                  <div aria-label="Loading markets">
                    {Array.from({ length: CARD_SKELETON_COUNT }, (_, j) => (
                      <MiniMarketCardSkeleton key={j} />
                    ))}
                  </div>
                )}
                {isPositions && (
                  <ul className="space-y-0" aria-label="Loading positions">
                    {Array.from({ length: 5 }, (_, j) => (
                      <li
                        key={j}
                        className="border-b border-border bg-surface p-3 last:border-b-0"
                      >
                        <div className="mb-1.5 h-3 w-2/3 animate-pulse rounded bg-muted/50" />
                        <div className="mb-1.5 h-3 w-1/2 animate-pulse rounded bg-muted/50" />
                        <div className="h-3 w-3/4 animate-pulse rounded bg-muted/50" />
                      </li>
                    ))}
                  </ul>
                )}
                {isNews && (
                  <ul className="space-y-0" aria-label="Loading news">
                    {Array.from({ length: 5 }, (_, j) => (
                      <li
                        key={j}
                        className="border-b border-border bg-surface p-3 last:border-b-0"
                      >
                        <div className="mb-1.5 h-3 w-full animate-pulse rounded bg-muted/50" />
                        <div className="h-3 w-4/5 animate-pulse rounded bg-muted/50" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );

          const hasHandle = i < DEFAULT_COLUMN_IDS.length - 1;
          const handleEl = hasHandle ? (
            <div
              key={`handle-${columnId}`}
              className="shrink-0 bg-transparent"
              style={{ width: 8 }}
              aria-hidden
            />
          ) : null;

          return handleEl ? [columnEl, handleEl] : [columnEl];
        })}
      </div>
    </section>
  );
}
