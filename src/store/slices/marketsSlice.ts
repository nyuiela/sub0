import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type {
  Market,
  MarketListParams,
  OrderBookSnapshot,
  TradeExecutedPayload,
  MarketStatsUpdatedPayload,
} from "@/types/market.types";
import * as marketsApi from "@/lib/api/markets";

export interface MarketsSliceState {
  list: Market[];
  total: number;
  limit: number;
  offset: number;
  selectedMarket: Market | null;
  orderBookByMarketId: Record<string, OrderBookSnapshot>;
  loading: boolean;
  listLoading: boolean;
  detailLoading: boolean;
  error: string | null;
}

const initialState: MarketsSliceState = {
  list: [],
  total: 0,
  limit: 20,
  offset: 0,
  selectedMarket: null,
  orderBookByMarketId: {},
  loading: false,
  listLoading: false,
  detailLoading: false,
  error: null,
};

export const fetchMarkets = createAsyncThunk(
  "markets/fetchList",
  async (params: MarketListParams = {}, { rejectWithValue }) => {
    try {
      return await marketsApi.listMarkets(params);
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : "Failed to fetch markets");
    }
  }
);

export const fetchMarketById = createAsyncThunk(
  "markets/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      return await marketsApi.getMarketById(id);
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : "Failed to fetch market");
    }
  }
);

export const fetchMarketByConditionId = createAsyncThunk(
  "markets/fetchByConditionId",
  async (conditionId: string, { rejectWithValue }) => {
    try {
      return await marketsApi.getMarketByConditionId(conditionId);
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : "Failed to fetch market");
    }
  }
);

export const createMarket = createAsyncThunk(
  "markets/create",
  async (
    body: Parameters<typeof marketsApi.createMarket>[0],
    { rejectWithValue }
  ) => {
    try {
      return await marketsApi.createMarket(body);
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : "Failed to create market");
    }
  }
);

export const updateMarket = createAsyncThunk(
  "markets/update",
  async (
    { id, body }: { id: string; body: Parameters<typeof marketsApi.updateMarket>[1] },
    { rejectWithValue }
  ) => {
    try {
      return await marketsApi.updateMarket(id, body);
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : "Failed to update market");
    }
  }
);

export const deleteMarketThunk = createAsyncThunk(
  "markets/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await marketsApi.deleteMarket(id);
      return id;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : "Failed to delete market");
    }
  }
);

const marketsSlice = createSlice({
  name: "markets",
  initialState,
  reducers: {
    setOrderBookForMarket: (state, action: { payload: OrderBookSnapshot }) => {
      const { marketId, bids, asks, timestamp } = action.payload;
      state.orderBookByMarketId[marketId] = { marketId, bids, asks, timestamp };
      const sel = state.selectedMarket;
      if (sel?.id === marketId) {
        state.selectedMarket = { ...sel, orderBookSnapshot: action.payload };
      }
      const idx = state.list.findIndex((m) => m.id === marketId);
      if (idx >= 0) {
        state.list[idx] = {
          ...state.list[idx],
          orderBookSnapshot: action.payload,
        };
      }
    },
    applyTradeToMarket: (state, action: { payload: TradeExecutedPayload }) => {
      const { marketId, executedAt } = action.payload;
      if (state.selectedMarket?.id === marketId) {
        state.selectedMarket = {
          ...state.selectedMarket,
          lastTradeAt: executedAt,
          totalTrades: (state.selectedMarket.totalTrades ?? 0) + 1,
        };
      }
      const idx = state.list.findIndex((m) => m.id === marketId);
      if (idx >= 0) {
        const m = state.list[idx];
        state.list[idx] = {
          ...m,
          lastTradeAt: executedAt,
          totalTrades: (m.totalTrades ?? 0) + 1,
        };
      }
    },
    setMarketVolumeFromStats: (state, action: { payload: MarketStatsUpdatedPayload }) => {
      const { marketId, volume } = action.payload;
      if (state.selectedMarket?.id === marketId) {
        state.selectedMarket = { ...state.selectedMarket, volume };
      }
      const idx = state.list.findIndex((m) => m.id === marketId);
      if (idx >= 0) {
        state.list[idx] = { ...state.list[idx], volume };
      }
    },
    clearSelectedMarket: (state) => {
      state.selectedMarket = null;
    },
    clearMarketsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarkets.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchMarkets.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload.data;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
      })
      .addCase(fetchMarkets.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMarketById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchMarketById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedMarket = action.payload;
        const snap = action.payload.orderBookSnapshot;
        if (snap) {
          state.orderBookByMarketId[action.payload.id] = snap;
        }
      })
      .addCase(fetchMarketById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMarketByConditionId.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchMarketByConditionId.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedMarket = action.payload;
      })
      .addCase(fetchMarketByConditionId.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createMarket.fulfilled, (state, action) => {
        state.list = [action.payload, ...state.list];
        state.total += 1;
      })
      .addCase(updateMarket.fulfilled, (state, action) => {
        const m = action.payload;
        if (state.selectedMarket?.id === m.id) {
          state.selectedMarket = m;
        }
        const idx = state.list.findIndex((x) => x.id === m.id);
        if (idx >= 0) state.list[idx] = m;
      })
      .addCase(deleteMarketThunk.fulfilled, (state, action) => {
        const id = action.payload;
        state.list = state.list.filter((m) => m.id !== id);
        if (state.selectedMarket?.id === id) state.selectedMarket = null;
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export const {
  setOrderBookForMarket,
  applyTradeToMarket,
  setMarketVolumeFromStats,
  clearSelectedMarket,
  clearMarketsError,
} = marketsSlice.actions;

export function selectOrderBookByMarketId(
  state: { markets: MarketsSliceState },
  marketId: string
): OrderBookSnapshot | undefined {
  return state.markets.orderBookByMarketId[marketId];
}

export default marketsSlice.reducer;
