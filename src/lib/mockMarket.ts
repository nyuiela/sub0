import type { Market } from "@/types/market.types";

const MOCK_ID = "mock-no-markets";
const NOW_ISO = new Date().toISOString();

/**
 * Placeholder market shown when the list is empty (e.g. API down or no open markets).
 * Used by MiniMarketsContainer and SimulateMarketsColumn so the UI always shows at least one card.
 */
export const MOCK_MARKET: Market = {
  id: MOCK_ID,
  name: "No markets available",
  creatorAddress: "",
  volume: "0",
  context: null,
  imageUrl: null,
  outcomes: ["Yes", "No"],
  sourceUrl: null,
  resolutionDate: "",
  oracleAddress: "",
  status: "OPEN",
  collateralToken: "",
  conditionId: MOCK_ID,
  createdAt: NOW_ISO,
  updatedAt: NOW_ISO,
  totalVolume: "0",
};

export function isMockMarket(market: Market): boolean {
  return market.id === MOCK_ID;
}
