"use client";

const LINK_SKELETON_COUNT = 9;

export function BottomNavSkeleton() {
  return (
    <footer className="bg-surface" aria-busy="true">
      <nav
        className="mx-auto flex max-w-[1600px] flex-wrap justify-center gap-2 px-4 py-3 sm:justify-start sm:gap-4 sm:px-6"
        aria-label="Loading footer navigation"
      >
        {Array.from({ length: LINK_SKELETON_COUNT }, (_, i) => (
          <div
            key={i}
            className="h-4 w-16 animate-pulse rounded bg-border"
          />
        ))}
      </nav>
    </footer>
  );
}
