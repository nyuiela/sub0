/**
 * Simulate-only: markets the agent has discarded (per agent).
 * Used to show "Discarded" on the Add-to-agent button and filter Discovery.
 * Does not affect the main Markets page.
 */

import { createSlice } from "@reduxjs/toolkit";

export interface SimulateDiscardedSliceState {
  /** agentId -> marketIds[] */
  byAgent: Record<string, string[]>;
}

const initialState: SimulateDiscardedSliceState = {
  byAgent: {},
};

const slice = createSlice({
  name: "simulateDiscarded",
  initialState,
  reducers: {
    setDiscarded: (
      state,
      action: { payload: { agentId: string; marketId: string } }
    ) => {
      const { agentId, marketId } = action.payload;
      const list = state.byAgent[agentId] ?? [];
      if (!list.includes(marketId)) {
        state.byAgent[agentId] = [...list, marketId];
      }
    },
    removeDiscarded: (
      state,
      action: { payload: { agentId: string; marketId: string } }
    ) => {
      const { agentId, marketId } = action.payload;
      const list = state.byAgent[agentId] ?? [];
      state.byAgent[agentId] = list.filter((id) => id !== marketId);
    },
    clearDiscardedForAgent: (
      state,
      action: { payload: { agentId: string } }
    ) => {
      delete state.byAgent[action.payload.agentId];
    },
  },
});

export const {
  setDiscarded,
  removeDiscarded,
  clearDiscardedForAgent,
} = slice.actions;

export default slice.reducer;
