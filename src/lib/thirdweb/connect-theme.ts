/**
 * Thirdweb ConnectButton and modal theme aligned with app design tokens.
 * Colors match globals.css (--color-*) for light, dark, and trading themes.
 */

import { darkTheme, lightTheme } from "thirdweb/react";
import type { Theme } from "thirdweb/react";

const LIGHT_COLORS = {
  pageBg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  textMuted: "#475569",
  textDisabled: "#94A3B8",
  primary: "#0EA5E9",
  primaryHover: "#0284C7",
  primaryMuted: "#E0F2FE",
  success: "#22C55E",
  danger: "#EF4444",
  overlay: "rgba(15, 23, 42, 0.5)",
} as const;

const DARK_COLORS = {
  pageBg: "#0F172A",
  surface: "#1E293B",
  border: "#334155",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  textDisabled: "#64748B",
  primary: "#38BDF8",
  primaryHover: "#0EA5E9",
  primaryMuted: "#0C4A6E",
  success: "#4ADE80",
  danger: "#F87171",
  overlay: "rgba(0, 0, 0, 0.6)",
} as const;

const TRADING_COLORS = {
  pageBg: "#0A0E14",
  surface: "#0D1117",
  border: "#21262D",
  text: "#E6EDF3",
  textMuted: "#8B949E",
  textDisabled: "#484F58",
  primary: "#58A6FF",
  primaryHover: "#79B8FF",
  primaryMuted: "#1F3A5F",
  success: "#3FB950",
  danger: "#F85149",
  overlay: "rgba(0, 0, 0, 0.7)",
} as const;

function buildLightTheme(): Theme {
  return lightTheme({
    colors: {
      primaryText: LIGHT_COLORS.text,
      secondaryText: LIGHT_COLORS.textMuted,
      accentText: LIGHT_COLORS.primary,
      primaryButtonBg: LIGHT_COLORS.primary,
      primaryButtonText: "#FFFFFF",
      accentButtonBg: LIGHT_COLORS.primary,
      accentButtonText: "#FFFFFF",
      secondaryButtonBg: "transparent",
      secondaryButtonText: LIGHT_COLORS.text,
      secondaryButtonHoverBg: LIGHT_COLORS.primaryMuted,
      modalBg: LIGHT_COLORS.surface,
      modalOverlayBg: LIGHT_COLORS.overlay,
      borderColor: LIGHT_COLORS.border,
      separatorLine: LIGHT_COLORS.border,
      connectedButtonBg: LIGHT_COLORS.surface,
      connectedButtonBgHover: LIGHT_COLORS.primaryMuted,
      secondaryIconColor: LIGHT_COLORS.textMuted,
      secondaryIconHoverBg: LIGHT_COLORS.primaryMuted,
      secondaryIconHoverColor: LIGHT_COLORS.text,
      tooltipBg: LIGHT_COLORS.surface,
      tooltipText: LIGHT_COLORS.text,
      inputAutofillBg: LIGHT_COLORS.primaryMuted,
      scrollbarBg: LIGHT_COLORS.border,
      tertiaryBg: LIGHT_COLORS.pageBg,
      skeletonBg: LIGHT_COLORS.border,
      selectedTextBg: LIGHT_COLORS.primaryMuted,
      selectedTextColor: LIGHT_COLORS.text,
      success: LIGHT_COLORS.success,
      danger: LIGHT_COLORS.danger,
    },
    fontFamily: "inherit",
  });
}

function buildDarkTheme(): Theme {
  const c = DARK_COLORS;
  return darkTheme({
    colors: {
      primaryText: c.text,
      secondaryText: c.textMuted,
      accentText: c.primary,
      primaryButtonBg: c.primary,
      primaryButtonText: "#0F172A",
      accentButtonBg: c.primary,
      accentButtonText: "#0F172A",
      secondaryButtonBg: "transparent",
      secondaryButtonText: c.text,
      secondaryButtonHoverBg: c.primaryMuted,
      modalBg: c.surface,
      modalOverlayBg: c.overlay,
      borderColor: c.border,
      separatorLine: c.border,
      connectedButtonBg: c.surface,
      connectedButtonBgHover: c.primaryMuted,
      secondaryIconColor: c.textMuted,
      secondaryIconHoverBg: c.primaryMuted,
      secondaryIconHoverColor: c.text,
      tooltipBg: c.surface,
      tooltipText: c.text,
      inputAutofillBg: c.primaryMuted,
      scrollbarBg: c.border,
      tertiaryBg: c.pageBg,
      skeletonBg: c.border,
      selectedTextBg: c.primaryMuted,
      selectedTextColor: c.text,
      success: c.success,
      danger: c.danger,
    },
    fontFamily: "inherit",
  });
}

function buildTradingTheme(): Theme {
  const c = TRADING_COLORS;
  return darkTheme({
    colors: {
      primaryText: c.text,
      secondaryText: c.textMuted,
      accentText: c.primary,
      primaryButtonBg: c.primary,
      primaryButtonText: "#0A0E14",
      accentButtonBg: c.primary,
      accentButtonText: "#0A0E14",
      secondaryButtonBg: "transparent",
      secondaryButtonText: c.text,
      secondaryButtonHoverBg: c.primaryMuted,
      modalBg: c.surface,
      modalOverlayBg: c.overlay,
      borderColor: c.border,
      separatorLine: c.border,
      connectedButtonBg: c.surface,
      connectedButtonBgHover: c.primaryMuted,
      secondaryIconColor: c.textMuted,
      secondaryIconHoverBg: c.primaryMuted,
      secondaryIconHoverColor: c.text,
      tooltipBg: c.surface,
      tooltipText: c.text,
      inputAutofillBg: c.primaryMuted,
      scrollbarBg: c.border,
      tertiaryBg: c.pageBg,
      skeletonBg: c.border,
      selectedTextBg: c.primaryMuted,
      selectedTextColor: c.text,
      success: c.success,
      danger: c.danger,
    },
    fontFamily: "inherit",
  });
}

const lightThemeMemo = buildLightTheme();
const darkThemeMemo = buildDarkTheme();
const tradingThemeMemo = buildTradingTheme();

export type AppThemeId = "light" | "dark" | "trading";

/**
 * Returns the Thirdweb theme object for the given app theme id.
 * Use with ConnectButton theme prop so modals and buttons match the app.
 */
export function getConnectTheme(themeId: AppThemeId): Theme {
  switch (themeId) {
    case "light":
      return lightThemeMemo;
    case "dark":
      return darkThemeMemo;
    case "trading":
      return tradingThemeMemo;
    default:
      return darkThemeMemo;
  }
}
