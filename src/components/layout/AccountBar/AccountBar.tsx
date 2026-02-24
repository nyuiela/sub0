"use client";

import { useCallback, useMemo, useState } from "react";
import { getContract, prepareContractCall } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { baseSepolia } from "thirdweb/chains";
import { thirdwebClient } from "@/lib/thirdweb/client";
import contractsData from "@/contract/contracts.json";

const USDC_DECIMALS = (contractsData as { conventions?: { usdcDecimals?: number } }).conventions?.usdcDecimals ?? 6;
const DEFAULT_AMOUNT = 100;
const MINT_CAP = typeof process.env.NEXT_PUBLIC_USDC_DAILY_MINT_CAP !== "undefined"
  ? Number(process.env.NEXT_PUBLIC_USDC_DAILY_MINT_CAP)
  : 2000;

function parseMintAmount(value: string): number {
  const n = Number(value.trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function AccountBar() {
  const [amountInput, setAmountInput] = useState(String(DEFAULT_AMOUNT));
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const amount = useMemo(() => parseMintAmount(amountInput), [amountInput]);
  const clampedAmount = useMemo(() => Math.min(amount, MINT_CAP), [amount]);
  const isOverCap = amount > MINT_CAP;

  const handleDeposit = useCallback(() => {
    if (thirdwebClient == null || account == null) return;
    const raw = BigInt(Math.floor(clampedAmount * 10 ** USDC_DECIMALS));
    if (raw <= BigInt(0)) return;
    const usdcAddress = (contractsData as { contracts?: { usdc?: string } }).contracts?.usdc;
    if (usdcAddress == null) return;
    const contract = getContract({
      client: thirdwebClient,
      chain: baseSepolia,
      address: usdcAddress,
    });
    const transaction = prepareContractCall({
      contract,
      method: "function mint(address to, uint256 amount)",
      params: [account.address, raw],
    });
    sendTransaction(transaction);
  }, [account, clampedAmount, sendTransaction]);

  return (
    <section
      className="flex flex-wrap items-center gap-2 sm:gap-4"
      aria-label="Account and balance"
    >
      <button
        type="button"
        onClick={handleDeposit}
        disabled={!account || isPending || clampedAmount <= 0 || isOverCap}
        className="cursor-pointer rounded-md border border-transparent bg-success px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Minting…" : "Deposit"}
      </button>
      <span className="flex items-center text-sm font-medium text-foreground">
        <span aria-hidden>$</span>
        <input
          type="number"
          min={0}
          max={MINT_CAP}
          step={1}
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          aria-label="Balance amount"
          className="w-16 border border-border bg-surface px-2 py-1.5 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:border-primary"
        />
      </span>
      {isOverCap && (
        <span className="text-xs text-danger" role="alert">
          Cap {MINT_CAP} USDC
        </span>
      )}
      <span className="text-xs text-muted">
        Avail bal: $0
      </span>
    </section>
  );
}
