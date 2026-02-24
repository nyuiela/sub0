import { createSlice } from "@reduxjs/toolkit";

/** Per-market list of agent IDs that have been added (enqueued) for trading. */
export interface MarketAgentsSliceState {
  /** marketId -> agentIds[] */
  byMarket: Record<string, string[]>;
}

const initialState: MarketAgentsSliceState = {
  byMarket: {},
};

const marketAgentsSlice = createSlice({
  name: "marketAgents",
  initialState,
  reducers: {
    addAgentToMarket: (
      state,
      action: { payload: { marketId: string; agentId: string } }
    ) => {
      const { marketId, agentId } = action.payload;
      const list = state.byMarket[marketId] ?? [];
      if (!list.includes(agentId)) {
        state.byMarket[marketId] = [...list, agentId];
      }
    },
    removeAgentFromMarket: (
      state,
      action: { payload: { marketId: string; agentId: string } }
    ) => {
      const { marketId, agentId } = action.payload;
      const list = state.byMarket[marketId] ?? [];
      state.byMarket[marketId] = list.filter((id) => id !== agentId);
    },
    setAgentsForMarket: (
      state,
      action: { payload: { marketId: string; agentIds: string[] } }
    ) => {
      const { marketId, agentIds } = action.payload;
      state.byMarket[marketId] = [...agentIds];
    },
    /** Hydrate byMarket from agents (each agent has enqueuedMarketIds). Used when loading Markets page. */
    setByMarketFromAgents: (
      state,
      action: { payload: { agents: { id: string; enqueuedMarketIds?: string[] }[] } }
    ) => {
      const byMarket: Record<string, string[]> = {};
      for (const agent of action.payload.agents) {
        const ids = agent.enqueuedMarketIds ?? [];
        for (const marketId of ids) {
          if (!marketId) continue;
          const list = byMarket[marketId] ?? [];
          if (!list.includes(agent.id)) {
            byMarket[marketId] = [...list, agent.id];
          }
        }
      }
      state.byMarket = byMarket;
    },
  },
});

export const {
  addAgentToMarket,
  removeAgentFromMarket,
  setAgentsForMarket,
  setByMarketFromAgents,
} = marketAgentsSlice.actions;

export default marketAgentsSlice.reducer;
