/**
 * Types for trading chart OHLCV and lightweight-charts.
 * time: UTC seconds (UTCTimestamp for lightweight-charts).
 */

export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/** Backend GET /api/markets/:id/candles response. time in ms; prices/volume strings. */
export interface BackendCandle {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

export interface BackendCandlesResponse {
  marketId: string;
  candles: BackendCandle[];
}

/** Frontend candles API response (normalized). */
export interface CandlesResponse {
  data: OHLCV[];
  resolution?: "1m" | "1h" | "1d";
}
