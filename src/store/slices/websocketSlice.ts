import { createSlice } from "@reduxjs/toolkit";
import type { WebSocketStatus, WebSocketMessage } from "@/types/websocket.types";

export interface WebSocketSliceState {
  status: WebSocketStatus;
  lastMessage: WebSocketMessage | null;
  lastError: string | null;
  reconnectAttempts: number;
}

const initialState: WebSocketSliceState = {
  status: "idle",
  lastMessage: null,
  lastError: null,
  reconnectAttempts: 0,
};

const websocketSlice = createSlice({
  name: "websocket",
  initialState,
  reducers: {
    setStatus: (state, action: { payload: WebSocketStatus }) => {
      state.status = action.payload;
    },
    setLastMessage: (state, action: { payload: WebSocketMessage | null }) => {
      state.lastMessage = action.payload;
    },
    setLastError: (state, action: { payload: string | null }) => {
      state.lastError = action.payload;
    },
    setReconnectAttempts: (state, action: { payload: number }) => {
      state.reconnectAttempts = action.payload;
    },
    resetWebSocket: () => initialState,
  },
});

export const {
  setStatus,
  setLastMessage,
  setLastError,
  setReconnectAttempts,
  resetWebSocket,
} = websocketSlice.actions;
export default websocketSlice.reducer;
