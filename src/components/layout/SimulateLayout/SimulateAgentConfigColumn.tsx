"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setByMarketFromAgents } from "@/store/slices/marketAgentsSlice";
import { getMyAgents } from "@/lib/api/agents";
import { toast } from "sonner";
import {
  getSimulateConfig,
  getSimulateBalance,
  getSimulateEligibility,
  requestSimulateFund,
} from "@/lib/api/simulate";
import { getBlockExplorerBaseUrl, getBlockExplorerTxUrl } from "@/lib/blockExplorer";
import { SimulateConfigEditor } from "./SimulateConfigEditor";
import type { Agent } from "@/types/agent.types";

export interface SimulateAgentConfigColumnProps {
  selectedAgentId: string | null;
  onSelectAgent: (agent: Agent | null) => void;
  className?: string;
}

const AGENTS_LIMIT = 50;
const ETH_DECIMALS = 18;
const USDC_DECIMALS = 6;

function formatNative(weiStr: string): string {
  const wei = BigInt(weiStr);
  const div = BigInt(10 ** ETH_DECIMALS);
  const whole = wei / div;
  const frac = wei % div;
  const fracStr = frac.toString().padStart(ETH_DECIMALS, "0").slice(0, 4);
  return `${whole}.${fracStr}`;
}

function formatUsdc(unitsStr: string): string {
  const units = BigInt(unitsStr);
  const div = BigInt(10 ** USDC_DECIMALS);
  const whole = units / div;
  const frac = units % div;
  const fracStr = frac.toString().padStart(USDC_DECIMALS, "0").slice(0, 2);
  return `${whole}.${fracStr}`;
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const MS_PER_DAY = 86400000;
const MS_PER_HOUR = 3600000;
const MS_PER_MINUTE = 60000;
const MS_PER_SECOND = 1000;

function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return "";
  const d = Math.floor(remainingMs / MS_PER_DAY);
  const h = Math.floor((remainingMs % MS_PER_DAY) / MS_PER_HOUR);
  const m = Math.floor((remainingMs % MS_PER_HOUR) / MS_PER_MINUTE);
  const s = Math.floor((remainingMs % MS_PER_MINUTE) / MS_PER_SECOND);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

export function SimulateAgentConfigColumn({
  selectedAgentId,
  onSelectAgent,
  className = "",
}: SimulateAgentConfigColumnProps) {
  const dispatch = useAppDispatch();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<{
    nativeWei: string;
    usdcUnits: string;
  } | null>(null);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    firstTime: boolean;
    nextRequestAt?: number;
    reason?: string;
  } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [funding, setFunding] = useState(false);
  const [countdownLabel, setCountdownLabel] = useState<string | null>(null);
  const [simulateConfig, setSimulateConfig] = useState<{
    configured: boolean;
    name?: string;
    blockExplorerUrl?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSimulateConfig()
      .then((c) => {
        if (!cancelled && c.configured)
          setSimulateConfig({
            configured: true,
            name: c.name,
            blockExplorerUrl: c.blockExplorerUrl,
          });
        else if (!cancelled) setSimulateConfig({ configured: false });
      })
      .catch(() => {
        if (!cancelled) setSimulateConfig({ configured: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasAutoSelectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getMyAgents({ limit: AGENTS_LIMIT })
      .then((res) => {
        if (!cancelled) {
          const list = res.data ?? [];
          setAgents(list);
          dispatch(setByMarketFromAgents({ agents: list }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Sign in to see your agents.");
          setAgents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (agents.length > 0 && selectedAgentId == null && !hasAutoSelectedRef.current) {
      hasAutoSelectedRef.current = true;
      onSelectAgent(agents[0] ?? null);
    }
  }, [agents, selectedAgentId, onSelectAgent]);

  useEffect(() => {
    if (!selectedAgentId?.trim()) {
      setBalance(null);
      setEligibility(null);
      return;
    }
    let cancelled = false;
    setBalanceLoading(true);
    setBalance(null);
    setEligibility(null);
    Promise.all([
      getSimulateBalance(selectedAgentId),
      getSimulateEligibility(selectedAgentId),
    ])
      .then(([bal, elig]) => {
        if (!cancelled) {
          setBalance({
            nativeWei: bal.nativeWei ?? "0",
            usdcUnits: bal.usdcUnits ?? "0",
          });
          setEligibility({
            eligible: elig.eligible,
            firstTime: elig.firstTime,
            nextRequestAt: elig.nextRequestAt,
            reason: elig.reason,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBalance(null);
          setEligibility(null);
        }
      })
      .finally(() => {
        if (!cancelled) setBalanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedAgentId]);

  useEffect(() => {
    const next = eligibility?.nextRequestAt;
    const inCooldown =
      eligibility != null &&
      !eligibility.eligible &&
      typeof next === "number" &&
      next > 0 &&
      selectedAgentId != null;
    if (!inCooldown) {
      setCountdownLabel(null);
      return;
    }
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      const remaining = Math.max(0, (next as number) - Date.now());
      if (remaining <= 0) {
        setCountdownLabel(null);
        if (intervalId != null) clearInterval(intervalId);
        getSimulateEligibility(selectedAgentId!)
          .then((elig) => {
            setEligibility({
              eligible: elig.eligible,
              firstTime: elig.firstTime,
              nextRequestAt: elig.nextRequestAt,
              reason: elig.reason,
            });
          })
          .catch(() => {});
        return;
      }
      setCountdownLabel(`Refill in ${formatCountdown(remaining)}`);
    };
    tick();
    intervalId = setInterval(tick, 1000);
    return () => {
      if (intervalId != null) clearInterval(intervalId);
    };
  }, [eligibility?.nextRequestAt, eligibility?.eligible, selectedAgentId]);

  const handleRequestFund = useCallback(() => {
    if (!selectedAgentId || funding) return;
    setFunding(true);
    requestSimulateFund(selectedAgentId)
      .then((fundRes) => {
        const baseUrl = simulateConfig?.blockExplorerUrl;
        if (fundRes.nativeTxHash && getBlockExplorerTxUrl(baseUrl, fundRes.nativeTxHash)) {
          toast.success("Funded", {
            description: (
              <a
                href={getBlockExplorerTxUrl(baseUrl, fundRes.nativeTxHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                View ETH tx
              </a>
            ),
          });
        } else if (fundRes.usdcTxHash && getBlockExplorerTxUrl(baseUrl, fundRes.usdcTxHash)) {
          toast.success("Funded", {
            description: (
              <a
                href={getBlockExplorerTxUrl(baseUrl, fundRes.usdcTxHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                View USDC tx
              </a>
            ),
          });
        }
        return getSimulateBalance(selectedAgentId);
      })
      .then((bal) => {
        setBalance({
          nativeWei: bal.nativeWei ?? "0",
          usdcUnits: bal.usdcUnits ?? "0",
        });
        return getSimulateEligibility(selectedAgentId);
      })
      .then((elig) => {
        setEligibility({
          eligible: elig.eligible,
          firstTime: elig.firstTime,
          nextRequestAt: elig.nextRequestAt,
          reason: elig.reason,
        });
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Funding failed";
        setEligibility((prev) => ({
          ...(prev ?? { eligible: false, firstTime: false }),
          reason: msg,
        }));
      })
      .finally(() => setFunding(false));
  }, [selectedAgentId, funding, simulateConfig?.blockExplorerUrl]);

  const selectedAgent =
    selectedAgentId != null
      ? agents.find((a) => a.id === selectedAgentId) ?? null
      : null;

  if (error != null) {
    return (
      <aside
        className={`flex flex-col gap-2 p-2 ${className}`.trim()}
        aria-label="Agent configuration for simulate"
      >
        <p className="text-sm text-muted-foreground">{error}</p>
      </aside>
    );
  }

  return (
    <aside
      className={`scrollbar-hidden flex flex-col gap-4 overflow-auto ${className}`.trim()}
      aria-label="Agent configuration for simulate"
    >
      <section aria-labelledby="simulate-agent-heading">
        <h2
          id="simulate-agent-heading"
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
        >
          Select agent
        </h2>
        {loading && agents.length === 0 ? (
          <ul className="space-y-1">
            {[1, 2, 3].map((i) => (
              <li
                key={i}
                className="h-10 animate-pulse rounded bg-surface"
                aria-hidden
              />
            ))}
          </ul>
        ) : agents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No agents yet.</p>
        ) : (
          <ul className="space-y-1" role="listbox" aria-label="Agents">
            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              return (
                <li key={agent.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-surface text-muted-foreground hover:bg-muted/50"
                    }`}
                    onClick={() =>
                      onSelectAgent(isSelected ? null : agent)
                    }
                  >
                    {agent.name}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selectedAgent != null && (
        <section aria-labelledby="simulate-wallet-heading">
          <h2
            id="simulate-wallet-heading"
            className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Simulate wallet
          </h2>
          {selectedAgent.walletAddress ? (
            <article className="rounded-lg border border-border bg-surface p-3">
              {simulateConfig?.configured && simulateConfig.name && (
                <p className="mb-1 text-xs text-muted-foreground">
                  Network: {simulateConfig.name}
                  {getBlockExplorerBaseUrl(simulateConfig.blockExplorerUrl) && (
                    <>
                      {" "}
                      <a
                        href={getBlockExplorerBaseUrl(simulateConfig.blockExplorerUrl)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Explorer
                      </a>
                    </>
                  )}
                </p>
              )}
              <p className="mb-2 text-xs text-muted-foreground">
                {truncateAddress(selectedAgent.walletAddress)}
              </p>
              {balanceLoading && balance == null ? (
                <p className="text-sm text-muted-foreground">Loading balance...</p>
              ) : balance != null ? (
                <ul className="space-y-1 text-sm">
                  <li>
                    <span className="text-muted-foreground">ETH: </span>
                    <span className="font-mono">{formatNative(balance.nativeWei)}</span>
                  </li>
                  <li>
                    <span className="text-muted-foreground">USDC: </span>
                    <span className="font-mono">{formatUsdc(balance.usdcUnits)}</span>
                  </li>
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Simulate chain not configured or balance unavailable.
                </p>
              )}
              <footer className="mt-3">
                <button
                  type="button"
                  disabled={
                    funding ||
                    (eligibility != null && !eligibility.eligible) ||
                    balanceLoading
                  }
                  className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  onClick={handleRequestFund}
                >
                  {funding
                    ? "Refilling..."
                    : countdownLabel ?? "Request funding"}
                </button>
                {eligibility != null && !eligibility.eligible && eligibility.reason && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {eligibility.reason}
                  </p>
                )}
              </footer>
            </article>
          ) : (
            <p className="text-sm text-muted-foreground">
              Create a wallet for this agent first (Settings or Tracker).
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="simulate-config-heading">
        <h2
          id="simulate-config-heading"
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
        >
          Config
        </h2>
        {selectedAgent != null ? (
          <SimulateConfigEditor
            agent={selectedAgent}
            onAgentUpdated={(updated) => {
              setAgents((prev) =>
                prev.map((a) => (a.id === updated.id ? updated : a))
              );
            }}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Select an agent to see config.
          </p>
        )}
      </section>
    </aside>
  );
}
