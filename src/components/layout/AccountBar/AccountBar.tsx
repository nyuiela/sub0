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
        className="cursor-pointer rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white transition-colors duration-[var(--duration-normal)] hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:scale-[0.98]"
      >
        Deposit
      </button>
      <span className="text-sm font-medium text-[var(--color-text)]">
        $100
      </span>
      <button
        type="button"
        onClick={() => setAutoOn((prev) => !prev)}
        aria-pressed={autoOn}
        aria-label="Toggle auto trading"
        className="cursor-pointer rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors duration-[var(--duration-normal)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        Auto
      </button>
      <span className="text-xs text-[var(--color-text-muted)]">
        Avail bal: $0
      </span>
      <button
        type="button"
        aria-label="Profile or menu"
        className="cursor-pointer rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        <span aria-hidden className="text-sm font-medium">U</span>
      </button>
    </section>
  );
}
