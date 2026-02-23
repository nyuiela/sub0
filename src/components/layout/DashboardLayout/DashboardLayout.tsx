"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMarkets } from "@/store/slices/marketsSlice";
import { RegistrationRedirect } from "@/components/auth/RegistrationRedirect";
import { TopNav } from "@/components/layout/TopNav";
import { TopNavSkeleton } from "@/components/layout/TopNav/TopNavSkeleton";
import { FilterBar } from "@/components/layout/FilterBar";
import { FilterBarSkeleton } from "@/components/layout/FilterBar/FilterBarSkeleton";
import { DraggableColumns } from "@/components/layout/DraggableColumns";
import { DraggableColumnsSkeleton } from "@/components/layout/DraggableColumns/DraggableColumnsSkeleton";
import { TrackerLayout } from "@/components/layout/TrackerLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { BottomNavSkeleton } from "@/components/layout/BottomNav/BottomNavSkeleton";
import type { PrimaryTabId } from "@/types/layout.types";

export interface DashboardLayoutProps {
  /** Optional custom main content. When not provided, content depends on active primary tab. */
  children?: React.ReactNode;
}

function TabPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-muted-foreground">
      <p className="text-sm">{title}</p>
    </div>
  );
}

/**
 * Trading dashboard shell: top nav (tabs, search, account), filter bar,
 * main area (tab-dependent: Markets = columns, Trade = recent, Tracker = columns layout, Chat/Settings = placeholders), bottom nav.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const dispatch = useAppDispatch();
  const listLength = useAppSelector((state) => state.markets.list.length);
  const activeTab = useAppSelector((state) => state.layout.activePrimaryTab);
  const showSkeleton = listLength === 0 && children == null;

  useEffect(() => {
    if (children == null && activeTab === "markets") {
      void dispatch(fetchMarkets({ status: "OPEN", limit: 24 }));
    }
  }, [children, activeTab, dispatch]);

  function renderMainContent(): React.ReactNode {
    if (children != null) return children;
    switch (activeTab as PrimaryTabId) {
      case "markets":
        return <DraggableColumns />;
      case "trade":
        return <TabPlaceholder title="Recent trade" />;
      case "tracker":
        return <TrackerLayout />;
      case "earn":
        return <TabPlaceholder title="Chat" />;
      case "wallet":
        return <TabPlaceholder title="Settings" />;
      default:
        return <DraggableColumns />;
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {showSkeleton ? (
        <>
          <TopNavSkeleton />
          <FilterBarSkeleton />
          <main className="flex flex-1 flex-col min-h-0 overflow-hidden">
            <DraggableColumnsSkeleton />
          </main>
          <BottomNavSkeleton />
        </>
      ) : (
        <>
          <RegistrationRedirect />
          <TopNav />
          <FilterBar />
          <main className="flex flex-1 flex-col min-h-0 overflow-hidden">
            {renderMainContent()}
          </main>
          <BottomNav />
        </>
      )}
    </div>
  );
}
