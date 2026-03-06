"use client";

import { useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { useAuth } from "@/contexts/AuthContext";
import { PositionsColumn } from "@/components/layout/PositionsColumn/PositionsColumn";
import { getMyAgents } from "@/lib/api/agents";
import type { Agent } from "@/types/agent.types";

interface EnhancedTradeTabProps {
  isActive?: boolean;
}

export function EnhancedTradeTab({ isActive = false }: EnhancedTradeTabProps) {
  const [showUserPositions, setShowUserPositions] = useState(true);
  const [showAgentPositions, setShowAgentPositions] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  
  const { user: currentUser } = useAuth();

  // Load agents for selection
  const loadAgents = async () => {
    try {
      const agentList = await getMyAgents();
      setAgents(agentList.data);
      if (agentList.data.length > 0 && !selectedAgentId) {
        setSelectedAgentId(agentList.data[0].id);
      }
    } catch (error) {
      console.error("Failed to load agents:", error);
    }
  };

  // Load agents only when logged in and agent positions visible
  if (showAgentPositions && agents.length === 0 && currentUser != null) {
    loadAgents();
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-auto scrollbar-hidden">
      {/* Header with controls */}
      <div className="flex flex-col gap-3 shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Trading Activity</h2>
        
        {/* Toggle controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowUserPositions(!showUserPositions)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              showUserPositions
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
            }`}
          >
            User Positions {showUserPositions ? "✓" : ""}
          </button>
          
          <button
            onClick={() => {
              setShowAgentPositions(!showAgentPositions);
              if (!showAgentPositions && agents.length === 0 && currentUser != null) {
                loadAgents();
              }
            }}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              showAgentPositions
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
            }`}
          >
            Agent Positions {showAgentPositions ? "✓" : ""}
          </button>
        </div>

        {/* Agent selector */}
        {showAgentPositions && agents.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="agent-select" className="text-sm font-medium text-foreground">
              Agent:
            </label>
            <select
              id="agent-select"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="px-2 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Positions sections */}
      <div className="space-y-6 flex-1 overflow-auto scrollbar-hidden">
        {/* User Positions */}
        {showUserPositions && currentUser && (
          <section>
            <h3 className="text-md font-medium text-foreground mb-3">Your Positions</h3>
            <PositionsColumn
              userId={currentUser?.userId}
              className="bg-card rounded-lg border border-border"
            />
          </section>
        )}

        {/* Agent Positions */}
        {showAgentPositions && selectedAgentId && (
          <section>
            <h3 className="text-md font-medium text-foreground mb-3">
              Agent Positions - {agents.find(a => a.id === selectedAgentId)?.name}
            </h3>
            <PositionsColumn
              agentId={selectedAgentId}
              className="bg-card rounded-lg border border-border"
            />
          </section>
        )}

        {/* Empty states */}
        {showUserPositions && !currentUser && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Please connect your wallet to see your positions</p>
          </div>
        )}

        {showAgentPositions && agents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No agents found. Create an agent to see agent positions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
