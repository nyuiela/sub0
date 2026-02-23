/**
 * Feed API – GET /api/feed response and query params.
 * Backend ingests from RSS (CoinDesk, CoinTelegraph) and CryptoPanic.
 */

export type FeedSource =
  | "RSS_COINDESK"
  | "RSS_COINTELEGRAPH"
  | "CRYPTOPANIC";

export interface FeedItemMetadata {
  currencies?: string[];
  [key: string]: unknown;
}

export interface FeedItem {
  id: string;
  source: FeedSource;
  externalId: string;
  title: string;
  body: string | null;
  sourceUrl: string | null;
  imageUrl: string | null;
  publishedAt: string;
  metadata: FeedItemMetadata | null;
  createdAt: string;
}

export interface FeedResponse {
  data: FeedItem[];
}

export interface FeedParams {
  /** Comma-separated tickers, e.g. BTC,ETH. Filter by metadata.currencies or title/body. */
  currencies?: string;
  /** Default 50, max 100. */
  limit?: number;
  /** Optional filter by source. */
  source?: FeedSource;
}
