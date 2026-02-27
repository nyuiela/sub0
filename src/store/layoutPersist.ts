import type { RootState } from "./index";
import type { LayoutSliceState } from "./slices/layoutSlice";
import { setActivePrimaryTab, setColumnOrder, setColumnSizePrefs } from "./slices/layoutSlice";
import type { AppDispatch } from "./index";
import {
  DEFAULT_COLUMN_IDS,
  DEFAULT_COLUMN_SIZE_PREFS,
  PRIMARY_TAB_IDS,
  type PrimaryTabId,
} from "@/types/layout.types";

const STORAGE_KEY = "sub0-layout-prefs";
const VALID_TAB_IDS = new Set<string>(PRIMARY_TAB_IDS as unknown as string[]);

function isValidPrimaryTabId(value: unknown): value is PrimaryTabId {
  return typeof value === "string" && VALID_TAB_IDS.has(value);
}

function parseStored(): Partial<LayoutSliceState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LayoutSliceState>;
    const result: Partial<LayoutSliceState> = {};

    if (isValidPrimaryTabId(parsed.activePrimaryTab)) {
      result.activePrimaryTab = parsed.activePrimaryTab;
    }

    if (
      parsed.columnOrder &&
      Array.isArray(parsed.columnOrder) &&
      parsed.columnOrder.length > 0
    ) {
      const validIds = new Set(DEFAULT_COLUMN_IDS as unknown as string[]);
      const migratedOrder = parsed.columnOrder
        .map((id) => (id === "positions" || id === "trades" ? "portfolio" : id))
        .filter((id) => validIds.has(id));
      const uniqueOrder = [...new Set(migratedOrder)];
      const hasPortfolio = uniqueOrder.includes("portfolio");
      if (uniqueOrder.length > 0 && hasPortfolio && parsed.columnSizePrefs && typeof parsed.columnSizePrefs === "object") {
        const prefs = { ...parsed.columnSizePrefs } as LayoutSliceState["columnSizePrefs"];
        if (!prefs.portfolio && (prefs.positions || prefs.trades)) {
          prefs.portfolio = DEFAULT_COLUMN_SIZE_PREFS.portfolio ?? prefs.positions ?? prefs.trades;
        }
        result.columnOrder = uniqueOrder;
        result.columnSizePrefs = prefs;
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

export function hydrateLayoutFromStorage(dispatch: AppDispatch): void {
  const stored = parseStored();
  if (!stored) return;
  if (isValidPrimaryTabId(stored.activePrimaryTab)) {
    dispatch(setActivePrimaryTab(stored.activePrimaryTab));
  }
  if (stored.columnOrder) dispatch(setColumnOrder(stored.columnOrder));
  if (stored.columnSizePrefs && Object.keys(stored.columnSizePrefs).length > 0) {
    dispatch(setColumnSizePrefs(stored.columnSizePrefs));
  }
}

export function saveLayoutToStorage(state: RootState): void {
  if (typeof window === "undefined") return;
  try {
    const { layout } = state;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activePrimaryTab: layout.activePrimaryTab,
        columnOrder: layout.columnOrder,
        columnSizePrefs: layout.columnSizePrefs,
      })
    );
  } catch {
    // ignore
  }
}
