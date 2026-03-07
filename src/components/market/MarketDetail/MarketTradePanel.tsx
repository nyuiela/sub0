"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  submitOrder,
  clearMarketsError,
  clearOrderSuccess,
  selectOrderBookByMarketId,
} from "@/store/slices/marketsSlice";
import { formatOutcomePrice, formatCollateral, USDC_DECIMALS } from "@/lib/formatNumbers";

import {
  buildUserTradeTypedData,
  serializeTypedDataForSigning,
  signUserTradeTypedData,
  recoverUserTradeSigner,
  defaultDeadline,
  type EIP1193Provider,
} from "@/lib/userTradeSignature";
import { toast } from "sonner";
import { Loader2, Clock, ExternalLink } from "lucide-react";
import type { MarketPricesResponse } from "@/types/prices.types";
import { getBlockExplorerTxUrl } from "@/lib/blockExplorer";
import { Position } from "@/types/position.types";
import { getMarketPrices } from "@/lib/api/prices";

// Simple LMSR calculation: cost = b * log(sum(exp(q_i/b)))
function calculateLmsrCost(
  quantities: number[],
  b: number = 1000000 // Default liquidity parameter
): number {
  const sum = quantities.reduce((acc, q) => acc + Math.exp(q / b), 0);
  return b * Math.log(sum);
}

const SUCCESS_AUTO_DISMISS_MS = 5000;
const FLASH_NOTIONALS = [50, 100] as const;
const FLASH_PERCENTS = [25, 50, 100] as const;

// #region agent log
/*
function debugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  const payload = {
    sessionId: "44a402",
    runId: "signature-debug",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  fetch("http://127.0.0.1:7916/ingest/6bd2cfb3-987f-41c0-b780-8a7f894a6c2e", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "44a402" },
    body: JSON.stringify(payload),
  }).catch(() => { });
}
*/
// #endregion

function formatBalance(value: number): string {
  if (value >= 1_000_000) return `${formatCollateral(value / 1_000_000)}M`;
  if (value >= 1_000) return `${formatCollateral(value / 1_000)}K`;
  return formatCollateral(value);
}

export interface MarketTradePanelProps {
  marketId: string;
  /** Bytes32 questionId used for EIP-712 signing (e.g. market.conditionId). Must match backend/contract. */
  questionId: string;
  marketStatus?: string;
  /** Outcome labels for this prediction market, e.g. ["Yes", "No"]. Used for Buy/Sell button labels. */
  outcomes?: unknown[];
  /** LMSR prices; used for reference price and bounds when order book is empty. */
  marketPrices?: MarketPricesResponse | null;
  /** Available balance (e.g. USDC) for display and % flash buttons. When not provided, shows "--". */
  availableBalance?: number;
  positions?: Position[];
  className?: string;
}

function parseOutcomeLabels(outcomes: unknown[]): [string, string] {
  const a = outcomes[0];
  const b = outcomes[1];
  return [
    a != null ? String(a) : "Yes",
    b != null ? String(b) : "No",
  ];
}

function getEthereumProvider(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { ethereum?: EIP1193Provider };
  return w.ethereum ?? null;
}

export function MarketTradePanel({
  marketId,
  questionId,
  marketStatus = "OPEN",
  outcomes: outcomesProp = [],
  marketPrices,
  availableBalance = 0,
  positions = [],
  className = "",
}: MarketTradePanelProps) {
  const account = useActiveAccount();
  const dispatch = useAppDispatch();
  const orderBook = useAppSelector((state) => selectOrderBookByMarketId(state, marketId, 0));
  const { orderSubmitLoading, error, lastOrderSuccess, lastOrderTxHash } = useAppSelector((state) => state.markets);
  const blockExplorerUrl =
    typeof process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL === "string"
      ? process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL
      : undefined;
  const outcomesList = Array.isArray(outcomesProp) ? outcomesProp : [];
  const [yesLabel, noLabel] = parseOutcomeLabels(outcomesList);

  const [amount, setAmount] = useState<number>(0);
  const [price, setPrice] = useState("");
  const [orderType, setOrderType] = useState<"market" | "limit" | "ioc">("market");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [lastPriceUpdate, setLastPriceUpdate] = useState<number>(Date.now());
  const [donSignature, setDonSignature] = useState<string>("");
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [isPriceContainerExpanded, setIsPriceContainerExpanded] = useState(false);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(30);

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    const refreshPrices = async () => {
      if (!marketId) return;

      setIsRefreshingPrices(true);
      try {
        await getMarketPrices(marketId, "1");
        setLastPriceUpdate(Date.now());
        setDonSignature("0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(""));
      } catch (err) {
        console.error("Failed to refresh prices:", err);
      } finally {
        setIsRefreshingPrices(false);
      }
    };

    // Initial refresh
    refreshPrices();

    // Set up interval for 30-second refresh
    const interval = setInterval(refreshPrices, 30000);

    return () => clearInterval(interval);
  }, [marketId]);

  useEffect(() => {
    const updateCountdown = () => {
      const elapsed = Date.now() - lastPriceUpdate;
      const remaining = 30000 - elapsed;
      setTimeUntilRefresh(Math.max(0, Math.floor(remaining / 1000)));
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lastPriceUpdate]);

  // LMSR calculations for profit display
  const currentQuantities = useMemo(() => {
    if (!marketPrices) return [0, 0];

    // Extract quantities from the API response
    const quantities = marketPrices.quantities.map(q => Number(q));
    return quantities;
  }, [marketPrices]);

  const currentPrices = useMemo(() => {
    if (!marketPrices) return { yes: 0, no: 0 };

    const prices = marketPrices.prices.map(p => Number(p) / 10 ** 6); // Convert from 6 decimals
    return {
      yes: prices[0] || 0,
      no: prices[1] || 0,
    };
  }, [marketPrices]);

  // Calculate cost for user-specified amount
  const calculatedCost = useMemo(() => {
    const userAmount = amount * 10 ** 6; // Convert to 6 decimals
    if (userAmount <= 0 || !marketPrices) return null;

    // For simplicity, assume buying Yes (outcome 0)
    const selectedOutcome = 0;
    const newQuantities = [...currentQuantities];
    newQuantities[selectedOutcome] += userAmount;

    const currentCost = calculateLmsrCost(currentQuantities);
    const newCost = calculateLmsrCost(newQuantities);

    return newCost - currentCost;
  }, [amount, currentQuantities, marketPrices]);

  // Calculate potential profit
  const potentialProfit = useMemo(() => {
    if (!calculatedCost || !marketPrices) return null;

    const userAmount = amount;
    const costUsdc = calculatedCost / 10 ** 6; // Convert to USDC

    // If this outcome resolves true, profit = (amount - cost)
    // If this outcome resolves false, profit = -cost
    const profitIfTrue = userAmount - costUsdc;
    const profitIfFalse = -costUsdc;

    return {
      ifTrue: profitIfTrue,
      ifFalse: profitIfFalse,
      maxGain: profitIfTrue,
      maxLoss: Math.abs(profitIfFalse),
    };
  }, [calculatedCost, amount, marketPrices]);

  const canTrade = marketStatus === "OPEN" && !!account?.address;
  const needsPrice = orderType === "limit" || orderType === "ioc";
  const hasBalance = availableBalance > 0;
  const bestAsk = orderBook?.asks?.[0]?.price;
  const bestBid = orderBook?.bids?.[0]?.price;
  const priceFromApi = marketPrices?.options?.[0]?.instantPrice;
  const referencePrice = bestAsk ?? bestBid ?? priceFromApi ?? "1";
  const bidNum = bestBid != null ? Number(bestBid) : NaN;
  const askNum = bestAsk != null ? Number(bestAsk) : NaN;
  const outcomePriceNums = (marketPrices?.options ?? [])
    .map((o) => Number(o.instantPrice))
    .filter((n) => Number.isFinite(n));
  let priceMin = 0.01;
  let priceMax = 0.99;
  if (Number.isFinite(bidNum) && Number.isFinite(askNum)) {
    priceMin = Math.max(0.001, bidNum * 0.95);
    priceMax = Math.max(priceMin + 0.01, askNum * 1.05);
  } else if (Number.isFinite(askNum)) {
    priceMin = Math.max(0.001, askNum * 0.9);
    priceMax = askNum * 1.05;
  } else if (Number.isFinite(bidNum)) {
    priceMin = Math.max(0.001, bidNum * 0.95);
    priceMax = Math.min(0.99, bidNum * 1.1);
  } else if (outcomePriceNums.length > 0) {
    const lo = Math.min(...outcomePriceNums);
    const hi = Math.max(...outcomePriceNums);
    priceMin = Math.max(0.001, lo * 0.9);
    priceMax = Math.min(0.99, hi * 1.1);
  }
  const priceNum = (() => {
    const n = Number(price);
    if (!Number.isFinite(n)) return priceMin;
    return Math.max(priceMin, Math.min(priceMax, n));
  })();
  const priceStep = (priceMax - priceMin) / 100;

  useEffect(() => {
    if (lastOrderSuccess == null) return;
    const t = setTimeout(() => dispatch(clearOrderSuccess()), SUCCESS_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [lastOrderSuccess, dispatch]);


  const handleSubmit = useCallback(
    async (side: "BID" | "ASK", outcomeIndex: number) => {
      const tradeCostUsdc = BigInt(amount * 10 ** USDC_DECIMALS);
      // const tradeCostUsdc = BigInt(amount);
      if (!tradeCostUsdc || tradeCostUsdc <= 0) return;
      if (!account?.address) {
        toast.error("Connect your wallet to place orders.");
        return;
      }
      const provider = getEthereumProvider();
      if (!provider) {
        toast.error("Wallet provider not available. Use an injected wallet (e.g. MetaMask).");
        return;
      }
      const pricePerToken = BigInt(1);
      // const priceVal = needsPrice ? BigInt(price.trim()) : BigInt(referencePrice);

      // const pNum = BigInt(Number(priceVal));
      // const qNum = BigInt(Number(quantity));
      const buy = side === "BID";
      // const quantity = buy ? qNum * (pNum || BigInt(0.99)) : qNum * pNum;
      const quantity = BigInt(tradeCostUsdc * pricePerToken);
      const deadline = defaultDeadline();
      const nonce = Date.now().toString();
      console.log("nonce", nonce);
      // try {
      //   nonce = await getOrderNonce();
      // } catch {
      //   nonce = Date.now().toString();
      // }
      const typedData = buildUserTradeTypedData({
        questionId,
        outcomeIndex,
        buy,
        quantity: quantity,
        maxCostUsdc: tradeCostUsdc,
        nonce,
        deadline,
      });
      const serialized = serializeTypedDataForSigning(typedData);
      let signature: string;
      try {
        // Debug logging
        console.log("Account object:", account);
        console.log("Account type:", typeof account);
        console.log("Account keys:", Object.keys(account || {}));

        // Try signing with different methods based on wallet type
        try {
          // First try ThirdWeb's account signTypedData method
          if (account && typeof (account as any).signTypedData === 'function') {
            console.log("Using account.signTypedData...");
            signature = await (account as any).signTypedData({
              domain: typedData.domain,
              types: typedData.types,
              primaryType: typedData.primaryType,
              message: typedData.message,
            });
          } else {
            // For MetaMask, we need to request account access first
            console.log("Requesting account access for MetaMask...");
            try {
              // Request account access
              await provider.request({
                method: 'eth_requestAccounts'
              });

              console.log("Trying eth_signTypedData_v4...");
              signature = await signUserTradeTypedData(provider, account.address, serialized);
            } catch (accessError: any) {
              if (accessError.code === 4100) {
                // User denied account access
                toast.error("Please approve wallet access to continue trading");
                return;
              } else {
                throw accessError;
              }
            }
          }
        } catch (typedDataError: any) {
          console.log("Typed data signing failed, trying personal_sign...");

          // Check if it's an authorization error
          if (typedDataError.code === 4100) {
            toast.error("Please approve the signing request in your wallet");
            return;
          }

          // Fallback to personal_sign for embedded wallets
          try {
            // Convert BigInt to string for JSON serialization
            const serializableData = {
              domain: typedData.domain,
              types: typedData.types,
              primaryType: typedData.primaryType,
              message: {
                ...typedData.message,
                // Convert BigInt values to strings
                quantity: typedData.message.quantity?.toString(),
                maxCostUsdc: typedData.message.maxCostUsdc?.toString(),
                nonce: typedData.message.nonce?.toString(),
                deadline: typedData.message.deadline?.toString(),
                outcomeIndex: typedData.message.outcomeIndex?.toString(),
              }
            };
            const message = JSON.stringify(serializableData);
            const personalSignResult = await provider.request({
              method: 'personal_sign',
              params: [message, account.address]
            });

            signature = personalSignResult as string;
            console.log("Got signature via personal_sign:", signature);
          } catch (personalSignError: any) {
            console.error("Personal sign also failed:", personalSignError);
            if (personalSignError.code === 4100) {
              toast.error("Please approve the signing request in your wallet");
            } else {
              toast.error("Signature failed. Please try again.");
            }
            return;
          }
        }

        console.log("Final signature result:", signature);
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "Signature rejected";
        toast.error(msg);
        return;
      }
      if (!signature?.startsWith("0x")) {
        toast.error("Invalid signature");
        return;
      }
      const expectedSigner = account.address;
      console.log("questionId", questionId);
      const recoveredSigner = await recoverUserTradeSigner(serialized, signature);
      const match =
        expectedSigner != null &&
        recoveredSigner != null &&
        expectedSigner.toLowerCase() === recoveredSigner.toLowerCase();
      console.log("[UserTrade signature debug]", {
        expectedSigner,
        recoveredSigner,
        match,
        hint: match ? "Signer matches wallet." : "Signer does not match wallet; contract may reject.",
      });
      const orderTypeVal = needsPrice ? (orderType === "ioc" ? "IOC" as const : "LIMIT" as const) : "MARKET" as const;
      dispatch(
        submitOrder({
          marketId,
          outcomeIndex,
          side,
          type: orderTypeVal,
          quantity: String(quantity),
          // ...(needsPrice && { price: priceVal }),
          price: String(pricePerToken),
          userSignature: signature,
          tradeCostUsdc: String(tradeCostUsdc),
          nonce,
          deadline: String(deadline),
        })
      );
    },
    [
      account,
      amount,
      needsPrice,
      orderType,
      marketId,
      questionId,
      dispatch,
    ]
  );

  const setAmountFromPercent = useCallback(
    (pct: number) => {
      if (!hasBalance) return;
      const value = (availableBalance * pct) / 100;
      setAmount(value <= 0 ? 0 : value);
    },
    [availableBalance, hasBalance]
  );

  const setAmountFromNotional = useCallback((dollars: number) => {
    const p = Number(referencePrice);
    if (!p || p <= 0) return;
    // const qty = dollars / p;
    setAmount(dollars);
  }, [referencePrice]);

  const clearError = useCallback(() => dispatch(clearMarketsError()), [dispatch]);
  const clearSuccess = useCallback(() => dispatch(clearOrderSuccess()), [dispatch]);
  return (
    <section
      className={`flex flex-col gap-4 rounded-sm p-4 bg-surface ${className}`}
      aria-label="Trade and order book"
    >
      <header className="flex flex-col gap-1 pb-3">
        <p className="text-xs font-medium text-muted-foreground">Available balance</p>
        <p className="text-lg font-semibold tabular-nums text-foreground">
          {hasBalance ? `$${formatBalance(availableBalance)}` : "--"}
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <nav role="tablist" aria-label="Order type" className="flex rounded-lg p-0.5">
          {(
            [
              { id: "market" as const, label: "Market" },
              { id: "limit" as const, label: "Limit" },
              // { id: "ioc" as const, label: "IOC" },
            ] as const
          ).map(({ id, label }) => {
            const isActive = orderType === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${id}`}
                id={`tab-${id}`}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => {
                  setOrderType(id);
                  if ((id === "limit") && !price.trim()) {
                    const mid = (priceMin + priceMax) / 2;
                    setPrice(formatOutcomePrice(mid));
                  }
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Current Market Prices */}
        {marketPrices && (
          <div className="rounded-lg border border-border bg-card cursor-pointer">
            <button
              onClick={() => setIsPriceContainerExpanded(!isPriceContainerExpanded)}
              className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-card-foreground">Current Market Prices</p>
                {isRefreshingPrices ? (
                  <div className="flex items-center gap-1" role="status" aria-live="polite">
                    <Loader2 className="h-3 w-3 animate-spin shrink-0 text-muted-foreground" aria-hidden />
                    <span className="text-xs text-muted-foreground">Updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="text-xs text-muted-foreground">
                      {timeUntilRefresh}s
                    </span>
                  </div>
                )}
              </div>
              <svg
                className={`h-4 w-4 text-muted-foreground transition-transform ${isPriceContainerExpanded ? "rotate-180" : ""
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isPriceContainerExpanded && (
              <div className="px-3 pb-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{yesLabel}</span>
                  <span className="text-card-foreground font-medium">
                    {formatCollateral(currentPrices.yes.toFixed(4))} USDC
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-muted-foreground">{noLabel}</span>
                  <span className="text-card-foreground font-medium">
                    {formatCollateral(currentPrices.no.toFixed(4))} USDC
                  </span>
                </div>

                {/* DON Signature */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">DON Signature</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (donSignature) {
                          navigator.clipboard.writeText(donSignature);
                          toast.success("Signature copied to clipboard");
                        }
                      }}
                      className="text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="font-mono text-xs text-card-foreground  px-2 py-1 rounded border border-border break-all">
                    {donSignature || "Loading..."}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {new Date(lastPriceUpdate).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {needsPrice && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="limit-price-slider" className="text-sm font-medium text-foreground">
                Price
              </label>
              <span className="tabular-nums text-sm font-medium text-foreground">
                {formatOutcomePrice(priceNum)}
              </span>
            </div>
            <input
              id="limit-price-slider"
              type="range"
              min={priceMin}
              max={priceMax}
              step={priceStep <= 0 ? 0.01 : priceStep}
              value={priceNum}
              onChange={(e) => setPrice(e.target.value)}
              className="h-2 w-full appearance-none rounded-full bg-muted accent-primary"
              style={{
                background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((priceNum - priceMin) / (priceMax - priceMin)) * 100}%, var(--color-muted) ${((priceNum - priceMin) / (priceMax - priceMin)) * 100}%, var(--color-muted) 100%)`,
              }}
              aria-label="Limit price"
              aria-valuemin={priceMin}
              aria-valuemax={priceMax}
              aria-valuenow={priceNum}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatOutcomePrice(priceMin)}</span>
              <span>{formatOutcomePrice(priceMax)}</span>
            </div>
          </div>
        )}

        <label className="block text-sm font-medium text-foreground">
          Amount
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Order amount"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <span className="sr-only">Quick amount</span>
          {FLASH_PERCENTS.map((pct) => (
            <button
              key={`pct-${pct}`}
              type="button"
              className="rounded-md bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasBalance}
              onClick={() => setAmountFromPercent(pct)}
              aria-label={`${pct}% of balance`}
            >
              {pct}%
            </button>
          ))}
          {FLASH_NOTIONALS.map((d) => (
            <button
              key={`d-${d}`}
              type="button"
              className="rounded-md bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setAmountFromNotional(d)}
              aria-label={`$${d} notional`}
            >
              ${d}
            </button>
          ))}
        </div>

        {/* You Will Get Section */}
        {potentialProfit && (
          <div className="p-3 rounded-md bg-success/10 border border-success/20">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-success mb-2">You Will Get</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">If {yesLabel}</span>
                <span className="text-success font-medium">
                  +{formatCollateral(potentialProfit.ifTrue.toFixed(2))} USDC
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                <span>Max Gain</span>
                <span className="text-success">{formatCollateral(potentialProfit.maxGain.toFixed(2))}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Max Loss</span>
                <span className="text-danger">{formatCollateral(potentialProfit.maxLoss.toFixed(2))}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {positions.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-white">Open Positions</p>
              <div className="grid grid-cols-2 gap-2">
                {positions.map((position, key) => (
                  <div key={key}>
                    <p className="mb-1.5 text-xs font-medium text-white">
                      {key == 0 ? yesLabel : noLabel} <br />
                      {position.toString()} tokens</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{yesLabel} tokens</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-lg bg-success py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={!canTrade || orderSubmitLoading}
                onClick={() => handleSubmit("BID", 0)}
                aria-label={`Buy ${yesLabel}`}
                aria-busy={orderSubmitLoading}
              >
                Buy {yesLabel}
              </button>
              <button
                type="button"
                className="rounded-lg bg-danger py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={!canTrade || orderSubmitLoading}
                onClick={() => handleSubmit("ASK", 0)}
                aria-label={`Sell ${yesLabel}`}
                aria-busy={orderSubmitLoading}
              >
                Sell {yesLabel}
              </button>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{noLabel} option</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-lg bg-success py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={!canTrade || orderSubmitLoading}
                onClick={() => handleSubmit("BID", 1)}
                aria-label={`Buy ${noLabel}`}
              >
                Buy {noLabel}
              </button>
              <button
                type="button"
                className="rounded-lg bg-danger py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={!canTrade || orderSubmitLoading}
                onClick={() => handleSubmit("ASK", 1)}
                aria-label={`Sell ${noLabel}`}
              >
                Sell {noLabel}
              </button>
            </div>
          </div>
        </div>


        <details className="group rounded-lg bg-muted/30">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-foreground">
            TP / SL (optional)
          </summary>
          <div className="flex flex-col gap-2 p-3">
            <label className="block text-xs font-medium text-muted-foreground">
              Take profit
              <input
                type="text"
                inputMode="decimal"
                placeholder="Target price"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="mt-1 w-full rounded bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Take profit price"
              />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Stop loss
              <input
                type="text"
                inputMode="decimal"
                placeholder="Stop price"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="mt-1 w-full rounded bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Stop loss price"
              />
            </label>
          </div>
        </details>

        {/* Single order status: loading or success in the same place */}
        {(orderSubmitLoading || lastOrderSuccess != null) && (
          <div
            className={`flex flex-col gap-2 rounded-lg border px-3 py-2.5 text-sm ${
              orderSubmitLoading
                ? "border-border bg-muted/30 text-muted-foreground"
                : "border-success/20 bg-success/10 text-success"
            }`}
            role="status"
            aria-live="polite"
            aria-label={orderSubmitLoading ? "Order submitting" : "Order result"}
          >
            {orderSubmitLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                <span>Submitting order…</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span>{lastOrderSuccess}</span>
                  <button
                    type="button"
                    onClick={clearSuccess}
                    className="shrink-0 font-medium underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                    aria-label="Dismiss success"
                  >
                    Dismiss
                  </button>
                </div>
                {lastOrderTxHash && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-success/20">
                    <span className="text-xs text-muted-foreground shrink-0">Transaction:</span>
                    {getBlockExplorerTxUrl(blockExplorerUrl, lastOrderTxHash) ? (
                      <a
                        href={getBlockExplorerTxUrl(blockExplorerUrl, lastOrderTxHash)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline truncate max-w-full"
                        title="View on block explorer"
                      >
                        {lastOrderTxHash.slice(0, 10)}…{lastOrderTxHash.slice(-8)}
                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                      </a>
                    ) : (
                      <span className="font-mono text-xs truncate max-w-full" title={lastOrderTxHash}>
                        {lastOrderTxHash.slice(0, 10)}…{lastOrderTxHash.slice(-8)}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {error != null && (
          <div
            className="flex items-center justify-between gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              className="shrink-0 font-medium underline focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
