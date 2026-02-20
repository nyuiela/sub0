import { createSlice } from "@reduxjs/toolkit";
import type { ThemeId, FontId, SizeId } from "@/types/theme.types";

export interface ThemeSliceState {
  themeId: ThemeId;
  fontId: FontId;
  sizeId: SizeId;
}

const initialState: ThemeSliceState = {
  themeId: "trading",
  fontId: "jetbrains-mono",
  sizeId: "small",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: { payload: ThemeId }) => {
      state.themeId = action.payload;
    },
    setFont: (state, action: { payload: FontId }) => {
      state.fontId = action.payload;
    },
    setSize: (state, action: { payload: SizeId }) => {
      state.sizeId = action.payload;
    },
  },
});

export const { setTheme, setFont, setSize } = themeSlice.actions;
export default themeSlice.reducer;
