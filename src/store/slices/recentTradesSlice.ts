import { createSlice } from "@reduxjs/toolkit";
import type { TradeExecutedPayload } from "@/types/market.types";

export interface RecentTradeItem extends TradeExecutedPayload {
  id: string;
}

export interface RecentTradesSliceState {
  items: RecentTradeItem[];
}

const MAX_RECENT_TRADES = 50;

const initialState: RecentTradesSliceState = {
  items: [],
};

const recentTradesSlice = createSlice({
  name: "recentTrades",
  initialState,
  reducers: {
    addRecentTrade: (state, action: { payload: TradeExecutedPayload }) => {
      const p = action.payload;
      const item: RecentTradeItem = {
        ...p,
        id: `${p.marketId}-${p.executedAt}-${state.items.length}-${Date.now()}`,
      };
      state.items = [item, ...state.items].slice(0, MAX_RECENT_TRADES);
    },
    clearRecentTrades: (state) => {
      state.items = [];
    },
  },
});

export const { addRecentTrade, clearRecentTrades } = recentTradesSlice.actions;
export default recentTradesSlice.reducer;
