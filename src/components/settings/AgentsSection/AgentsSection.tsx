"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getMyAgents } from "@/lib/api/agents";
import type { Agent } from "@/types/agent.types";

const rowBase =
  "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-primary/40";

export interface AgentsSectionProps {
  onSelectAgent: (agentId: string) => void;
}

export function AgentsSection({ onSelectAgent }: AgentsSectionProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(() => {
    setLoading(true);
    setError(null);
    getMyAgents({ limit: 50 })
      .then((res) => {
        setAgents(res.data ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load agents");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && error != null) {
        fetchAgents();
      }
    };
    const handleFocus = () => {
      if (error != null) fetchAgents();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [error, fetchAgents]);

  return (
    <section
      className="flex flex-1 flex-col gap-6 overflow-auto px-4 py-6"
      aria-label="Agents settings content"
    >
      {loading && (
        <p className="text-sm text-muted">Loading your agents…</p>
      )}
      {error && (
        <div className="flex flex-col gap-3" role="alert">
          <p className="text-sm text-danger">{error}</p>
          <button
            type="button"
            onClick={() => fetchAgents()}
            className="w-fit rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </div>
      )}
      {!loading && !error && agents.length === 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            You have not created or linked any agents yet. Complete registration to create your first agent.
          </p>
          <Link
            href="/register"
            className="w-fit rounded-md border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Go to registration
          </Link>
        </div>
      )}
      {!loading && agents.length > 0 && (
        <ul className="flex flex-col gap-2" role="list">
          {agents.map((agent) => (
            <li key={agent.id}>
              <article className={rowBase}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {agent.name}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {agent.status}
                    {agent.template?.name != null && (
                      <span> · {agent.template.name}</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectAgent(agent.id)}
                  className="shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary-muted hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={`Manage ${agent.name}`}
                >
                  Manage
                </button>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
