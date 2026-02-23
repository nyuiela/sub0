/**
 * Filter bar and recent-interactions types (markets/agents user clicked or favorited).
 */

export type RecentItemType = "market" | "agent";

export interface RecentItem {
  type: RecentItemType;
  id: string;
  label: string;
  interactedAt: number;
}

export const MAX_RECENT_ITEMS = 6;
