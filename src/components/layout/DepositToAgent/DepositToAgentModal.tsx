"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getContract, prepareContractCall } from "thirdweb";
import { useSendTransaction, useActiveWalletChain } from "thirdweb/react";
import { toast } from "sonner";
import { thirdwebClient } from "@/lib/thirdweb/client";
import { getWalletBalances } from "@/lib/balances";
import contractsData from "@/contract/contracts.json";
import { syncAgentBalance } from "@/lib/api/agents";
import { useAppDispatch } from "@/store/hooks";
import { setAgentBalance } from "@/store/slices/agentsSlice";
import type { Agent } from "@/types/agent.types";

const USDC_DECIMALS =
  (contractsData as { conventions?: { usdcDecimals?: number } }).conventions
    ?.usdcDecimals ?? 6;

export interface DepositToAgentModalProps {
  agent: Agent;
  onClose: () => void;
  /** Called after a successful transfer so the parent can refresh agent list/balance. */
  onTransferSuccess?: () => void;
}

function parseAmount(value: string): number {
  const n = Number(value.trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function truncateAddress(addr: string, head = 6, tail = 4): string {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

const BALANCE_REFRESH_MS = 5000;

export function DepositToAgentModal({ agent, onClose, onTransferSuccess }: DepositToAgentModalProps) {
  const dispatch = useAppDispatch();
  const [amountInput, setAmountInput] = useState("100");
  const [balances, setBalances] = useState<{ eth: string; usdc: string } | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const activeChain = useActiveWalletChain();
  const { mutate: sendTransaction, isPending } = useSendTransaction({
    payModal: false,
  });

  const address = agent.walletAddress ?? agent.owner ?? null;
  const hasCompleteWallet = agent.hasCompleteWallet === true;
  const hasAddress = Boolean(address && String(address).trim().length > 0);

  useEffect(() => {
    if (!address) {
      setBalances(null);
      return;
    }
    let cancelled = false;
    const fetchBalances = () => {
      setBalancesLoading(true);
      getWalletBalances(address)
        .then((b) => {
          if (!cancelled) setBalances({ eth: b.eth, usdc: b.usdc });
        })
        .catch(() => {
          if (!cancelled) setBalances({ eth: "—", usdc: "—" });
        })
        .finally(() => {
          if (!cancelled) setBalancesLoading(false);
        });
    };
    fetchBalances();
    const interval = setInterval(fetchBalances, BALANCE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [address]);

  const amount = useMemo(() => parseAmount(amountInput), [amountInput]);


  const handleTransfer = useCallback(() => {
    const toAddress = agent.walletAddress ?? null;
    if (!toAddress || amount <= 0 || thirdwebClient == null) return;
    if (activeChain == null) {
      toast.error("Connect your wallet and switch to the correct network.");
      return;
    }
    const raw = BigInt(Math.floor(amount * 10 ** USDC_DECIMALS));
    if (raw <= BigInt(0)) return;
    const usdcAddress = (contractsData as { contracts?: { usdc?: string } }).contracts?.usdc;
    if (usdcAddress == null) return;
    const contract = getContract({
      client: thirdwebClient,
      chain: activeChain,
      address: usdcAddress,
    });
    const transaction = prepareContractCall({
      contract,
      method: "function transfer(address to, uint256 value)",
      params: [toAddress as `0x${string}`, raw],
    });
    sendTransaction(transaction, {
      onSuccess: async () => {
        toast.success(`Transferred ${amount} USDC to ${agent.name ?? "agent"}`);
        try {
          const res = await syncAgentBalance(agent.id);
          if (res.balance != null) {
            dispatch(setAgentBalance({ agentId: agent.id, balance: res.balance }));
          }
        } catch {
          // Sync failed; onTransferSuccess refetch will still update list
        }
        onTransferSuccess?.();
        onClose();
      },
      onError: (err) => {
        const msg = String(err?.message ?? "Transfer failed");
        const needGas = /insufficient funds for gas|need.*eth|not enough.*eth|gas|execution reverted/i.test(msg);
        const needUsdc = /insufficient|exceeds balance|not enough balance|balance too low/i.test(msg);
        if (needGas) toast.error("Need ETH for network fee.");
        else if (needUsdc) toast.error("Insufficient USDC.");
        else toast.error(msg);
      },
    });
  }, [
    agent.id,
    agent.walletAddress,
    agent.name,
    amount,
    activeChain,
    dispatch,
    onClose,
    onTransferSuccess,
    sendTransaction,
  ]);

  const canTransferUsdc = Boolean(
    hasCompleteWallet && agent.walletAddress && amount > 0 && activeChain != null
  );

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="deposit-to-agent-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-surface p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="deposit-to-agent-title" className="mb-2 text-sm font-semibold text-foreground">
          Deposit to agent
        </h2>
        <p className="mb-3 text-xs text-muted">
          {agent.name || agent.id.slice(0, 8)}
        </p>

        {address ? (
          <>
            <p className="mb-2 text-xs text-muted">
              <span className="font-medium text-foreground">
                {agent.walletAddress ? "Agent wallet:" : "Owner address (no agent wallet yet):"}
              </span>{" "}
              <span className="font-mono" title={address}>
                {truncateAddress(address)}
              </span>
            </p>
            {!hasCompleteWallet && agent.walletAddress && (
              <p className="mb-2 text-xs text-muted">
                This agent&apos;s wallet is not ready. Get wallet for this agent first to enable deposits.
              </p>
            )}
            <p className="mb-3 text-xs text-muted">
              <span className="font-medium text-foreground">
                {agent.walletAddress ? "Agent balance:" : "Balance at this address:"}
              </span>{" "}
              {balancesLoading ? (
                <span className="inline-block h-3.5 w-14 animate-pulse rounded bg-muted align-middle" aria-hidden />
              ) : balances ? (
                `USDC ${balances.usdc}`
              ) : (
                "—"
              )}
            </p>
          </>
        ) : (
          <p className="mb-3 text-sm text-muted">
            No address available. Set up agent wallet to enable deposits.
          </p>
        )}

        {hasAddress && (
          <>
            {address && !agent.walletAddress && (
              <p className="mb-2 text-xs text-muted">
                Transfers are disabled until this agent has its own wallet. The address above is your connected owner&apos;s address.
              </p>
            )}

            <p className="mb-2 text-xs font-medium text-foreground">Send USDC</p>
            <label className="mb-1 block text-xs text-muted">Amount (USDC)</label>
            <input
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="mb-2 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Amount in USDC"
            />
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={handleTransfer}
                disabled={isPending || !canTransferUsdc}
                className="flex-1 rounded-md border border-transparent bg-success px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "Sending…" : "Transfer USDC"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:bg-muted/50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {!hasAddress && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:bg-muted/50"
          >
            Close
          </button>
        )}
      </div>
    </section>
  );
}
