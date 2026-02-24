"use client";

import { useState } from "react";

export function AccountBar() {
  const [autoOn, setAutoOn] = useState(false);

  return (
    <section
      className="flex flex-wrap items-center gap-2 sm:gap-4"
      aria-label="Account and balance"
    >
      <button
        type="button"
        className="cursor-pointer rounded-md border border-transparent bg-success px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
      >
        Deposit
      </button>
      <span className="flex items-center text-sm font-medium text-foreground">
        <span aria-hidden>$</span>
        <input
          type="number"
          value={100}
          aria-label="Balance amount"
          className="w-16 border border-border bg-surface px-2 py-1.5 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:border-primary"
        />
      </span>
      {/* <button
        type="button"
        onClick={() => setAutoOn((prev) => !prev)}
        aria-pressed={autoOn}
        aria-label="Toggle auto trading"
        className="cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-primary-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Auto
      </button> */}
      <span className="text-xs text-muted">
        Avail bal: $0
      </span>
    </section>
  );
}
