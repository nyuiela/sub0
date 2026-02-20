"use client";

import { TopNav } from "@/components/layout/TopNav";
import { FilterBar } from "@/components/layout/FilterBar";
import { DraggableColumns } from "@/components/layout/DraggableColumns";
import { BottomNav } from "@/components/layout/BottomNav";

export interface DashboardLayoutProps {
  /** Optional custom main content. When not provided, draggable columns are shown. */
  children?: React.ReactNode;
}

/**
 * Trading dashboard shell: top nav (tabs, search, account), filter bar,
 * main area (draggable columns by default), bottom nav.
 * Layout and capabilities only; column content is placeholder.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-page-bg)]">
      <TopNav />
      <FilterBar />
      <main className="flex-1 flex flex-col min-h-0">
        {children ?? <DraggableColumns />}
      </main>
      <BottomNav />
    </div>
  );
}
