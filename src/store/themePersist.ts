import type { RootState } from "./index";
import type { ThemeSliceState } from "./slices/themeSlice";
import { setTheme, setFont, setSize } from "./slices/themeSlice";
import type { AppDispatch } from "./index";
import {
  THEME_IDS,
  FONT_IDS,
  SIZE_IDS,
  type ThemeId,
  type FontId,
  type SizeId,
} from "@/types/theme.types";

const STORAGE_KEY = "sub0-theme-prefs";

function parseStored(): Partial<ThemeSliceState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ThemeSliceState>;
    const out: Partial<ThemeSliceState> = {};
    if (parsed.themeId && THEME_IDS.includes(parsed.themeId)) out.themeId = parsed.themeId;
    if (parsed.fontId && FONT_IDS.includes(parsed.fontId)) out.fontId = parsed.fontId;
    if (parsed.sizeId && SIZE_IDS.includes(parsed.sizeId)) out.sizeId = parsed.sizeId;
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

/** Call on client mount to hydrate Redux from localStorage (avoids SSR mismatch). */
export function hydrateThemeFromStorage(dispatch: AppDispatch): void {
  const prefs = parseStored();
  if (!prefs) return;
  if (prefs.themeId) dispatch(setTheme(prefs.themeId));
  if (prefs.fontId) dispatch(setFont(prefs.fontId));
  if (prefs.sizeId) dispatch(setSize(prefs.sizeId));
}

export function saveThemeToStorage(state: RootState): void {
  if (typeof window === "undefined") return;
  try {
    const { theme } = state;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        themeId: theme.themeId,
        fontId: theme.fontId,
        sizeId: theme.sizeId,
      })
    );
  } catch {
    // ignore
  }
}
