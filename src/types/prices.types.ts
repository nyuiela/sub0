/**
 * Market prices API (LMSR) - GET /api/markets/:id/prices
 */

export interface MarketPriceOptionQuote {
  quantity: string;
  instantPrice: string;
  tradeCost: string;
}

export interface MarketPriceOption {
  outcomeIndex: number;
  label: string;
  instantPrice: string;
  buyQuote: MarketPriceOptionQuote;
  sellQuote: MarketPriceOptionQuote;
}

export interface MarketPricesResponse {
  marketId: string;
  outcomes: string[];
  liquidityParameter: string;
  quantities: string[];
  prices: string[];
  options: MarketPriceOption[];
}
