"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { vaultSchema, type VaultFormValues } from "@/lib/settings.schema";
import {
  getVaultBalance,
  depositVault,
  withdrawVault,
} from "@/lib/api/settings";
import { MintUsdcButton } from "@/components/settings/MintUsdcButton/MintUsdcButton";

export function VaultTab() {
  const [balance, setBalance] = useState<string>("0");
  const [balanceLoading, setBalanceLoading] = useState(true);

  const depositForm = useForm<VaultFormValues>({
    resolver: zodResolver(vaultSchema),
    defaultValues: { amount: "", action: "deposit" },
  });
  const withdrawForm = useForm<VaultFormValues>({
    resolver: zodResolver(vaultSchema),
    defaultValues: { amount: "", action: "withdraw" },
  });

  const fetchBalance = () => {
    setBalanceLoading(true);
    getVaultBalance()
      .then((data) => setBalance(data.balance ?? "0"))
      .catch(() => toast.error("Failed to load vault balance"))
      .finally(() => setBalanceLoading(false));
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const onDeposit = async (data: VaultFormValues) => {
    try {
      const res = await depositVault(data.amount);
      setBalance(res.balance ?? balance);
      depositForm.reset({ amount: "", action: "deposit" });
      toast.success(`Deposit of ${data.amount} USDC completed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deposit failed");
    }
  };

  const onWithdraw = async (data: VaultFormValues) => {
    try {
      const res = await withdrawVault(data.amount);
      setBalance(res.balance ?? balance);
      withdrawForm.reset({ amount: "", action: "withdraw" });
      toast.success(`Withdrawal of ${data.amount} USDC completed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Withdrawal failed");
    }
  };

  return (
    <section className="flex flex-col gap-6 p-4" aria-labelledby="vault-heading">
      <header id="vault-heading">
        <h2 className="text-lg font-semibold text-foreground">Vault & Funds</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Prediction Vault USDC balance and transfers.
        </p>
      </header>

      <article
        className="rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
      >
        <h3 className="text-sm font-medium text-muted-foreground">
          USDC balance (Prediction Vault)
        </h3>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
          {balanceLoading ? "…" : balance} USDC
        </p>
      </article>

      <MintUsdcButton />

      <div className="grid gap-6 sm:grid-cols-2">
        <article
          className="rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
        >
          <h3 className="text-sm font-medium text-foreground">Deposit</h3>
          <form
            onSubmit={depositForm.handleSubmit(onDeposit)}
            className="mt-4 flex flex-col gap-4"
          >
            <input type="hidden" {...depositForm.register("action")} value="deposit" />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Amount (USDC)
              </span>
              <input
                {...depositForm.register("amount")}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent-violet focus:outline-none focus:ring-1 focus:ring-accent-violet"
              />
              {depositForm.formState.errors.amount && (
                <p className="mt-1 text-xs text-danger">
                  {depositForm.formState.errors.amount.message}
                </p>
              )}
            </label>
            <button
              type="submit"
              disabled={depositForm.formState.isSubmitting}
              className="w-fit rounded-lg bg-accent-violet px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-violet-hover disabled:opacity-50"
            >
              {depositForm.formState.isSubmitting ? "Submitting…" : "Deposit"}
            </button>
          </form>
        </article>

        <article
          className="rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
        >
          <h3 className="text-sm font-medium text-foreground">Withdraw</h3>
          <form
            onSubmit={withdrawForm.handleSubmit(onWithdraw)}
            className="mt-4 flex flex-col gap-4"
          >
            <input type="hidden" {...withdrawForm.register("action")} value="withdraw" />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Amount (USDC)
              </span>
              <input
                {...withdrawForm.register("amount")}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
              {withdrawForm.formState.errors.amount && (
                <p className="mt-1 text-xs text-danger">
                  {withdrawForm.formState.errors.amount.message}
                </p>
              )}
            </label>
            <button
              type="submit"
              disabled={withdrawForm.formState.isSubmitting}
              className="w-fit rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue-hover disabled:opacity-50"
            >
              {withdrawForm.formState.isSubmitting ? "Submitting…" : "Withdraw"}
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}
