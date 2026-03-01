"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSimulationById } from "@/lib/api/simulations";
import type { SimulationDetailResponse } from "@/types/simulation.types";

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

export default function SimulationDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [data, setData] = useState<SimulationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getSimulationById(id)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!id) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-auto bg-background p-4">
        <p className="text-sm text-muted-foreground">Missing simulation id.</p>
        <Link
          href="/settings"
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Back to Settings
        </Link>
      </main>
    );
  }

  return (
    <main
      className="flex min-h-0 flex-1 flex-col overflow-auto bg-background"
      aria-label="Simulation detail"
    >
      <header className="shrink-0 border-b border-border/50 bg-surface/80 px-4 py-4 backdrop-blur-md">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <img
            src="/icons/chevron-left.svg"
            width={20}
            height={20}
            alt=""
            aria-hidden
          />
          Back to Settings
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-foreground">
          Simulation
        </h1>
      </header>

      <section className="flex flex-1 flex-col gap-6 p-4" aria-label="Details">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading simulation…</p>
        )}
        {error != null && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && data != null && (
          <>
            <section aria-labelledby="sim-meta-heading">
              <h2 id="sim-meta-heading" className="sr-only">
                Simulation metadata
              </h2>
              <ul className="flex flex-col gap-2 text-sm" role="list">
                <li>
                  <span className="text-muted-foreground">Agent:</span>{" "}
                  <span className="text-foreground">{data.agentName ?? "—"}</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Date range:</span>{" "}
                  <span className="text-foreground">
                    {formatDate(data.dateRangeStart)} – {formatDate(data.dateRangeEnd)}
                  </span>
                </li>
                <li>
                  <span className="text-muted-foreground">Created:</span>{" "}
                  <span className="text-foreground">
                    {formatDate(data.createdAt)}
                  </span>
                </li>
                <li>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span className="text-foreground">{data.status}</span>
                </li>
                {data.maxMarkets != null && (
                  <li>
                    <span className="text-muted-foreground">Max markets:</span>{" "}
                    <span className="text-foreground">{data.maxMarkets}</span>
                  </li>
                )}
                {data.durationMinutes != null && (
                  <li>
                    <span className="text-muted-foreground">Duration (min):</span>{" "}
                    <span className="text-foreground">{data.durationMinutes}</span>
                  </li>
                )}
              </ul>
            </section>

            <section aria-labelledby="markets-heading">
              <h2
                id="markets-heading"
                className="text-base font-semibold text-foreground"
              >
                Markets ({data.markets?.length ?? 0})
              </h2>
              {data.markets?.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No markets in this simulation.
                </p>
              ) : (
                <ul
                  className="mt-3 flex flex-col gap-2"
                  role="list"
                  aria-label="Markets traded"
                >
                  {data.markets?.map((m) => (
                    <li
                      key={m.marketId}
                      className="rounded-xl border border-border bg-surface/60 p-4"
                    >
                      <span className="font-medium text-foreground">
                        {m.marketName ?? m.marketId}
                      </span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {m.marketStatus ?? "—"} · {m.status}
                      </span>
                      {m.discardReason != null && m.discardReason !== "" && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {m.discardReason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
