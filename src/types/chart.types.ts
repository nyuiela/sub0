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

export interface CandlesResponse {
  data: OHLCV[];
  interval?: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
}
