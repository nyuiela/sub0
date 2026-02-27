import { configureStore, type Middleware } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import websocketReducer from "./slices/websocketSlice";
import layoutReducer from "./slices/layoutSlice";
import marketsReducer from "./slices/marketsSlice";
import recentReducer from "./slices/recentSlice";
import marketAgentsReducer from "./slices/marketAgentsSlice";
import simulateDiscardedReducer from "./slices/simulateDiscardedSlice";
import positionsReducer from "./slices/positionsSlice";
import recentTradesReducer from "./slices/recentTradesSlice";
import agentsReducer from "./slices/agentsSlice";
import { saveThemeToStorage } from "./themePersist";
import { saveLayoutToStorage } from "./layoutPersist";
import { saveRecentToStorage } from "./recentPersist";
import type { ThemeSliceState } from "./slices/themeSlice";
import type { WebSocketSliceState } from "./slices/websocketSlice";
import type { LayoutSliceState } from "./slices/layoutSlice";
import type { MarketsSliceState } from "./slices/marketsSlice";
import type { RecentSliceState } from "./slices/recentSlice";
import type { MarketAgentsSliceState } from "./slices/marketAgentsSlice";
import type { SimulateDiscardedSliceState } from "./slices/simulateDiscardedSlice";
import type { PositionsSliceState } from "./slices/positionsSlice";
import type { RecentTradesSliceState } from "./slices/recentTradesSlice";
import type { AgentsSliceState } from "./slices/agentsSlice";

export type RootState = {
  theme: ThemeSliceState;
  websocket: WebSocketSliceState;
  layout: LayoutSliceState;
  markets: MarketsSliceState;
  recent: RecentSliceState;
  marketAgents: MarketAgentsSliceState;
  simulateDiscarded: SimulateDiscardedSliceState;
  positions: PositionsSliceState;
  recentTrades: RecentTradesSliceState;
  agents: AgentsSliceState;
};

const persistMiddleware: Middleware<object, RootState> = (storeApi) => (next) => (action) => {
  const result = next(action);
  const type = (action as { type?: string })?.type ?? "";
  if (
    type === "theme/setTheme" ||
    type === "theme/setFont" ||
    type === "theme/setSize"
  ) {
    saveThemeToStorage(storeApi.getState());
  }
  if (
    type === "layout/setActivePrimaryTab" ||
    type === "layout/setColumnOrder" ||
    type === "layout/setColumnSizePrefs" ||
    type === "layout/resizeColumns" ||
    type === "layout/resetColumnOrder"
  ) {
    saveLayoutToStorage(storeApi.getState());
  }
  if (type === "recent/addRecent" || type === "recent/removeRecent" || type === "recent/clearRecent") {
    saveRecentToStorage(storeApi.getState());
  }
  return result;
};

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    websocket: websocketReducer,
    layout: layoutReducer,
    markets: marketsReducer,
    recent: recentReducer,
    marketAgents: marketAgentsReducer,
    simulateDiscarded: simulateDiscardedReducer,
    positions: positionsReducer,
    recentTrades: recentTradesReducer,
    agents: agentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: true }).concat(persistMiddleware),
});

export type AppDispatch = typeof store.dispatch;
