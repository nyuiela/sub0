"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActivePrimaryTab } from "@/store/slices/layoutSlice";
import {
  PRIMARY_TAB_IDS,
  PRIMARY_TAB_LABELS,
  type PrimaryTabId,
} from "@/types/layout.types";

const tabButtonBase =
  "rounded-md border border-transparent px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export function PrimaryTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = useAppSelector((state) => state.layout.activePrimaryTab);
  const dispatch = useAppDispatch();
  const isSettingsPage = pathname?.startsWith("/settings") ?? false;

  return (
    <nav aria-label="Primary navigation">
      <ul className="flex flex-wrap items-center gap-1">
        {PRIMARY_TAB_IDS.map((tabId: PrimaryTabId) => {
          const isWallet = tabId === "wallet";
          const isActive = isWallet ? isSettingsPage : !isSettingsPage && activeTab === tabId;

          if (isWallet) {
            return (
              <li key={tabId} className="flex items-center">
                <Link
                  href="/settings"
                  aria-current={isSettingsPage ? "page" : undefined}
                  className={`inline-flex items-center ${tabButtonBase} cursor-pointer ${isActive ? "bg-primary-muted text-primary" : "text-muted hover:bg-surface hover:text-foreground"}`}
                >
                  {PRIMARY_TAB_LABELS[tabId]}
                </Link>
              </li>
            );
          }

          return (
            <li key={tabId} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  dispatch(setActivePrimaryTab(tabId));
                  if (isSettingsPage) {
                    void router.push("/");
                  }
                }}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center ${tabButtonBase} cursor-pointer ${isActive ? "bg-primary-muted text-primary" : "text-muted hover:bg-surface hover:text-foreground"}`}
              >
                {PRIMARY_TAB_LABELS[tabId]}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
