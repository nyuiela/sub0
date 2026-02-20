"use client";

const FILTER_ITEMS = [
  { id: "favorites", label: "Favorites" },
  { id: "trenches", label: "Trenches" },
  { id: "all", label: "All" },
  { id: "discover", label: "Discover" },
  { id: "group-alpha", label: "Group Alpha" },
  { id: "categ", label: "Categ" },
];

export function FilterBar() {
  return (
    <nav
      className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 sm:px-6"
      aria-label="Filter markets"
    >
      {FILTER_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="cursor-pointer rounded-full border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors duration-[var(--duration-normal)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
