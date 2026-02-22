"use client";

import { MiniMarketCardSkeleton } from "@/components/market";

const CARD_SKELETON_COUNT = 6;
const COLUMN_IDS = ["new", "stretch", "migrated", "closed"];

export function DraggableColumnsSkeleton() {
  return (
    <section
      className="p-2 flex-1 flex flex-col min-h-0"
      aria-busy="true"
      aria-label="Loading dashboard columns"
    >
      <div className="mb-2 flex justify-end">
        <div className="h-5 w-24 animate-pulse rounded bg-border" />
      </div>
      <div className="grid gap-0 flex-1 min-h-0 overflow-hidden grid-rows-1 grid-cols-[1fr_8px_1fr_8px_1fr]">
        {COLUMN_IDS.map((columnId, colIndex) => (
          <section
            key={columnId}
            className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border-2 border-border bg-surface"
          >
            <header className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="h-4 w-4 animate-pulse rounded bg-border" />
              <div className="h-4 w-16 animate-pulse rounded bg-border" />
            </header>
            <div className="flex-1 overflow-auto p-2 min-h-0">
              {colIndex === 0 ? (
                <div className="flex-1 overflow-auto p-2 min-h-0" aria-label="Loading markets">
                  {Array.from({ length: CARD_SKELETON_COUNT }, (_, i) => (
                    <MiniMarketCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  <div className="h-3 w-full animate-pulse rounded bg-border" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-border" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-border" />
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
