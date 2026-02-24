"use client";

import { useState } from "react";
import { toast } from "sonner";
import { mintUsdcForCurrentUser } from "@/app/actions/mint";

const DEFAULT_AMOUNT = 100;

export function MintUsdcButton() {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>(String(DEFAULT_AMOUNT));

  const handleMint = async () => {
    const value = amount.trim() ? parseFloat(amount) : DEFAULT_AMOUNT;
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const result = await mintUsdcForCurrentUser(value);
      if (result.success) {
        toast.success(`Minted ${value} test USDC. Tx: ${result.transactionHash.slice(0, 10)}...`);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Mint failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article
      className="rounded-xl border border-border bg-surface/60 p-6"
      style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
    >
      <h3 className="text-sm font-medium text-foreground">Mint test USDC</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Receive test USDC to your connected wallet (Base Sepolia). Uses server auth key.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Amount (USDC)</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(DEFAULT_AMOUNT)}
            className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <button
          type="button"
          onClick={handleMint}
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          {loading ? "Minting…" : "Mint USDC"}
        </button>
      </div>
    </article>
  );
}
