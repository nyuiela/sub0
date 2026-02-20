/**
 * Theme and styling types for the prediction market platform.
 * Used by Redux theme slice and theme provider.
 */

export const THEME_IDS = ["light", "dark", "trading"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const FONT_IDS = ["inter", "geist", "jetbrains-mono"] as const;
export type FontId = (typeof FONT_IDS)[number];

export const SIZE_IDS = ["small", "compact", "normal"] as const;
export type SizeId = (typeof SIZE_IDS)[number];

export interface ThemeState {
  themeId: ThemeId;
  fontId: FontId;
  sizeId: SizeId;
}

export type ThemeClass = `theme-${ThemeId}`;
export type FontClass = `font-${FontId}`;
export type SizeClass = `size-${SizeId}`;
