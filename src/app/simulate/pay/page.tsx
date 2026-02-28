"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { baseSepolia } from "thirdweb/chains";
import { useAppSelector } from "@/store/hooks";
import { startSimulation } from "@/lib/api/simulate";
import {
  getPaymentFetchFromThirdwebAccount,
  ensurePaymentChain,
  getPaymentChainName,
} from "@/lib/x402/paymentFetch";
import {
  SIMULATE_PAYMENT_MESSAGE_TYPE_SUCCESS,
  SIMULATE_PAYMENT_MESSAGE_TYPE_ERROR,
  type SimulatePaymentSuccessPayload,
  type SimulatePaymentErrorPayload,
} from "@/lib/x402/simulatePayMessages";
import { thirdwebClient } from "@/lib/thirdweb/client";
import { getConnectTheme } from "@/lib/thirdweb/connect-theme";

type PayStatus = "loading" | "switching" | "paying" | "success" | "error";

function useSimulatePayParams() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId") ?? "";
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";
  const maxMarkets = parseInt(searchParams.get("maxMarkets") ?? "100", 10) || 100;
  const durationMinutes = parseInt(searchParams.get("durationMinutes") ?? "60", 10) || 60;
  const paymentChainId = parseInt(searchParams.get("paymentChainId") ?? "84532", 10) || 84532;
  return {
    agentId,
    start: `${start}T00:00:00.000Z`,
    end: `${end}T23:59:59.999Z`,
    maxMarkets: Math.min(500, Math.max(1, maxMarkets)),
    durationMinutes: Math.max(1, durationMinutes),
    paymentChainId,
  };
}

function sendToOpener(payload: SimulatePaymentSuccessPayload | SimulatePaymentErrorPayload): void {
  if (typeof window === "undefined" || !window.opener) return;
  window.opener.postMessage(payload, window.location.origin);
}

export default function SimulatePayPage() {
  const params = useSimulatePayParams();
  const account = useActiveAccount();
  const themeId = useAppSelector((state) => state.theme.themeId);
  const [status, setStatus] = useState<PayStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const ranRef = useRef(false);

  const runPayment = useCallback(
    async (activeAccount: NonNullable<typeof account>) => {
      const { agentId, start, end, maxMarkets, durationMinutes, paymentChainId } =
        params;
      const missing = !agentId || start.startsWith("T") || end.startsWith("T");
      if (missing) {
        setStatus("error");
        setErrorMessage("Missing agent, start, or end date.");
        sendToOpener({
          type: SIMULATE_PAYMENT_MESSAGE_TYPE_ERROR,
          error: "Missing parameters",
        });
        return;
      }

      setStatus("switching");
      const switched = await ensurePaymentChain(paymentChainId);
      if (!switched) {
        const chainName = getPaymentChainName(paymentChainId);
        const msg = `Switch to ${chainName} in your wallet to pay.`;
        setStatus("error");
        setErrorMessage(msg);
        sendToOpener({ type: SIMULATE_PAYMENT_MESSAGE_TYPE_ERROR, error: msg });
        return;
      }

      const paymentFetch = await getPaymentFetchFromThirdwebAccount(
        activeAccount,
        paymentChainId
      );
      if (!paymentFetch) {
        const msg = "Payment setup failed. Try connecting your wallet again.";
        setStatus("error");
        setErrorMessage(msg);
        sendToOpener({ type: SIMULATE_PAYMENT_MESSAGE_TYPE_ERROR, error: msg });
        return;
      }

      setStatus("paying");
      try {
        const res = await startSimulation(
          {
            agentId,
            dateRange: { start, end },
            maxMarkets,
            durationMinutes,
          },
          { fetch: paymentFetch }
        );
        setStatus("success");
        sendToOpener({
          type: SIMULATE_PAYMENT_MESSAGE_TYPE_SUCCESS,
          enqueued: res.enqueued,
          jobIds: res.jobIds ?? [],
          durationMinutes: params.durationMinutes,
        });
        setTimeout(() => window.close(), 1500);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Payment failed";
        setStatus("error");
        setErrorMessage(msg);
        sendToOpener({ type: SIMULATE_PAYMENT_MESSAGE_TYPE_ERROR, error: msg });
      }
    },
    [params]
  );

  useEffect(() => {
    if (!account || ranRef.current) return;
    ranRef.current = true;
    void runPayment(account);
  }, [account, runPayment]);

  if (!thirdwebClient) {
    return (
      <main className="min-h-screen bg-background p-6 text-foreground">
        <h1 className="mb-4 text-lg font-semibold">Simulation payment</h1>
        <p className="text-sm text-muted-foreground">
          Set NEXT_PUBLIC_THIRDWEB_CLIENT_ID to enable wallet connection in this
          window.
        </p>
      </main>
    );
  }

  if (!account) {
    return (
      <main className="min-h-screen bg-background p-6 text-foreground">
        <h1 className="mb-4 text-lg font-semibold">Simulation payment</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Connect your wallet in this window to pay for the simulation. Use the
          button below to connect.
        </p>
        <section
          className="flex flex-col items-start gap-4"
          aria-label="Connect wallet to pay"
        >
          <ConnectButton
            client={thirdwebClient}
            theme={getConnectTheme(themeId)}
            chain={baseSepolia}
            connectButton={{
              label: "Connect wallet",
              className:
                "rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            }}
            connectModal={{
              title: "Connect wallet",
              size: "compact",
              showThirdwebBranding: false,
            }}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <h1 className="mb-4 text-lg font-semibold">Simulation payment</h1>
      <p className="mb-2 text-sm text-muted-foreground">
        Complete payment in this window. You can switch network in your wallet
        here.
      </p>
      {status === "loading" && (
        <p className="text-sm text-muted-foreground">Preparing payment...</p>
      )}
      {status === "switching" && (
        <p className="text-sm text-muted-foreground">Checking network...</p>
      )}
      {status === "paying" && (
        <p className="text-sm text-muted-foreground">
          Confirm payment in your wallet...
        </p>
      )}
      {status === "success" && (
        <p className="text-sm text-success">
          Payment complete. This window will close.
        </p>
      )}
      {status === "error" && (
        <section>
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => window.close()}
            className="mt-3 rounded border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground"
          >
            Close
          </button>
        </section>
      )}
    </main>
  );
}
