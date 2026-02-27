import { createSlice } from "@reduxjs/toolkit";
import type { PrimaryTabId } from "@/types/layout.types";
import {
  DEFAULT_COLUMN_IDS,
  DEFAULT_COLUMN_SIZE_PREFS,
  type ColumnSizePrefs,
} from "@/types/layout.types";

export interface LayoutSliceState {
  activePrimaryTab: PrimaryTabId;
  columnOrder: string[];
  columnSizePrefs: Record<string, ColumnSizePrefs>;
  /** Agent id to select when opening Tracker tab (e.g. from FilterBar). */
  selectedTrackerAgentId: string | null;
  /** Agent id selected in Simulate tab for sandbox testing. */
  selectedSimulateAgentId: string | null;
  /** Incremented when user adds a market to agent so Discovery refetches. */
  simulateEnqueuedListVersion: number;
}

function initialSizePrefs(): Record<string, ColumnSizePrefs> {
  const prefs: Record<string, ColumnSizePrefs> = {};
  for (const id of DEFAULT_COLUMN_IDS) {
    prefs[id] = { ...DEFAULT_COLUMN_SIZE_PREFS[id] ?? { widthFraction: 1 / 3, minFraction: 0.15, maxFraction: 0.6 } };
  }
  return prefs;
}

const initialState: LayoutSliceState = {
  activePrimaryTab: "markets",
  columnOrder: [...DEFAULT_COLUMN_IDS],
  columnSizePrefs: initialSizePrefs(),
  selectedTrackerAgentId: null,
  selectedSimulateAgentId: null,
  simulateEnqueuedListVersion: 0,
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    setActivePrimaryTab: (state, action: { payload: PrimaryTabId }) => {
      state.activePrimaryTab = action.payload;
    },
    setColumnOrder: (state, action: { payload: string[] }) => {
      state.columnOrder = action.payload;
    },
    setColumnSizePrefs: (state, action: { payload: Record<string, ColumnSizePrefs> }) => {
      state.columnSizePrefs = { ...state.columnSizePrefs, ...action.payload };
    },
    setColumnWidth: (
      state,
      action: { payload: { columnId: string; widthFraction: number } }
    ) => {
      const { columnId, widthFraction } = action.payload;
      const prefs = state.columnSizePrefs[columnId];
      if (!prefs) return;
      state.columnSizePrefs[columnId] = {
        ...prefs,
        widthFraction: Math.max(prefs.minFraction, Math.min(prefs.maxFraction, widthFraction)),
      };
    },
    resizeColumns: (
      state,
      action: {
        payload: { leftId: string; rightId: string; deltaFraction: number };
      }
    ) => {
      const { leftId, rightId, deltaFraction } = action.payload;
      const left = state.columnSizePrefs[leftId];
      const right = state.columnSizePrefs[rightId];
      if (!left || !right) return;
      const total = left.widthFraction + right.widthFraction;
      let newLeft = Math.max(
        left.minFraction,
        Math.min(left.maxFraction, left.widthFraction + deltaFraction)
      );
      let newRight = total - newLeft;
      newRight = Math.max(right.minFraction, Math.min(right.maxFraction, newRight));
      newLeft = total - newRight;
      state.columnSizePrefs[leftId] = { ...left, widthFraction: newLeft };
      state.columnSizePrefs[rightId] = { ...right, widthFraction: newRight };
    },
    resetColumnOrder: (state) => {
      state.columnOrder = [...DEFAULT_COLUMN_IDS];
      state.columnSizePrefs = initialSizePrefs();
    },
    setSelectedTrackerAgentId: (state, action: { payload: string | null }) => {
      state.selectedTrackerAgentId = action.payload;
    },
    setSelectedSimulateAgentId: (state, action: { payload: string | null }) => {
      state.selectedSimulateAgentId = action.payload;
    },
    incrementSimulateEnqueuedListVersion: (state) => {
      state.simulateEnqueuedListVersion += 1;
    },
  },
});

export const {
  setActivePrimaryTab,
  setColumnOrder,
  setColumnSizePrefs,
  setColumnWidth,
  resizeColumns,
  resetColumnOrder,
  setSelectedTrackerAgentId,
  setSelectedSimulateAgentId,
  incrementSimulateEnqueuedListVersion,
} = layoutSlice.actions;
export default layoutSlice.reducer;
