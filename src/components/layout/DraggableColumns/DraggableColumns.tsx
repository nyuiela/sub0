"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setColumnOrder, resetColumnOrder } from "@/store/slices/layoutSlice";
import type { ColumnSizePrefs } from "@/types/layout.types";
import { MiniMarketsContainer } from "@/components/market";
import { ColumnResizeHandle } from "./ColumnResizeHandle";

const COLUMN_LABELS: Record<string, string> = {
  new: "New",
  stretch: "Stretch",
  migrated: "Migrated",
};

const DEFAULT_PREFS: ColumnSizePrefs = {
  widthFraction: 1 / 3,
  minFraction: 0.15,
  maxFraction: 0.6,
};

const RESIZE_HANDLE_WIDTH = "8px";

function getPrefs(
  columnSizePrefs: Record<string, ColumnSizePrefs>,
  columnId: string,
  columnCount: number
): ColumnSizePrefs {
  const prefs = columnSizePrefs[columnId];
  if (prefs) return prefs;
  return {
    ...DEFAULT_PREFS,
    widthFraction: 1 / columnCount,
  };
}

export function DraggableColumns() {
  const columnOrder = useAppSelector((state) => state.layout.columnOrder);
  const columnSizePrefs = useAppSelector(
    (state) => state.layout.columnSizePrefs
  );
  const dispatch = useAppDispatch();
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

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLElement>, columnId: string) => {
      e.dataTransfer.setData("text/plain", columnId);
      e.dataTransfer.effectAllowed = "move";
      setDraggedId(columnId);
    },
    []
  );

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

  const handleDragLeave = useCallback(() => {
    setDropTargetId(null);
  }, []);

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
      dispatch(setColumnOrder(next));
    },
    [columnOrder, dispatch]
  );

  return (
    <section
      // Changed flex-grow to flex-1 and added min-h-0 to prevent overflow issues
      className="p-2 flex-1 flex flex-col min-h-0"
      aria-label="Dashboard columns. Drag column headers to reorder; drag edges to resize."
    >
      <div className="mb-2 flex justify-end">
        {/* <button
          type="button"
          onClick={() => dispatch(resetColumnOrder())}
          className="cursor-pointer text-xs font-medium text-muted underline hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Reset column order
        </button> */}
      </div>
      <div
        ref={containerRef}
        className="grid gap-0 flex-1 min-h-0 overflow-hidden grid-rows-1"
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
              aria-label={`Column ${COLUMN_LABELS[columnId] ?? columnId}. Drag to reorder.`}
              className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border-2 border-border transition-shadow duration-200 bg-surface ${dropTargetId === columnId
                ? "ring-2 ring-primary"
                : ""
                } ${draggedId === columnId ? "opacity-60" : ""}`}
              style={{
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <header
                className="flex cursor-grab active:cursor-grabbing items-center gap-2 border-b border-border px-4 py-3"
                style={{ touchAction: "none" }}
              >
                <span
                  className="text-disabled"
                  aria-hidden
                >
                  ⋮⋮
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  {COLUMN_LABELS[columnId] ?? columnId}
                </h3>
              </header>
              <div className="flex-1 overflow-auto p-2 min-h-0">
                {columnId === "new" ? (
                  <MiniMarketsContainer />
                ) : (
                  <p className="text-xs text-muted">
                    Column content slot. Replace with market list or trade panel.
                  </p>
                )}
              </div>
            </section>
          );
          const rightId = columnOrder[i + 1];
          const handleEl =
            rightId != null ? (
              <ColumnResizeHandle
                key={`resize-${columnId}-${rightId}`}
                leftId={columnId}
                rightId={rightId}
                containerRef={containerRef}
              />
            ) : null;
          return handleEl ? [columnEl, handleEl] : [columnEl];
        })}
      </div>
    </section >
  );
}
