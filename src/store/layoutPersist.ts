import type { RootState } from "./index";
import type { LayoutSliceState } from "./slices/layoutSlice";
import { setColumnOrder, setColumnSizePrefs } from "./slices/layoutSlice";
import type { AppDispatch } from "./index";
import { DEFAULT_COLUMN_IDS } from "@/types/layout.types";

const STORAGE_KEY = "sub0-layout-prefs";

function parseStored(): Partial<LayoutSliceState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LayoutSliceState>;
    if (
      parsed.columnOrder &&
      Array.isArray(parsed.columnOrder) &&
      parsed.columnOrder.length > 0
    ) {
      const validOrder = parsed.columnOrder.filter((id) =>
        DEFAULT_COLUMN_IDS.includes(id as (typeof DEFAULT_COLUMN_IDS)[number])
      );
      const uniqueOrder = [...new Set(validOrder)];
      if (uniqueOrder.length > 0 && parsed.columnSizePrefs && typeof parsed.columnSizePrefs === "object") {
        return {
          columnOrder: uniqueOrder,
          columnSizePrefs: parsed.columnSizePrefs as LayoutSliceState["columnSizePrefs"],
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function hydrateLayoutFromStorage(dispatch: AppDispatch): void {
  const stored = parseStored();
  if (!stored) return;
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
        columnOrder: layout.columnOrder,
        columnSizePrefs: layout.columnSizePrefs,
      })
    );
  } catch {
    // ignore
  }
}
