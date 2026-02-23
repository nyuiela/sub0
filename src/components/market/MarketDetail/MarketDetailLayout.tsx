"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ColumnSizePrefs } from "@/types/layout.types";
import { TrackerResizeHandle } from "@/components/layout/TrackerLayout/TrackerResizeHandle";

const MARKET_COLUMN_IDS = ["sidebar", "main", "trade"] as const;
type MarketColumnId = (typeof MARKET_COLUMN_IDS)[number];

const MARKET_LABELS: Record<MarketColumnId, string> = {
  sidebar: "Sidebar",
  main: "Chart & Activity",
  trade: "Trade",
};

const MARKET_DEFAULT_PREFS: Record<string, ColumnSizePrefs> = {
  sidebar: { widthFraction: 0.2, minFraction: 0.15, maxFraction: 0.45 },
  main: { widthFraction: 0.55, minFraction: 0.3, maxFraction: 0.7 },
  trade: { widthFraction: 0.25, minFraction: 0.2, maxFraction: 0.5 },
};

const RESIZE_HANDLE_WIDTH = "8px";

function getPrefs(
  prefs: Record<string, ColumnSizePrefs>,
  columnId: string,
  columnCount: number
): ColumnSizePrefs {
  const p = prefs[columnId];
  if (p) return p;
  return {
    widthFraction: 1 / columnCount,
    minFraction: 0.15,
    maxFraction: 0.6,
  };
}

export interface MarketDetailLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  trade: React.ReactNode;
  className?: string;
}

export function MarketDetailLayout({
  sidebar,
  main,
  trade,
  className = "",
}: MarketDetailLayoutProps) {
  const [columnOrder, setColumnOrder] = useState<string[]>([...MARKET_COLUMN_IDS]);
  const [columnSizePrefs, setColumnSizePrefs] = useState<Record<string, ColumnSizePrefs>>(
    () => ({ ...MARKET_DEFAULT_PREFS })
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const gridTemplateColumns = useMemo(() => {
    const parts: string[] = [];
    columnOrder.forEach((id, i) => {
      if (i > 0) parts.push(RESIZE_HANDLE_WIDTH);
      const prefs = getPrefs(columnSizePrefs, id, columnOrder.length);
      parts.push(`${prefs.widthFraction}fr`);
    });
    return parts.join(" ");
  }, [columnOrder, columnSizePrefs]);

  const handleResize = useCallback(
    ({ leftId, rightId, deltaFraction }: { leftId: string; rightId: string; deltaFraction: number }) => {
      setColumnSizePrefs((prev) => {
        const left = prev[leftId];
        const right = prev[rightId];
        if (!left || !right) return prev;
        const total = left.widthFraction + right.widthFraction;
        let newLeft = Math.max(
          left.minFraction,
          Math.min(left.maxFraction, left.widthFraction + deltaFraction)
        );
        let newRight = total - newLeft;
        newRight = Math.max(right.minFraction, Math.min(right.maxFraction, newRight));
        newLeft = total - newRight;
        return {
          ...prev,
          [leftId]: { ...left, widthFraction: newLeft },
          [rightId]: { ...right, widthFraction: newRight },
        };
      });
    },
    []
  );

  const handleDragStart = useCallback((e: React.DragEvent<HTMLElement>, columnId: string) => {
    e.dataTransfer.setData("text/plain", columnId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(columnId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDropTargetId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLElement>, columnId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (draggedId && draggedId !== columnId) setDropTargetId(columnId);
    },
    [draggedId]
  );

  const handleDragLeave = useCallback(() => setDropTargetId(null), []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLElement>, targetId: string) => {
      e.preventDefault();
      setDraggedId(null);
      setDropTargetId(null);
      const draggedIdFromTransfer = e.dataTransfer.getData("text/plain");
      if (!draggedIdFromTransfer || draggedIdFromTransfer === targetId) return;
      const from = columnOrder.indexOf(draggedIdFromTransfer);
      const to = columnOrder.indexOf(targetId);
      if (from === -1 || to === -1) return;
      const next = columnOrder.filter((id) => id !== draggedIdFromTransfer);
      next.splice(from < to ? to - 1 : to, 0, draggedIdFromTransfer);
      setColumnOrder(next);
    },
    [columnOrder]
  );

  function renderColumnContent(columnId: string) {
    switch (columnId) {
      case "sidebar":
        return sidebar;
      case "main":
        return main;
      case "trade":
        return trade;
      default:
        return null;
    }
  }

  return (
    <section
      className={`flex min-h-0 flex-1 flex-col ${className}`.trim()}
      aria-label="Market columns. Drag headers to reorder; drag edges to resize."
    >
      <div
        ref={containerRef}
        className="grid min-h-0 flex-1 grid-rows-1 overflow-hidden"
        style={{ gridTemplateColumns }}
      >
        {columnOrder.flatMap((columnId, i) => {
          const columnEl = (
            <section
              key={columnId}
              draggable
              onDragStart={(e) => handleDragStart(e, columnId)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, columnId)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, columnId)}
              aria-label={`Column ${MARKET_LABELS[columnId as MarketColumnId] ?? columnId}. Drag to reorder.`}
              className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg bg-transparent transition-shadow duration-200 ${
                dropTargetId === columnId ? "ring-2 ring-primary" : ""
              } ${draggedId === columnId ? "opacity-60" : ""}`}
            >
              <header
                className="flex cursor-grab active:cursor-grabbing items-center gap-2 px-3 py-2"
                style={{ touchAction: "none" }}
              >
                <span className="text-disabled text-xs" aria-hidden>
                  ⋮⋮
                </span>
                <h3 className="text-xs font-semibold text-foreground">
                  {MARKET_LABELS[columnId as MarketColumnId] ?? columnId}
                </h3>
              </header>
              <div className="min-h-0 flex-1 overflow-auto">
                {renderColumnContent(columnId)}
              </div>
            </section>
          );
          const rightId = columnOrder[i + 1];
          const handleEl =
            rightId != null ? (
              <TrackerResizeHandle
                key={`resize-${columnId}-${rightId}`}
                leftId={columnId}
                rightId={rightId}
                containerRef={containerRef}
                onResize={handleResize}
              />
            ) : null;
          return handleEl ? [columnEl, handleEl] : [columnEl];
        })}
      </div>
    </section>
  );
}
