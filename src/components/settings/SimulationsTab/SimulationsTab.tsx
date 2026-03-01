"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSimulationsList, deleteSimulation } from "@/lib/api/simulations";
import type { SimulationListItem } from "@/types/simulation.types";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function SimulationsTab() {
  const [list, setList] = useState<SimulationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchList = useCallback(() => {
    setLoading(true);
    setError(null);
    getSimulationsList()
      .then((data) => setList(data.simulations ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (deletingId != null || !window.confirm("Remove this simulation? This cannot be undone.")) return;
      setDeletingId(id);
      deleteSimulation(id)
        .then(() => fetchList())
        .catch((err) => setError(err instanceof Error ? err.message : "Delete failed"))
        .finally(() => setDeletingId(null));
    },
    [deletingId, fetchList]
  );

  return (
    <section
      className="flex flex-col gap-6 p-4"
      aria-labelledby="simulations-heading"
    >
      <header id="simulations-heading">
        <h2 className="text-lg font-semibold text-foreground">Simulations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Past simulate runs: view markets and status per run. Remove entries when finished or after clearing the DB.
        </p>
      </header>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading simulations…</p>
      )}
      {error != null && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && list.length === 0 && (
        <p className="text-sm text-muted-foreground">No simulations yet.</p>
      )}
      {!loading && !error && list.length > 0 && (
        <ul className="flex flex-col gap-2" role="list">
          {list.map((sim) => (
            <li key={sim.id}>
              <div className="flex items-start gap-2 rounded-xl border border-border bg-surface/60 p-4 transition-colors hover:bg-surface hover:border-primary/30">
                <Link
                  href={`/settings/simulations/${sim.id}`}
                  className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                >
                  <span className="font-medium text-foreground">
                    {sim.agentName ?? "Agent"}
                  </span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formatDate(sim.createdAt)}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {sim.enqueuedCount} market(s) · {sim.status}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, sim.id)}
                  disabled={deletingId != null}
                  className="shrink-0 rounded border border-border bg-surface px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                  aria-label={`Remove simulation ${sim.id}`}
                >
                  {deletingId === sim.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
