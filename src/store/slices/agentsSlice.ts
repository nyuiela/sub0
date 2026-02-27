import { createSlice } from "@reduxjs/toolkit";

export interface AgentsSliceState {
  /** Live balance by agent id (from sync-balance or AGENT_UPDATED). Overrides list/detail balance in UI. */
  balanceByAgentId: Record<string, string>;
}

const initialState: AgentsSliceState = {
  balanceByAgentId: {},
};

const agentsSlice = createSlice({
  name: "agents",
  initialState,
  reducers: {
    setAgentBalance: (state, action: { payload: { agentId: string; balance: string } }) => {
      const { agentId, balance } = action.payload;
      if (agentId) state.balanceByAgentId[agentId] = balance;
    },
  },
});

export const { setAgentBalance } = agentsSlice.actions;
export default agentsSlice.reducer;
