"use client";

const TAB_COUNT = 5;

export function TopNavSkeleton() {
  return (
    <header
      className="sticky top-0 z-40 bg-surface px-4"
      aria-busy="true"
      aria-label="Loading navigation"
    >
      <section className="flex w-full flex-wrap items-center justify-between gap-2 py-2 sm:gap-3 sm:py-1">
        <div className="flex items-center gap-4">
          <div className="h-6 w-14 shrink-0 animate-pulse rounded bg-muted/50" />
          <div className="flex gap-1">
            {Array.from({ length: TAB_COUNT }, (_, i) => (
              <div
                key={i}
                className="h-9 w-14 animate-pulse rounded-md bg-muted/50 sm:w-16"
              />
            ))}
          </div>
        </div>
        <div className="min-w-0 max-w-md flex-1">
          <div className="h-9 w-full animate-pulse rounded-md bg-muted/50" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-9 w-9 animate-pulse rounded-md bg-muted/50" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted/50" />
          <div className="h-9 w-20 animate-pulse rounded-md bg-muted/50" />
        </div>
      </section>
    </header>
  );
}
