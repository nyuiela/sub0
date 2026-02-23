"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HANDLE_WIDTH_PX = 8;

export interface TrackerResizeHandleProps {
  leftId: string;
  rightId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onResize: (params: {
    leftId: string;
    rightId: string;
    deltaFraction: number;
  }) => void;
}

export function TrackerResizeHandle({
  leftId,
  rightId,
  containerRef,
  onResize,
}: TrackerResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const width = el.getBoundingClientRect().width;
      if (width <= 0) return;
      const deltaX = e.clientX - startXRef.current;
      const deltaFraction = deltaX / width;
      startXRef.current = e.clientX;
      onResize({ leftId, rightId, deltaFraction });
    },
    [containerRef, leftId, rightId, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      setIsResizing(true);
    },
    []
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column"
      onMouseDown={handleMouseDown}
      className="flex shrink-0 cursor-col-resize items-stretch justify-center bg-transparent transition-colors hover:bg-primary-muted"
      style={{
        width: HANDLE_WIDTH_PX,
        minWidth: HANDLE_WIDTH_PX,
        touchAction: "none",
      }}
    >
      <span className="w-px shrink-0 bg-transparent" aria-hidden />
    </div>
  );
}
