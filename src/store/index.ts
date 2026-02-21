import { configureStore, type Middleware } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import websocketReducer from "./slices/websocketSlice";
import layoutReducer from "./slices/layoutSlice";
import marketsReducer from "./slices/marketsSlice";
import { saveThemeToStorage } from "./themePersist";
import { saveLayoutToStorage } from "./layoutPersist";
import type { ThemeSliceState } from "./slices/themeSlice";
import type { WebSocketSliceState } from "./slices/websocketSlice";
import type { LayoutSliceState } from "./slices/layoutSlice";
import type { MarketsSliceState } from "./slices/marketsSlice";

export type RootState = {
  theme: ThemeSliceState;
  websocket: WebSocketSliceState;
  layout: LayoutSliceState;
  markets: MarketsSliceState;
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
    type === "layout/setColumnOrder" ||
    type === "layout/setColumnSizePrefs" ||
    type === "layout/resizeColumns" ||
    type === "layout/resetColumnOrder"
  ) {
    saveLayoutToStorage(storeApi.getState());
  }
  return result;
};

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    websocket: websocketReducer,
    layout: layoutReducer,
    markets: marketsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: true }).concat(persistMiddleware),
});

export type AppDispatch = typeof store.dispatch;
