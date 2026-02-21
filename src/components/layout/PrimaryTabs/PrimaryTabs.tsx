"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActivePrimaryTab } from "@/store/slices/layoutSlice";
import {
  PRIMARY_TAB_IDS,
  PRIMARY_TAB_LABELS,
  type PrimaryTabId,
} from "@/types/layout.types";

const tabButtonBase =
  "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function PrimaryTabs() {
  const activeTab = useAppSelector((state) => state.layout.activePrimaryTab);
  const dispatch = useAppDispatch();

  return (
    <nav aria-label="Primary navigation">
      <ul className="flex flex-wrap gap-1">
        {PRIMARY_TAB_IDS.map((tabId: PrimaryTabId) => (
          <li key={tabId}>
            <button
              type="button"
              onClick={() => dispatch(setActivePrimaryTab(tabId))}
              aria-current={activeTab === tabId ? "page" : undefined}
              className={
                activeTab === tabId
                  ? `${tabButtonBase} cursor-pointer bg-primary-muted text-primary`
                  : `${tabButtonBase} cursor-pointer text-muted hover:bg-surface hover:text-foreground`
              }
            >
              {PRIMARY_TAB_LABELS[tabId]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
