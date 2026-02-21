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
        className="cursor-pointer rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]"
      >
        Deposit
      </button>
      <span className="text-sm font-medium text-foreground">
        <span className="text-sm font-medium text-foreground">
          $
        </span>
        <input type="number" value={100} className="w-16 text-sm font-medium text-foreground outline-none focus:outline-none border-none" />
      </span>
      <button
        type="button"
        onClick={() => setAutoOn((prev) => !prev)}
        aria-pressed={autoOn}
        aria-label="Toggle auto trading"
        className="cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-primary-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Auto
      </button>
      <span className="text-xs text-muted">
        Avail bal: $0
      </span>
      <button
        type="button"
        aria-label="Profile or menu"
        className="cursor-pointer rounded-full border border-border bg-surface p-2 text-muted transition-colors hover:bg-primary-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span aria-hidden className="text-sm font-medium">U</span>
      </button>
    </section>
  );
}
