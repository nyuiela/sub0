"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Agent } from "@/types/agent.types";
import type { ColumnSizePrefs } from "@/types/layout.types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedSimulateAgentId } from "@/store/slices/layoutSlice";
import { SimulateMarketsColumn } from "./SimulateMarketsColumn";
import { SimulateDiscoveredColumn } from "./SimulateDiscoveredColumn";
import { SimulatePositionsColumn } from "./SimulatePositionsColumn";
import { SimulateAgentConfigColumn } from "./SimulateAgentConfigColumn";
import { TrackerResizeHandle } from "../TrackerLayout/TrackerResizeHandle";
import { MiniMarketsContainer } from "@/components/market/MiniMarketsContainer/MiniMarketsContainer";

const SIMULATE_COLUMN_IDS = ["markets", "discovered", "positions", "agentConfig"] as const;
type SimulateColumnId = (typeof SIMULATE_COLUMN_IDS)[number];

const SIMULATE_LABELS: Record<SimulateColumnId, string> = {
  markets: "Markets",
  discovered: "Discovery & analysis",
  positions: "Positions",
  agentConfig: "Agent config",
};

const SIMULATE_DEFAULT_PREFS: Record<string, ColumnSizePrefs> = {
  markets: { widthFraction: 0.2, minFraction: 0.12, maxFraction: 0.4 },
  discovered: { widthFraction: 0.3, minFraction: 0.2, maxFraction: 0.5 },
  positions: { widthFraction: 0.3, minFraction: 0.2, maxFraction: 0.5 },
  agentConfig: { widthFraction: 0.2, minFraction: 0.15, maxFraction: 0.5 },
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
    minFraction: 0.12,
    maxFraction: 0.5,
  };
}

export interface SimulateLayoutProps {
  ownerId?: string;
  className?: string;
}

export function SimulateLayout({ ownerId, className = "" }: SimulateLayoutProps) {
  const dispatch = useAppDispatch();
  const selectedAgentId = useAppSelector((state) => state.layout.selectedSimulateAgentId);
  const onSelectAgent = useCallback(
    (agent: Agent | null) => dispatch(setSelectedSimulateAgentId(agent?.id ?? null)),
    [dispatch]
  );
  const [columnOrder, setColumnOrder] = useState<string[]>([...SIMULATE_COLUMN_IDS]);
  const [columnSizePrefs, setColumnSizePrefs] = useState<Record<string, ColumnSizePrefs>>(
    () => ({ ...SIMULATE_DEFAULT_PREFS })
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
    ({
      leftId,
      rightId,
      deltaFraction,
    }: {
      leftId: string;
      rightId: string;
      deltaFraction: number;
    }) => {
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
        newRight = Math.max(
          right.minFraction,
          Math.min(right.maxFraction, newRight)
        );
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
      case "markets":
        return <SimulateMarketsColumn selectedAgentId={selectedAgentId} className="h-full" />;
      case "discovered":
        return (
          <SimulateDiscoveredColumn
            selectedAgentId={selectedAgentId}
            className="h-full"
          />
        );
      case "positions":
        return (
          <SimulatePositionsColumn
            selectedAgentId={selectedAgentId}
            className="h-full"
          />
        );
      case "agentConfig":
        return (
          <SimulateAgentConfigColumn
            selectedAgentId={selectedAgentId}
            onSelectAgent={onSelectAgent}
            className="h-full"
          />
        );
      default:
        return <p className="text-xs text-muted">Unknown column</p>;
    }
  }

  return (
    <section
      className={`flex flex-1 flex-col min-h-0 p-2 ${className}`.trim()}
      aria-label="Simulate sandbox. Drag headers to reorder; drag edges to resize."
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
              aria-label={`Column ${SIMULATE_LABELS[columnId as SimulateColumnId] ?? columnId}. Drag to reorder.`}
              className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg bg-surface transition-shadow duration-200 ${dropTargetId === columnId ? "ring-2 ring-primary" : ""
                } ${draggedId === columnId ? "opacity-60" : ""}`}
            >
              <header
                className="flex cursor-grab active:cursor-grabbing items-center gap-2 px-4 py-3"
                style={{ touchAction: "none" }}
              >
                <span className="text-disabled" aria-hidden>
                  ⋮⋮
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  {SIMULATE_LABELS[columnId as SimulateColumnId] ?? columnId}
                </h3>
              </header>
              <div className="scrollbar-hidden min-h-0 flex-1 overflow-auto p-1">
                {renderColumnContent(columnId)}
                {/* <MiniMarketsContainer /> */}
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
