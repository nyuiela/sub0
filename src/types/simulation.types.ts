/**
 * Types for Settings > Simulations (list and detail).
 * Matches GET /api/simulations and GET /api/simulations/:id responses.
 */

export interface SimulationListItem {
  id: string;
  agentId: string;
  agentName: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  maxMarkets: number | null;
  durationMinutes: number | null;
  status: string;
  createdAt: string;
  enqueuedCount: number;
}

export interface SimulationListResponse {
  simulations: SimulationListItem[];
}

export interface SimulationMarketRow {
  marketId: string;
  marketName: string | null;
  marketStatus: string | null;
  status: string;
  discardReason?: string;
}

export interface SimulationDetailResponse {
  id: string;
  agentId: string;
  agentName: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  maxMarkets: number | null;
  durationMinutes: number | null;
  status: string;
  createdAt: string;
  markets: SimulationMarketRow[];
}
