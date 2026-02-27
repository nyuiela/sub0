"use client";

import { useState, useCallback, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  submitOrder,
  clearMarketsError,
  clearOrderSuccess,
  selectOrderBookByMarketId,
} from "@/store/slices/marketsSlice";
import { formatOutcomePrice, formatOutcomeQuantity, formatCollateral } from "@/lib/formatNumbers";
import { getOrderNonce } from "@/lib/api/orders";
import {
  buildUserTradeTypedData,
  serializeTypedDataForSigning,
  signUserTradeTypedData,
  defaultDeadline,
  type EIP1193Provider,
} from "@/lib/userTradeSignature";
import { toast } from "sonner";
import type { MarketPricesResponse } from "@/types/prices.types";

const SUCCESS_AUTO_DISMISS_MS = 5000;
const FLASH_NOTIONALS = [50, 100] as const;
const FLASH_PERCENTS = [25, 50, 100] as const;

function formatBalance(value: number): string {
  if (value >= 1_000_000) return `${formatCollateral(value / 1_000_000)}M`;
  if (value >= 1_000) return `${formatCollateral(value / 1_000)}K`;
  return formatCollateral(value);
}

export interface MarketTradePanelProps {
  marketId: string;
  marketStatus?: string;
  /** Outcome labels for this prediction market, e.g. ["Yes", "No"]. Used for Buy/Sell button labels. */
  outcomes?: unknown[];
  /** LMSR prices; used for reference price and bounds when order book is empty. */
  marketPrices?: MarketPricesResponse | null;
  /** Available balance (e.g. USDC) for display and % flash buttons. When not provided, shows "--". */
  availableBalance?: number;
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
  marketStatus = "OPEN",
  outcomes: outcomesProp = [],
  marketPrices,
  availableBalance = 0,
  className = "",
}: MarketTradePanelProps) {
  const account = useActiveAccount();
  const dispatch = useAppDispatch();
  const orderBook = useAppSelector((state) => selectOrderBookByMarketId(state, marketId, 0));
  const { orderSubmitLoading, error, lastOrderSuccess } = useAppSelector((state) => state.markets);
  const outcomesList = Array.isArray(outcomesProp) ? outcomesProp : [];
  const [yesLabel, noLabel] = parseOutcomeLabels(outcomesList);

  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [orderType, setOrderType] = useState<"market" | "limit" | "ioc">("market");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

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
      const quantity = amount.trim();
      if (!quantity || Number(quantity) <= 0) return;
      if (!account?.address) {
        toast.error("Connect your wallet to place orders.");
        return;
      }
      const provider = getEthereumProvider();
      if (!provider) {
        toast.error("Wallet provider not available. Use an injected wallet (e.g. MetaMask).");
        return;
      }
      const priceVal = needsPrice ? price.trim() : String(referencePrice);
      const pNum = Number(priceVal) || 0;
      const qNum = Number(quantity) || 0;
      const buy = side === "BID";
      const maxCostUsdc = buy ? qNum * (pNum || 0.99) : 0;
      const deadline = defaultDeadline();
      let nonce: string;
      try {
        nonce = await getOrderNonce();
      } catch {
        nonce = "0";
      }
      const typedData = buildUserTradeTypedData({
        marketId,
        outcomeIndex,
        buy,
        quantity,
        maxCostUsdc,
        nonce,
        deadline,
      });
      const serialized = serializeTypedDataForSigning(typedData);
      let signature: string;
      try {
        signature = await signUserTradeTypedData(provider, account.address, serialized);
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
      const tradeCostUsdc = String(maxCostUsdc);
      const orderTypeVal = needsPrice ? (orderType === "ioc" ? "IOC" as const : "LIMIT" as const) : "MARKET" as const;
      dispatch(
        submitOrder({
          marketId,
          outcomeIndex,
          side,
          type: orderTypeVal,
          quantity,
          ...(needsPrice && { price: priceVal }),
          userSignature: signature,
          tradeCostUsdc,
          nonce,
          deadline: String(deadline),
        })
      );
    },
    [
      account?.address,
      amount,
      price,
      orderType,
      needsPrice,
      referencePrice,
      marketId,
      dispatch,
    ]
  );

  const setAmountFromPercent = useCallback(
    (pct: number) => {
      if (!hasBalance) return;
      const value = (availableBalance * pct) / 100;
      setAmount(value <= 0 ? "" : formatCollateral(value));
    },
    [availableBalance, hasBalance]
  );

  const setAmountFromNotional = useCallback((dollars: number) => {
    const p = Number(referencePrice);
    if (!p || p <= 0) return;
    const qty = dollars / p;
    setAmount(formatOutcomeQuantity(qty));
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
              { id: "ioc" as const, label: "IOC" },
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
                  if ((id === "limit" || id === "ioc") && !price.trim()) {
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
            onChange={(e) => setAmount(e.target.value)}
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
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{yesLabel} tokens</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-lg bg-success py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canTrade || orderSubmitLoading}
                onClick={() => handleSubmit("BID", 0)}
                aria-label={`Buy ${yesLabel}`}
              >
                Buy {yesLabel}
              </button>
              <button
                type="button"
                className="rounded-lg bg-danger py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canTrade || orderSubmitLoading}
                onClick={() => handleSubmit("ASK", 0)}
                aria-label={`Sell ${yesLabel}`}
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
                className="rounded-lg bg-success py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canTrade || orderSubmitLoading}
                onClick={() => handleSubmit("BID", 1)}
                aria-label={`Buy ${noLabel}`}
              >
                Buy {noLabel}
              </button>
              <button
                type="button"
                className="rounded-lg bg-danger py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {lastOrderSuccess != null && (
          <div
            className="flex items-center justify-between gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success"
            role="status"
          >
            <span>{lastOrderSuccess}</span>
            <button
              type="button"
              onClick={clearSuccess}
              className="shrink-0 font-medium underline focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Dismiss success"
            >
              Dismiss
            </button>
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
