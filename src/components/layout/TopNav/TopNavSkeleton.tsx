"use client";

export function TopNavSkeleton() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-surface px-4"
      aria-busy="true"
      aria-label="Loading navigation"
    >
      <section className="flex flex-wrap items-center gap-2 py-2 sm:gap-3 sm:py-1 w-full justify-between">
        <div className="flex items-center gap-4">
          <div className="h-6 w-14 animate-pulse rounded bg-border shrink-0" />
          <div className="flex gap-1">
            <div className="h-9 w-16 animate-pulse rounded-md bg-border" />
            <div className="h-9 w-16 animate-pulse rounded-md bg-border" />
            <div className="h-9 w-20 animate-pulse rounded-md bg-border" />
          </div>
        </div>
        <div className="min-w-0 flex-1 max-w-md">
          <div className="h-9 w-full animate-pulse rounded-md bg-border" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-9 w-20 animate-pulse rounded-md bg-border" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-border" />
        </div>
      </section>
    </header>
  );
}
