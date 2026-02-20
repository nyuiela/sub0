"use client";

export function SearchBar() {
  return (
    <label className="flex min-w-0 flex-1 max-w-md">
      <span className="sr-only">Search by name, CA, or wallet</span>
      <input
        type="search"
        placeholder="Q Name / CA / Wallet"
        aria-label="Search by name, CA, or wallet"
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-muted)]"
      />
    </label>
  );
}
