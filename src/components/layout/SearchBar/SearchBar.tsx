"use client";

export function SearchBar() {
  return (
    <label className="flex min-w-0 flex-1 max-w-md">
      <span className="sr-only">Search by name, CA, or wallet</span>
      <input
        type="search"
        placeholder="Q Name / CA / Wallet"
        aria-label="Search by name, CA, or wallet"
        className="w-full rounded-md bg-surface px-3 py-2 text-sm text-foreground placeholder:text-disabled focus:outline-none focus:ring-2 focus:ring-primary-muted"
      />
    </label>
  );
}
