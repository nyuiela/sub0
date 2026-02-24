"use client";

import { mintUsdcForCurrentUser } from "@/app/actions/mint";
import { useWalletBalanceRefresh } from "@/contexts/WalletBalanceRefreshContext";
import { useState } from "react";
import { toast } from "sonner";

const DEFAULT_AMOUNT = 100;
const MINT_CAP =
  typeof process.env.NEXT_PUBLIC_USDC_DAILY_MINT_CAP !== "undefined"
    ? Number(process.env.NEXT_PUBLIC_USDC_DAILY_MINT_CAP)
    : 2000;

export function AccountBar() {
  const { refreshBalance } = useWalletBalanceRefresh();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>(String(DEFAULT_AMOUNT));

  const handleMint = async () => {
    const value = amount.trim() ? parseFloat(amount) : DEFAULT_AMOUNT;
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (value > MINT_CAP) {
      toast.error(`Max ${MINT_CAP} USDC per mint`);
      return;
    }
    setLoading(true);
    try {
      const result = await mintUsdcForCurrentUser(value);
      if (result.success) {
        refreshBalance();
        toast.success(
          `Minted ${value} test USDC. Tx: ${result.transactionHash.slice(0, 10)}...`
        );
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Mint failed");
    } finally {
      setLoading(false);
    }
  };

  const value = amount.trim() ? parseFloat(amount) : DEFAULT_AMOUNT;
  const isOverCap = Number.isFinite(value) && value > MINT_CAP;

  return (
    <section
      className="flex flex-wrap items-center gap-2 sm:gap-4"
      aria-label="Account and balance"
    >
      <button
        type="button"
        onClick={() => void handleMint()}
        disabled={loading || !Number.isFinite(value) || value <= 0 || isOverCap}
        className="cursor-pointer rounded-md border border-transparent bg-success px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Minting…" : "Deposit"}
      </button>
      <span className="flex items-center text-sm font-medium text-foreground">
        <span aria-hidden>$</span>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={String(DEFAULT_AMOUNT)}
          aria-label="Balance amount"
          className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </span>
      {isOverCap && (
        <span className="text-xs text-danger" role="alert">
          Cap {MINT_CAP} USDC
        </span>
      )}
    </section>
  );
}
