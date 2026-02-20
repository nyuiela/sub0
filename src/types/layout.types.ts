/**
 * Layout and navigation types for the trading dashboard shell.
 */

export const PRIMARY_TAB_IDS = [
  "markets",
  "trade",
  "tracker",
  "earn",
  "wallet",
] as const;
export type PrimaryTabId = (typeof PRIMARY_TAB_IDS)[number];

export const DEFAULT_COLUMN_IDS = ["new", "stretch", "migrated"] as const;
export type ColumnId = (typeof DEFAULT_COLUMN_IDS)[number];

export interface ColumnSizePrefs {
  /** Width as fraction of total (0–1). Sum of all column widths should be 1. */
  widthFraction: number;
  /** Minimum width as fraction (0–1). */
  minFraction: number;
  /** Maximum width as fraction (0–1). */
  maxFraction: number;
}

export const DEFAULT_COLUMN_SIZE_PREFS: Record<string, ColumnSizePrefs> = {
  new: { widthFraction: 1 / 3, minFraction: 0.15, maxFraction: 0.6 },
  stretch: { widthFraction: 1 / 3, minFraction: 0.15, maxFraction: 0.6 },
  migrated: { widthFraction: 1 / 3, minFraction: 0.15, maxFraction: 0.6 },
};

export interface LayoutState {
  activePrimaryTab: PrimaryTabId;
  columnOrder: string[];
  /** Per-column size preferences (width and min/max fractions). */
  columnSizePrefs: Record<string, ColumnSizePrefs>;
}

export const PRIMARY_TAB_LABELS: Record<PrimaryTabId, string> = {
  markets: "Markets",
  trade: "Trade",
  tracker: "Tracker",
  earn: "Earn",
  wallet: "Wallet",
};
