"use client";

import { useCallback, useEffect, useState } from "react";
import { getAgent, getAgentTracks, getAgentReasoning } from "@/lib/api/agents";
import type { Agent, AgentTrack, AgentReasoning } from "@/types/agent.types";
import { VitalsHeader } from "./VitalsHeader";
import { PerformanceChart } from "./PerformanceChart";
import { ReasoningFeed } from "./ReasoningFeed";
import { AgentSettingsForm } from "./AgentSettingsForm";
import { StatusStrip } from "./StatusStrip";

export interface AgentDashboardProps {
  agentId: string;
  className?: string;
}

const TRACKS_LIMIT = 365;
const REASONING_LIMIT = 50;

export function AgentDashboard({ agentId, className = "" }: AgentDashboardProps) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [tracks, setTracks] = useState<AgentTrack[]>([]);
  const [reasoning, setReasoning] = useState<AgentReasoning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasoningLoading, setReasoningLoading] = useState(false);
  const [combinedTab, setCombinedTab] = useState<"reasoning" | "console">("reasoning");

  const loadAgent = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    try {
      const [agentRes, tracksRes] = await Promise.all([
        getAgent(agentId),
        getAgentTracks(agentId, { limit: TRACKS_LIMIT }),
      ]);
      setAgent(agentRes);
      setTracks(tracksRes.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load agent");
      setAgent(null);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const loadReasoning = useCallback(async () => {
    if (!agentId) return;
    setReasoningLoading(true);
    try {
      const res = await getAgentReasoning(agentId, {
        limit: REASONING_LIMIT,
        offset: 0,
      });
      setReasoning(res.data ?? []);
    } catch {
      setReasoning([]);
    } finally {
      setReasoningLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    loadAgent();
  }, [loadAgent]);

  useEffect(() => {
    if (agent != null) loadReasoning();
  }, [agent != null, loadReasoning]);

  const handleAgentUpdate = useCallback((updated: Agent) => {
    setAgent(updated);
  }, []);

  if (loading && agent == null) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 p-6 ${className}`.trim()}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted">Loading agent…</p>
      </div>
    );
  }

  if (error != null && agent == null) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 p-6 ${className}`.trim()}
      >
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
        <p className="text-xs text-muted">You may not have access to this agent.</p>
      </div>
    );
  }

  if (agent == null) return null;

  const sparklineTracks = tracks.slice(-7);

  return (
    <main
      className={`flex flex-col gap-4 overflow-auto ${className}`.trim()}
      aria-label="Agent dashboard"
    >
      <StatusStrip agent={agent} onUpdate={handleAgentUpdate} />
      <VitalsHeader agent={agent} sparklineData={sparklineTracks} />
      <PerformanceChart tracks={tracks} />
      <section
        className="flex min-h-0 flex-1 flex-col gap-2"
        aria-label="Reasoning and console"
      >
        <nav
          role="tablist"
          aria-label="Reasoning and console sections"
          className="flex border-b border-border"
        >
          {(
            [
              ["reasoning", "Reasoning & Logs"],
              ["console", "Console"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={combinedTab === key}
              onClick={() => setCombinedTab(key)}
              className={`min-w-[100px] border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                combinedTab === key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="min-h-[200px] flex-1 overflow-auto">
          {combinedTab === "reasoning" && (
            <ReasoningFeed
              items={reasoning}
              loading={reasoningLoading}
              className="min-h-[200px]"
            />
          )}
          {combinedTab === "console" && (
            <AgentSettingsForm
              agent={agent}
              onUpdate={handleAgentUpdate}
              className="min-h-[200px]"
            />
          )}
        </div>
      </section>
    </main>
  );
}
