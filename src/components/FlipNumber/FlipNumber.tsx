"use client";

import { useEffect, useRef, useState } from "react";

export interface FlipNumberProps {
  value: string | number;
  className?: string;
  /** Optional: inline or block. Default "inline". */
  display?: "inline" | "block";
}

/**
 * Renders a number/string and plays an Apple clock–style flip animation when the value changes.
 * Use for live-updating numerical values (trades, volume, bid/ask, etc.).
 */
export function FlipNumber({
  value,
  className = "",
  display = "inline",
}: FlipNumberProps) {
  const displayValue = String(value);
  const [flip, setFlip] = useState(false);
  const prevValueRef = useRef(displayValue);

  useEffect(() => {
    if (prevValueRef.current !== displayValue) {
      prevValueRef.current = displayValue;
      setFlip(true);
      const t = window.setTimeout(() => setFlip(false), 400);
      return () => clearTimeout(t);
    }
  }, [displayValue]);

  const Wrapper = display === "block" ? "div" : "span";

  return (
    <Wrapper
      className={className}
      style={{
        display: display === "block" ? "block" : "inline",
        perspective: "120px",
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        key={displayValue}
        className={flip ? "animate-flip-tick" : ""}
        style={{
          display: "inline-block",
          backfaceVisibility: "hidden",
        }}
      >
        {displayValue}
      </span>
    </Wrapper>
  );
}
