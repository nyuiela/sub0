"use client";

import { useEffect, useState } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb/client";
import { getConnectTheme } from "@/lib/thirdweb/connect-theme";
import { useAppSelector } from "@/store/hooks";
import { getClaimInfo, submitClaim, type ClaimInfo } from "@/lib/api/sdk-claim";

const CLAIM_MESSAGE_PREFIX = "Claim Sub0 agent:";

function buildClaimMessage(claimCode: string): string {
  return `${CLAIM_MESSAGE_PREFIX} ${claimCode}\nTimestamp: ${new Date().toISOString()}`;
}

export interface ClaimFlowProps {
  claimCode: string;
}

export function ClaimFlow({ claimCode }: ClaimFlowProps) {
  const account = useActiveAccount();
  const themeId = useAppSelector((state) => state.theme.themeId);
  const [info, setInfo] = useState<ClaimInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState<{ agent_id: string; user_id: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setError(null);
    });
    getClaimInfo(claimCode)
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load claim");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [claimCode]);

  const handleClaim = async () => {
    if (!account || !claimCode || claiming) return;
    setError(null);
    setClaiming(true);
    const message = buildClaimMessage(claimCode);
    try {
      const signature = await account.signMessage({ message });
      const result = await submitClaim(claimCode, {
        address: account.address,
        signature,
        message,
      });
      if (result.success && result.agent_id && result.user_id) {
        setClaimed({ agent_id: result.agent_id, user_id: result.user_id });
      } else {
        setError("Claim did not succeed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 px-4 py-12" aria-label="Loading claim">
        <p className="text-muted">Loading...</p>
      </section>
    );
  }

  if (error && !info) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 px-4 py-12" aria-label="Claim error">
        <p className="text-center text-danger" role="alert">{error}</p>
      </section>
    );
  }

  if (info?.status === "CLAIMED") {
    return (
      <section className="flex flex-col items-center justify-center gap-4 px-4 py-12" aria-label="Already claimed">
        <h2 className="text-xl font-semibold text-foreground">Already claimed</h2>
        <p className="text-muted">This agent has already been linked to a wallet.</p>
      </section>
    );
  }

  if (claimed) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 px-4 py-12" aria-label="Claim success">
        <h2 className="text-xl font-semibold text-foreground">Claim successful</h2>
        <p className="text-muted">This agent is now linked to your wallet. You can use it to trade on Sub0.</p>
      </section>
    );
  }

  const connectTheme = getConnectTheme(themeId);

  return (
    <section
      className="flex flex-col items-center justify-center gap-8 px-4 py-12"
      aria-label="Claim agent"
    >
      <header className="text-center">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Link your wallet to this agent</h2>
        <p className="mt-2 text-sm text-muted">
          Sign with your wallet to bind this agent to your account. After that, the agent can trade on your behalf.
        </p>
        {info?.agent_name && (
          <p className="mt-1 text-sm text-foreground">Agent: {info.agent_name}</p>
        )}
      </header>

      <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-surface px-8 py-10 shadow-sm">
        {!thirdwebClient ? (
          <p className="text-sm text-muted">Wallet connect is not configured.</p>
        ) : !account ? (
          <ConnectButton
            client={thirdwebClient}
            theme={connectTheme}
            connectButton={{ label: "Connect wallet" }}
          />
        ) : (
          <>
            <p className="text-sm text-muted">Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}</p>
            <button
              type="button"
              onClick={handleClaim}
              disabled={claiming}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {claiming ? "Claiming..." : "Sign and claim"}
            </button>
          </>
        )}
        {error && (
          <p className="text-center text-sm text-danger" role="alert">{error}</p>
        )}
      </div>
    </section>
  );
}
