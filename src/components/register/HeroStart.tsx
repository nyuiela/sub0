"use client";

import { useState } from "react";

export interface HeroStartProps {
  onStart: () => void;
}

export function HeroStart({ onStart }: HeroStartProps) {
  const [terminalLine, setTerminalLine] = useState(false);

  const handleClick = () => {
    setTerminalLine(true);
    setTimeout(onStart, 400);
  };

  return (
    <section
      className="flex min-h-[60dvh] flex-col items-center justify-center gap-8 px-4"
      aria-label="Welcome to sub0"
    >
      <p
        className="register-terminal min-h-[1.5em]"
        aria-live="polite"
      >
        {terminalLine ? "Initializing Agent Sync..." : "\u00A0"}
      </p>
      <button
        type="button"
        onClick={handleClick}
        className="register-btn-primary cursor-pointer px-8 py-4 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label="Start registration journey"
      >
        Start Journey
      </button>
    </section>
  );
}
