"use client";

const FILTER_SKELETON_COUNT = 6;

export function FilterBarSkeleton() {
  return (
    <nav
      className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-2 sm:px-6"
      aria-busy="true"
      aria-label="Loading filters"
    >
      {Array.from({ length: FILTER_SKELETON_COUNT }, (_, i) => (
        <div
          key={i}
          className="h-8 w-16 animate-pulse rounded-full bg-border sm:w-20"
        />
      ))}
    </nav>
  );
}
