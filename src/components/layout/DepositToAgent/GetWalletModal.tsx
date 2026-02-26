"use client";

import { useState, useCallback } from "react";
import { createAgentWallet } from "@/lib/api/agents";
import type { Agent } from "@/types/agent.types";

export interface GetWalletModalProps {
  agent: Agent;
  onClose: () => void;
  onSuccess: (updated: Agent) => void;
}

export function GetWalletModal({ agent, onClose, onSuccess }: GetWalletModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await createAgentWallet(agent.id);
      onSuccess(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet creation failed");
    } finally {
      setLoading(false);
    }
  }, [agent.id, onClose, onSuccess]);

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="get-wallet-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-surface p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="get-wallet-title" className="mb-2 text-sm font-semibold text-foreground">
          Get wallet
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          This agent has no wallet yet. A new wallet will be created via CRE and
          linked to the agent so you can deposit and the agent can trade.
        </p>
        <p className="mb-3 text-xs font-medium text-foreground">
          Agent: {agent.name || agent.id.slice(0, 8)}
        </p>
        {error != null && (
          <p className="mb-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 rounded-md border border-transparent bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create wallet"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:bg-muted/50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}
