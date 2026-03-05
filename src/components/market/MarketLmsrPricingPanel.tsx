"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";
import { useMarketPricing } from "@/lib/websocket/useMarketPricing";
import { getMarketPrices } from "@/lib/api/prices";
import type { LmsrPricingUpdatePayload } from "@/lib/websocket/websocket-types";
import { formatCollateral, USDC_DECIMALS } from "@/lib/formatNumbers";
import type { MarketPricesResponse } from "@/types/prices.types";

interface MarketLmsrPricingPanelProps {
  marketId: string;
  questionId: string;
  outcomes?: string[];
  className?: string;
}

// Simple LMSR calculation: cost = b * log(sum(exp(q_i/b)))
function calculateLmsrCost(
  quantities: number[],
  b: number = 1000000 // Default liquidity parameter
): number {
  const sum = quantities.reduce((acc, q) => acc + Math.exp(q / b), 0);
  return b * Math.log(sum);
}

// Calculate marginal price for outcome i
function calculateMarginalPrice(
  quantities: number[],
  outcomeIndex: number,
  b: number = 1000000
): number {
  const exp_qi = Math.exp(quantities[outcomeIndex] / b);
  const sum = quantities.reduce((acc, q) => acc + Math.exp(q / b), 0);
  return exp_qi / sum;
}

export function MarketLmsrPricingPanel({
  marketId,
  questionId,
  outcomes = ["Yes", "No"],
  className = "",
}: MarketLmsrPricingPanelProps) {
  const [selectedOutcome, setSelectedOutcome] = useState(0);
  const [quantity, setQuantity] = useState("1000000"); // 1 USDC
  const [latestQuote, setLatestQuote] = useState<LmsrPricingUpdatePayload | null>(null);
  const [basePrices, setBasePrices] = useState<MarketPricesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate current quantities from base prices (inverse LMSR)
  const currentQuantities = useMemo(() => {
    if (!basePrices) return [0, 0];

    // Extract quantities and prices from the API response
    const quantities = basePrices.quantities.map(q => Number(q));
    const prices = basePrices.prices.map(p => Number(p) / 10 ** 6); // Convert from 6 decimals

    // Return the actual quantities from the market
    return quantities;
  }, [basePrices]);

  // Get current prices for display
  const currentPrices = useMemo(() => {
    if (!basePrices) return { yes: 0, no: 0 };

    const prices = basePrices.prices.map(p => Number(p) / 10 ** 6); // Convert from 6 decimals
    return {
      yes: prices[0] || 0,
      no: prices[1] || 0,
    };
  }, [basePrices]);

  // Calculate cost for user-specified quantity
  const calculatedCost = useMemo(() => {
    const userQty = Number(quantity);
    if (userQty <= 0 || !basePrices) return null;

    const newQuantities = [...currentQuantities];
    newQuantities[selectedOutcome] += userQty;

    const currentCost = calculateLmsrCost(currentQuantities);
    const newCost = calculateLmsrCost(newQuantities);

    return newCost - currentCost;
  }, [quantity, selectedOutcome, currentQuantities, basePrices]);

  // Calculate potential profit
  const potentialProfit = useMemo(() => {
    if (!calculatedCost || !basePrices) return null;

    const userQty = Number(quantity);
    const costUsdc = calculatedCost / 10 ** 6; // Convert to USDC

    // If this outcome resolves true, profit = (quantity - cost)
    // If this outcome resolves false, profit = -cost
    const profitIfTrue = (userQty / 10 ** 6) - costUsdc;
    const profitIfFalse = -costUsdc;

    return {
      ifTrue: profitIfTrue,
      ifFalse: profitIfFalse,
      maxGain: profitIfTrue,
      maxLoss: Math.abs(profitIfFalse),
    };
  }, [calculatedCost, quantity, basePrices]);

  // Handle pricing updates from WebSocket
  const handlePricingUpdate = useCallback((payload: LmsrPricingUpdatePayload) => {
    setLatestQuote(payload);
    setError(null);
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err.message);
  }, []);

  // Set up WebSocket connection with LMSR pricing handler
  useMarketSocket({
    marketId,
    enabled: Boolean(marketId),
    onLmsrPricingUpdate: handlePricingUpdate,
  });

  // Set up pricing request functionality (for auto-fetch)
  const { requestPricing, isQuoteValid } = useMarketPricing({
    marketId,
    useGet: true, // Use GET for auto-fetch
    onPricingUpdate: handlePricingUpdate,
    onError: handleError,
  });

  // Auto-fetch base prices on component mount
  useEffect(() => {
    const fetchBasePrices = async () => {
      setIsLoading(true);
      try {
        const prices = await getMarketPrices(marketId, "1"); // Get 1:1 price
        setBasePrices(prices);

        // Also request a quote for the default outcome and quantity
        const requestId = await requestPricing({
          outcomeIndex: selectedOutcome,
          quantity,
        });

        if (!requestId) {
          setError("Failed to fetch pricing");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch prices");
      } finally {
        setIsLoading(false);
      }
    };

    if (marketId) {
      fetchBasePrices();
    }
  }, [marketId]);

  // Auto-refresh when WebSocket updates prices
  useEffect(() => {
    if (latestQuote && basePrices) {
      // Update base prices with new quote data
      const updatedPrices = { ...basePrices };
      if (latestQuote.outcomeIndex === 0) {
        updatedPrices.prices[0] = latestQuote.tradeCostUsdc;
      } else {
        updatedPrices.prices[1] = latestQuote.tradeCostUsdc;
      }
      setBasePrices(updatedPrices);
    }
  }, [latestQuote, basePrices]);

  const handleExecuteTrade = useCallback(() => {
    if (!latestQuote || !isQuoteValid(latestQuote)) {
      setError("Quote is expired or invalid");
      return;
    }

    // In a real implementation, this would execute the trade on-chain
    console.log("Executing trade with quote:", {
      questionId: latestQuote.questionId,
      outcomeIndex: latestQuote.outcomeIndex,
      quantity: latestQuote.quantity,
      tradeCostUsdc: latestQuote.tradeCostUsdc,
      nonce: latestQuote.nonce,
      deadline: latestQuote.deadline,
      donSignature: latestQuote.donSignature,
    });

    // Clear quote after execution
    setLatestQuote(null);
  }, [latestQuote, isQuoteValid]);

  const quoteStatus = useMemo(() => {
    if (!latestQuote) return null;

    const deadlineMs = Number(latestQuote.deadline) * 1000;
    const now = Date.now();
    const remaining = deadlineMs - now;

    if (remaining <= 0) return { status: "expired", text: "Expired" };
    if (remaining < 60000) return { status: "urgent", text: `Expires in ${Math.floor(remaining / 1000)}s` };
    return { status: "valid", text: `Valid for ${Math.floor(remaining / 60000)}m` };
  }, [latestQuote]);

  const formattedCost = useMemo(() => {
    if (calculatedCost) {
      const costUsdc = calculatedCost / 10 ** 6;
      return formatCollateral(costUsdc.toFixed(2));
    }
    if (latestQuote) {
      const costUsdc = Number(latestQuote.tradeCostUsdc) / 10 ** 6;
      return formatCollateral(costUsdc.toFixed(2));
    }
    return null;
  }, [calculatedCost, latestQuote]);

  const formattedQuantity = useMemo(() => {
    const qty = Number(quantity) / 10 ** 6;
    return formatCollateral(qty.toFixed(2));
  }, [quantity]);

  return (
    <div className={`rounded-lg border border-border bg-surface p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-foreground mb-3">LMSR Live Pricing</h3>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-muted-foreground">Loading prices...</span>
        </div>
      )}

      {/* Outcome Selection */}
      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1.5 block">Select Outcome</label>
        <div className="flex gap-2">
          {outcomes.map((outcome, index) => (
            <button
              key={index}
              onClick={() => setSelectedOutcome(index)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${selectedOutcome === index
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {outcome}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Input */}
      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1.5 block">
          Amount (USDC)
        </label>
        <input
          type="text"
          value={formattedQuantity}
          onChange={(e) => {
            const val = e.target.value;
            const num = parseFloat(val) * 10 ** 6;
            if (!isNaN(num) && num > 0) {
              setQuantity(Math.floor(num).toString());
            }
          }}
          placeholder="1"
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Cost Display */}
      {formattedCost && (
        <div className="mb-4 p-3 rounded-md bg-muted/50 border border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cost</span>
            <span className="text-foreground font-medium">{formattedCost} USDC</span>
          </div>
        </div>
      )}

      {/* Quote Details */}
      {latestQuote && (
        <div className="mb-4 p-3 rounded-md bg-muted/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Live Quote</span>
            {quoteStatus && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${quoteStatus.status === "valid"
                  ? "bg-success/10 text-success"
                  : quoteStatus.status === "urgent"
                    ? "bg-warning/10 text-warning"
                    : "bg-danger/10 text-danger"
                  }`}
              >
                {quoteStatus.text}
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Request ID</span>
              <span className="text-foreground font-mono">{latestQuote.requestId.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deadline</span>
              <span className="text-foreground">
                {new Date(Number(latestQuote.deadline) * 1000).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Signature</span>
              <span className="text-foreground font-mono text-xs">
                {latestQuote.donSignature.slice(0, 10)}...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-3 p-2 rounded-md bg-danger/10 border border-danger/20">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {/* Execute Trade Button */}
      {latestQuote && quoteStatus?.status !== "expired" && (
        <button
          onClick={handleExecuteTrade}
          className="w-full py-2.5 px-4 bg-success text-success-foreground rounded-md text-sm font-medium hover:bg-success/90 transition-colors"
        >
          Execute Trade
        </button>
      )}

      {/* Info */}
      <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
        Prices calculated using LMSR model. Quotes include oracle signature for on-chain execution.
      </p>
    </div>
  );
}
