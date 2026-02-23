"use client";

import { useCallback, useRef, useState } from "react";

export interface MarketGraphProps {
  marketId: string;
  className?: string;
}

/**
 * Draggable chart area: user can pan the graph by dragging.
 * Renders a placeholder chart (no external chart lib). Replace inner content
 * with real candlestick/line data when API is available.
 */
export function MarketGraph({ marketId, className = "" }: MarketGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (containerRef.current == null) return;
      containerRef.current.setPointerCapture(e.pointerId);
      setDrag((d) => ({
        ...d,
        isDragging: true,
        startX: e.clientX - d.x,
        startY: e.clientY - d.y,
      }));
    },
    []
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.isDragging) return;
    setDrag((d) => ({
      ...d,
      x: e.clientX - d.startX,
      y: e.clientY - d.startY,
    }));
  }, [drag.isDragging]);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (containerRef.current == null) return;
      containerRef.current.releasePointerCapture(e.pointerId);
      setDrag((d) => ({ ...d, isDragging: false }));
    },
    []
  );

  return (
    <section
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg bg-surface ${className}`}
      aria-label="Market chart"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{ touchAction: "none" }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate(${drag.x}px, ${drag.y}px)`,
          cursor: drag.isDragging ? "grabbing" : "grab",
        }}
      >
        <svg
          className="min-w-full min-h-full text-muted-foreground"
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            fill="url(#chartGradient)"
            d="M 0 80 Q 50 90 100 70 T 200 50 T 300 60 T 400 40 L 400 120 L 0 120 Z"
          />
          <path
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M 0 80 Q 50 90 100 70 T 200 50 T 300 60 T 400 40"
          />
        </svg>
      </div>
      <p className="absolute bottom-2 left-2 text-xs text-muted-foreground">
        Drag to pan. Chart data will connect to API.
      </p>
    </section>
  );
}
