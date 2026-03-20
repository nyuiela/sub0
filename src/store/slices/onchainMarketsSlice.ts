/**
 * Redux slice for on-chain market registry state.
 * Stores markets confirmed on-chain via the registry-sync CRE workflow.
 * Populated by WebSocket REGISTRY_SYNC_UPDATE events and the market-onchain API helper.
 * Complements marketsSlice (REST-fetched cache) with live on-chain confirmations.
 */

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { Market } from "@/types/market.types";
import {
  fetchOnchainConfirmedMarkets,
  type OnchainMarketRecord,
} from "@/lib/api/market-onchain";

export interface OnchainMarketEntry {
  marketId: string;
  questionId: string | null;
  txHash: string | null;
  workflowRunId: string | null;
  syncedAt: number;
  market: Market | null;
}

export interface OnchainMarketsState {
  entriesByMarketId: Record<string, OnchainMarketEntry>;
  confirmedMarkets: Market[];
  loading: boolean;
  lastSyncedAt: number | null;
  error: string | null;
}

const initialState: OnchainMarketsState = {
  entriesByMarketId: {},
  confirmedMarkets: [],
  loading: false,
  lastSyncedAt: null,
  error: null,
};

export const fetchConfirmedOnchainMarkets = createAsyncThunk(
  "onchainMarkets/fetchConfirmed",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchOnchainConfirmedMarkets();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch on-chain markets";
      return rejectWithValue(msg);
    }
  }
);

const onchainMarketsSlice = createSlice({
  name: "onchainMarkets",
  initialState,
  reducers: {
    /**
     * Merge a registry-sync update from the WebSocket REGISTRY_SYNC_UPDATE event.
     * Called from the WebSocket handler when the CRE workflow posts a sync.
     */
    mergeRegistrySyncUpdate(
      state,
      action: PayloadAction<{
        markets: OnchainMarketRecord[];
        source?: string;
        receivedAt?: number;
      }>
    ) {
      const { markets, receivedAt } = action.payload;
      const now = receivedAt ?? Date.now();

      for (const m of markets) {
        const existing = state.entriesByMarketId[m.marketId];
        state.entriesByMarketId[m.marketId] = {
          marketId: m.marketId,
          questionId: m.questionId ?? existing?.questionId ?? null,
          txHash: m.txHash ?? existing?.txHash ?? null,
          workflowRunId: m.workflowRunId ?? existing?.workflowRunId ?? null,
          syncedAt: now,
          market: existing?.market ?? null,
        };
      }

      state.lastSyncedAt = now;
    },

    /**
     * Attach a full Market object to an onchain entry (called after market detail is fetched).
     */
    attachMarketToEntry(
      state,
      action: PayloadAction<{ marketId: string; market: Market }>
    ) {
      const entry = state.entriesByMarketId[action.payload.marketId];
      if (entry) {
        entry.market = action.payload.market;
      }
    },

    clearOnchainMarkets(state) {
      state.entriesByMarketId = {};
      state.confirmedMarkets = [];
      state.lastSyncedAt = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConfirmedOnchainMarkets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConfirmedOnchainMarkets.fulfilled, (state, action) => {
        state.loading = false;
        state.confirmedMarkets = action.payload;
        const now = Date.now();
        for (const m of action.payload) {
          const existing = state.entriesByMarketId[m.id];
          state.entriesByMarketId[m.id] = {
            marketId: m.id,
            questionId: existing?.questionId ?? null,
            txHash: existing?.txHash ?? null,
            workflowRunId: existing?.workflowRunId ?? null,
            syncedAt: now,
            market: m,
          };
        }
        state.lastSyncedAt = now;
      })
      .addCase(fetchConfirmedOnchainMarkets.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string | undefined) ?? "Unknown error";
      });
  },
});

export const {
  mergeRegistrySyncUpdate,
  attachMarketToEntry,
  clearOnchainMarkets,
} = onchainMarketsSlice.actions;

export default onchainMarketsSlice.reducer;
