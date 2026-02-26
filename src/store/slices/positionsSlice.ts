import { createSlice } from "@reduxjs/toolkit";

export interface PositionsSliceState {
  /** Incremented when MARKET_UPDATED (reason: position) is received; components refetch when this changes. */
  refetchTrigger: number;
}

const initialState: PositionsSliceState = {
  refetchTrigger: 0,
};

const positionsSlice = createSlice({
  name: "positions",
  initialState,
  reducers: {
    requestPositionsRefetch: (state) => {
      state.refetchTrigger += 1;
    },
  },
});

export const { requestPositionsRefetch } = positionsSlice.actions;
export default positionsSlice.reducer;
