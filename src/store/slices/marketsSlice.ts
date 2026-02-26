import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type {
  Market,
  MarketListParams,
  OrderBookSnapshot,
  TradeExecutedPayload,
  MarketStatsUpdatedPayload,
} from "@/types/market.types";
import * as marketsApi from "@/lib/api/markets";
import { submitOrder as submitOrderApi } from "@/lib/api/orders";
import type { SubmitOrderBody, OrderResponseTrade, OrderResponseSnapshot } from "@/types/order.types";

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
  orderSubmitLoading: boolean;
  lastOrderSuccess: string | null;
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
  orderSubmitLoading: false,
  lastOrderSuccess: null,
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

function orderTradeToPayload(t: OrderResponseTrade): TradeExecutedPayload {
  return {
    marketId: t.marketId,
    side: t.side === "BID" ? "long" : "short",
    size: t.quantity,
    price: t.price,
    executedAt: new Date(t.executedAt).toISOString(),
    userId: t.userId ?? undefined,
    agentId: t.agentId ?? undefined,
  };
}

export const submitOrder = createAsyncThunk(
  "markets/submitOrder",
  async (body: SubmitOrderBody, { dispatch, rejectWithValue }) => {
    try {
      const res = await submitOrderApi(body);
      dispatch(setOrderBookForMarket(res.snapshot));
      for (const t of res.trades) {
        dispatch(applyTradeToMarket(orderTradeToPayload(t)));
      }
      return res;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : "Order failed");
    }
  }
);

const marketsSlice = createSlice({
  name: "markets",
  initialState,
  reducers: {
    setOrderBookForMarket: (state, action: { payload: OrderBookSnapshot | OrderResponseSnapshot }) => {
      const payload = action.payload;
      const { marketId, bids, asks, timestamp } = payload;
      const outcomeIndex = "outcomeIndex" in payload ? payload.outcomeIndex : 0;
      const key = `${marketId}-${outcomeIndex}`;
      state.orderBookByMarketId[key] = {
        marketId,
        outcomeIndex,
        bids,
        asks,
        timestamp,
      };
      const sel = state.selectedMarket;
      if (sel?.id === marketId) {
        state.selectedMarket = { ...sel, orderBookSnapshot: state.orderBookByMarketId[key] };
      }
      const idx = state.list.findIndex((m) => m.id === marketId);
      if (idx >= 0) {
        state.list[idx] = {
          ...state.list[idx],
          orderBookSnapshot: state.orderBookByMarketId[key],
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
    clearOrderSuccess: (state) => {
      state.lastOrderSuccess = null;
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
        state.list = Array.isArray(action.payload?.data) ? action.payload.data : [];
        state.total = action.payload?.total ?? 0;
        state.limit = action.payload?.limit ?? state.limit;
        state.offset = action.payload?.offset ?? state.offset;
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
      })
      .addCase(submitOrder.pending, (state) => {
        state.orderSubmitLoading = true;
        state.error = null;
        state.lastOrderSuccess = null;
      })
      .addCase(submitOrder.fulfilled, (state, action) => {
        state.orderSubmitLoading = false;
        const trades = action.payload.trades?.length ?? 0;
        state.lastOrderSuccess =
          trades > 0
            ? `Order filled. ${trades} trade${trades > 1 ? "s" : ""} executed.`
            : "Order placed.";
      })
      .addCase(submitOrder.rejected, (state, action) => {
        state.orderSubmitLoading = false;
        state.lastOrderSuccess = null;
        state.error = action.payload as string;
      });
  },
});

export const {
  setOrderBookForMarket,
  applyTradeToMarket,
  setMarketVolumeFromStats,
  clearSelectedMarket,
  clearMarketsError,
  clearOrderSuccess,
} = marketsSlice.actions;

export function selectOrderBookByMarketId(
  state: { markets: MarketsSliceState },
  marketId: string,
  outcomeIndex: number = 0
): OrderBookSnapshot | undefined {
  const key = `${marketId}-${outcomeIndex}`;
  return state.markets.orderBookByMarketId[key] ?? state.markets.orderBookByMarketId[marketId];
}

export default marketsSlice.reducer;
