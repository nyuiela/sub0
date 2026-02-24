"use client";

import { mintUsdcForCurrentUser } from "@/app/actions/mint";
import { useState } from "react";
import { toast } from "sonner";


const DEFAULT_AMOUNT = 100;

export function AccountBar() {
  const [autoOn, setAutoOn] = useState(false);
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
    <section
      className="flex flex-wrap items-center gap-2 sm:gap-4"
      aria-label="Account and balance"
    >
      <button
        type="button"
        onClick={handleMint}
        disabled={loading}
        className="cursor-pointer rounded-md border border-transparent bg-success px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
      >
        Deposit
      </button>
      <span className="flex items-center text-sm font-medium text-foreground">
        <span aria-hidden>$</span>
        {/* <button
          type="button"
          onClick={handleMint}
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          {loading ? "Minting…" : "Mint USDC"}
        </button> */}
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={String(DEFAULT_AMOUNT)}
          className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />

      </span>
      {/* <button
        type="button"
        onClick={() => setAutoOn((prev) => !prev)}
        aria-pressed={autoOn}
        aria-label="Toggle auto trading"
        className="cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-primary-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Auto
      </button> */}
      {/* <span className="text-xs text-muted">
        Avail bal: $0
      </span> */}
    </section>
  );
}
