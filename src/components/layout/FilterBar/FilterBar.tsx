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
      className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-2 sm:px-6"
      aria-label="Filter markets"
    >
      {FILTER_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="cursor-pointer rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-muted transition-colors duration-200 hover:bg-primary-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
