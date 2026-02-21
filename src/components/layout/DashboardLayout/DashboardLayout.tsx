"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMarkets } from "@/store/slices/marketsSlice";
import { TopNav } from "@/components/layout/TopNav";
import { TopNavSkeleton } from "@/components/layout/TopNav/TopNavSkeleton";
import { FilterBar } from "@/components/layout/FilterBar";
import { FilterBarSkeleton } from "@/components/layout/FilterBar/FilterBarSkeleton";
import { DraggableColumns } from "@/components/layout/DraggableColumns";
import { DraggableColumnsSkeleton } from "@/components/layout/DraggableColumns/DraggableColumnsSkeleton";
import { BottomNav } from "@/components/layout/BottomNav";
import { BottomNavSkeleton } from "@/components/layout/BottomNav/BottomNavSkeleton";

export interface DashboardLayoutProps {
  /** Optional custom main content. When not provided, draggable columns are shown. */
  children?: React.ReactNode;
}

/**
 * Trading dashboard shell: top nav (tabs, search, account), filter bar,
 * main area (draggable columns by default), bottom nav.
 * Shows full-page skeleton when markets list is loading and empty.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const dispatch = useAppDispatch();
  const listLength = useAppSelector((state) => state.markets.list.length);
  const showSkeleton = listLength === 0 && children == null;

  useEffect(() => {
    if (children == null) {
      void dispatch(fetchMarkets({ status: "OPEN", limit: 24 }));
    }
  }, [children, dispatch]);

  return (
    <div className="flex h-dvh flex-col bg-background">
      {showSkeleton ? (
        <>
          <TopNavSkeleton />
          <FilterBarSkeleton />
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <DraggableColumnsSkeleton />
          </main>
          <BottomNavSkeleton />
        </>
      ) : (
        <>
          <TopNav />
          <FilterBar />
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {children ?? <DraggableColumns />}
          </main>
          <BottomNav />
        </>
      )}
    </div>
  );
}
