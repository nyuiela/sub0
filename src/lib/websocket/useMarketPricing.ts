"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { requestMarketPricing, type PricingRequest } from "@/lib/api/prices";
import type { LmsrPricingUpdatePayload } from "./websocket-types";

export interface PricingResult extends LmsrPricingUpdatePayload { }

export interface UseMarketPricingOptions {
  marketId: string;
  /** Use GET request instead of POST (default: false) */
  useGet?: boolean;
  onPricingUpdate?: (result: PricingResult) => void;
  onError?: (error: Error) => void;
}

export interface UseMarketPricingReturn {
  /** Request a pricing quote. Returns requestId or null on failure. */
  requestPricing: (params: PricingRequest) => Promise<string | null>;
  /** Check if a specific request is still pending */
  isPending: (requestId: string) => boolean;
  /** Get all pending request IDs */
  pendingRequestIds: string[];
  /** Count of pending requests */
  pendingCount: number;
  /** Check if a quote is still valid (not expired) */
  isQuoteValid: (result: PricingResult, bufferMs?: number) => boolean;
  /** Clear all pending requests */
  clearPending: () => void;
}

/**
 * Hook for requesting and receiving LMSR pricing via REST API + WebSocket.
 *
 * Usage:
 * 1. Call requestPricing() to send a pricing request
 * 2. The result arrives via onPricingUpdate callback when WebSocket delivers LMSR_PRICING_UPDATE
 * 3. Use isQuoteValid() to check if the quote is still valid before executing
 *
 * Example:
 * ```tsx
 * const { requestPricing, isQuoteValid } = useMarketPricing({
 *   marketId: "market-123",
 *   useGet: true, // Use GET request
 *   onPricingUpdate: (result) => {
 *     console.log("Cost:", result.tradeCostUsdc);
 *     setQuote(result);
 *   },
 * });
 *
 * const handleGetQuote = async () => {
 *   const requestId = await requestPricing({ outcomeIndex: 0, quantity: "1000000" });
 * };
 * ```
 */
export function useMarketPricing(options: UseMarketPricingOptions): UseMarketPricingReturn {
  const { marketId, useGet = false, onPricingUpdate, onError } = options;

  // Track pending request IDs
  const pendingRequestsRef = useRef<Set<string>>(new Set());
  const [pendingRequestIds, setPendingRequestIds] = useState<string[]>([]);

  // Sync state with ref
  const updatePending = useCallback(() => {
    setPendingRequestIds(Array.from(pendingRequestsRef.current));
  }, []);

  // Handle incoming pricing update
  const handlePricingUpdate = useCallback(
    (payload: LmsrPricingUpdatePayload) => {
      // Only handle updates for our market
      if (payload.marketId !== marketId) return;

      // Check if this is a response to our pending request
      if (pendingRequestsRef.current.has(payload.requestId)) {
        // Remove from pending
        pendingRequestsRef.current.delete(payload.requestId);
        updatePending();

        // Notify callback
        onPricingUpdate?.(payload);
      }
    },
    [marketId, onPricingUpdate, updatePending]
  );

  // Request pricing function (supports both GET and POST)
  const requestPricing = useCallback(
    async (params: PricingRequest): Promise<string | null> => {
      try {
        let response;

        if (useGet) {
          // Use GET request with query parameters
          const searchParams = new URLSearchParams({
            outcomeIndex: params.outcomeIndex.toString(),
            quantity: params.quantity,
          });

          if (params.bParameter) {
            searchParams.append("bParameter", params.bParameter);
          }

          const res = await fetch(`/api/markets/${encodeURIComponent(marketId)}/pricing?${searchParams.toString()}`, {
            credentials: "include",
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            throw new Error(data.error || "Pricing request failed");
          }

          response = data;
        } else {
          // Use POST request with JSON body
          response = await requestMarketPricing(marketId, params);
        }

        if (!response.success) {
          throw new Error(response.error || "Pricing request failed");
        }

        // Track pending request
        pendingRequestsRef.current.add(response.requestId);
        updatePending();

        return response.requestId;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        onError?.(err);
        return null;
      }
    },
    [marketId, useGet, onError, updatePending]
  );

  // Check if a request is pending
  const isPending = useCallback(
    (requestId: string): boolean => {
      return pendingRequestsRef.current.has(requestId);
    },
    []
  );

  // Check if a quote is still valid
  const isQuoteValid = useCallback(
    (result: PricingResult, bufferMs: number = 60000): boolean => {
      const deadlineMs = Number(result.deadline) * 1000;
      return Date.now() < deadlineMs - bufferMs;
    },
    []
  );

  // Clear all pending requests
  const clearPending = useCallback(() => {
    pendingRequestsRef.current.clear();
    updatePending();
  }, [updatePending]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pendingRequestsRef.current.clear();
    };
  }, []);

  return {
    requestPricing,
    isPending,
    pendingRequestIds,
    pendingCount: pendingRequestIds.length,
    isQuoteValid,
    clearPending,
  };
}
