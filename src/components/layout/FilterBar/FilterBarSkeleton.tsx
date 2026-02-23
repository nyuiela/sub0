"use client";

const PILL_COUNT = 6;

export function FilterBarSkeleton() {
  return (
    <nav
      className="m-2 mb-0 flex flex-wrap items-center gap-2 rounded-md bg-surface px-4 py-2 shadow-sm sm:px-6"
      aria-busy="true"
      aria-label="Loading recent items"
    >
      {Array.from({ length: PILL_COUNT }, (_, i) => (
        <div
          key={i}
          className="h-8 w-16 animate-pulse rounded-full bg-muted/50 sm:w-20"
        />
      ))}
    </nav>
  );
}
