"use client";

export interface MiniMarketCardSkeletonProps {
  className?: string;
}

export function MiniMarketCardSkeleton({
  className = "",
}: MiniMarketCardSkeletonProps) {
  return (
    <article
      className={`mb-2 flex gap-3 border-b border-border bg-surface p-3 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading market"
    >
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-sm bg-muted/50" />
      <section className="min-w-0 flex-1 space-y-1.5">
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted/50" />
        <div className="h-3 w-12 animate-pulse rounded bg-muted/50" />
        <div className="flex gap-x-3">
          <div className="h-3 w-20 animate-pulse rounded bg-muted/50" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted/50" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-10 animate-pulse rounded bg-muted/50" />
          <div className="h-5 w-10 animate-pulse rounded bg-muted/50" />
          <div className="h-5 w-8 animate-pulse rounded bg-muted/50" />
        </div>
        <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
      </section>
      <aside className="flex shrink-0 flex-col items-end justify-between gap-2">
        <div className="space-y-1 text-right">
          <div className="ml-auto h-3 w-14 animate-pulse rounded bg-muted/50" />
          <div className="ml-auto h-3 w-12 animate-pulse rounded bg-muted/50" />
        </div>
        <div className="h-10 w-16 animate-pulse rounded-lg bg-muted/50" />
      </aside>
    </article>
  );
}
