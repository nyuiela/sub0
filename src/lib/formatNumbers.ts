/**
 * Number formatting for markets, positions, and trades.
 * Uses contract conventions: USDC 6 decimals, outcome tokens 18 decimals.
 */

import contractsData from "@/contract/contracts.json";

type ContractsJson = {
  conventions?: { usdcDecimals?: number; outcomeTokenDecimals?: number };
};
const CONVENTIONS = (contractsData as ContractsJson)?.conventions ?? {
  usdcDecimals: 6,
  outcomeTokenDecimals: 18,
};

export const USDC_DECIMALS = CONVENTIONS.usdcDecimals ?? 6;
export const OUTCOME_TOKEN_DECIMALS = CONVENTIONS.outcomeTokenDecimals ?? 18;

const OUTCOME_PRICE_DECIMALS = 4;
const COLLATERAL_DISPLAY_DECIMALS = 2;
const OUTCOME_QUANTITY_DECIMALS = 4;

function toNum(value: string | number | null | undefined): number {
  if (value == null || value === "") return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Format outcome price (0-1). Limits to 4 decimal places.
 */
export function formatOutcomePrice(value: string | number | null | undefined): string {
  const n = toNum(value);
  if (Number.isNaN(n)) return "—";
  const clamped = Math.max(0, Math.min(1, n));
  return clamped.toFixed(OUTCOME_PRICE_DECIMALS);
}

/**
 * Format collateral/USDC for display. Value can be human-readable or raw (with 6 decimals).
 * When isRaw true, divides by 10^usdcDecimals before formatting.
 */
export function formatCollateral(
  value: string | number | null | undefined,
  isRaw = false
): string {
  const n = toNum(value);
  if (Number.isNaN(n)) return "—";
  const display = isRaw ? n / Math.pow(10, USDC_DECIMALS) : n;
  return display.toFixed(COLLATERAL_DISPLAY_DECIMALS);
}

/**
 * Format outcome quantity/size (e.g. order book quantity). Limits to 4 decimal places.
 */
export function formatOutcomeQuantity(value: string | number | null | undefined): string {
  const n = toNum(value);
  if (Number.isNaN(n)) return "—";
  return n >= 0 ? n.toFixed(OUTCOME_QUANTITY_DECIMALS) : "—";
}
