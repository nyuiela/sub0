/**
 * Simulations API for Settings > Simulations (list and detail).
 * Uses /api/simulations (proxied to backend).
 */

import type {
  SimulationListResponse,
  SimulationDetailResponse,
} from "@/types/simulation.types";

export async function getSimulationsList(): Promise<SimulationListResponse> {
  const res = await fetch("/api/simulations", { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as SimulationListResponse & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data?.error ?? `Simulations list failed: ${res.status}`);
  }
  return data;
}

export async function getSimulationById(
  id: string
): Promise<SimulationDetailResponse> {
  const res = await fetch(`/api/simulations/${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as SimulationDetailResponse & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data?.error ?? `Simulation fetch failed: ${res.status}`);
  }
  return data;
}

/** Delete a simulation and its enqueued markets. Owner only. */
export async function deleteSimulation(id: string): Promise<void> {
  const res = await fetch(`/api/simulations/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data?.error ?? `Delete failed: ${res.status}`);
  }
}
