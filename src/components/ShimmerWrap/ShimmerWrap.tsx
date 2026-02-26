"use client";

import { useEffect, useRef, useState } from "react";

export interface ShimmerWrapProps {
  /** When this value changes, a shimmer animation runs once. */
  triggerKey: string;
  children: React.ReactNode;
  /** Optional element type. Default "span". */
  as?: "span" | "div" | "p";
  className?: string;
}

const SHIMMER_DURATION_MS = 650;

/**
 * Wraps content and plays a single shimmer pass when triggerKey changes.
 * Use for text or block updates (e.g. new market data, updated labels).
 */
export function ShimmerWrap({
  triggerKey,
  children,
  as: Tag = "span",
  className = "",
}: ShimmerWrapProps) {
  const [shimmer, setShimmer] = useState(false);
  const prevKeyRef = useRef(triggerKey);

  useEffect(() => {
    if (prevKeyRef.current !== triggerKey) {
      prevKeyRef.current = triggerKey;
      setShimmer(true);
      const t = window.setTimeout(() => {
        setShimmer(false);
      }, SHIMMER_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [triggerKey]);

  return (
    <Tag
      className={`${shimmer ? "animate-shimmer-pass" : ""} ${className}`.trim()}
      style={
        Tag === "span"
          ? { display: "inline-block", ...(shimmer ? { position: "relative" } : {}) }
          : shimmer
            ? { position: "relative" }
            : undefined
      }
    >
      {children}
    </Tag>
  );
}
