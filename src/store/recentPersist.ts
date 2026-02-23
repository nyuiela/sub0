import type { RootState } from "./index";
import { setRecentItems } from "./slices/recentSlice";
import type { AppDispatch } from "./index";
import type { RecentItem } from "@/types/filterBar.types";

const STORAGE_KEY = "sub0-recent-items";

function parseStored(): RecentItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const items = parsed.filter(
      (i): i is RecentItem =>
        i != null &&
        typeof i === "object" &&
        (i.type === "market" || i.type === "agent") &&
        typeof i.id === "string" &&
        typeof i.label === "string" &&
        typeof i.interactedAt === "number"
    );
    return items.slice(0, 6);
  } catch {
    return null;
  }
}

export function hydrateRecentFromStorage(dispatch: AppDispatch): void {
  const stored = parseStored();
  if (!stored?.length) return;
  dispatch(setRecentItems(stored));
}

export function saveRecentToStorage(state: RootState): void {
  if (typeof window === "undefined") return;
  try {
    const { recent } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.items));
  } catch {
    // ignore
  }
}
