import { createSlice } from "@reduxjs/toolkit";
import type { RecentItem } from "@/types/filterBar.types";
import { MAX_RECENT_ITEMS } from "@/types/filterBar.types";

export interface RecentSliceState {
  items: RecentItem[];
}

const initialState: RecentSliceState = {
  items: [],
};

function dedupeAndTrim(items: RecentItem[], newItem: RecentItem): RecentItem[] {
  const key = (i: RecentItem) => `${i.type}:${i.id}`;
  const newKey = key(newItem);
  const filtered = items.filter((i) => key(i) !== newKey);
  const next = [{ ...newItem, interactedAt: Date.now() }, ...filtered];
  return next.slice(0, MAX_RECENT_ITEMS);
}

const recentSlice = createSlice({
  name: "recent",
  initialState,
  reducers: {
    addRecent: (state, action: { payload: Omit<RecentItem, "interactedAt"> }) => {
      state.items = dedupeAndTrim(state.items, {
        ...action.payload,
        interactedAt: Date.now(),
      });
    },
    removeRecent: (state, action: { payload: { type: RecentItem["type"]; id: string } }) => {
      const { type, id } = action.payload;
      state.items = state.items.filter((i) => !(i.type === type && i.id === id));
    },
    clearRecent: (state) => {
      state.items = [];
    },
    setRecentItems: (state, action: { payload: RecentItem[] }) => {
      state.items = action.payload.slice(0, MAX_RECENT_ITEMS);
    },
  },
});

export const { addRecent, removeRecent, clearRecent, setRecentItems } = recentSlice.actions;
export default recentSlice.reducer;
