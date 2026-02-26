"use client";

import { useCallback, useState } from "react";
import { getContract, prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { baseSepolia } from "thirdweb/chains";
import { toast } from "sonner";
import { thirdwebClient } from "@/lib/thirdweb/client";
import contractsData from "@/contract/contracts.json";

const MAX_UINT256 = BigInt(
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);

export interface ApproveStepProps {
  onNext: () => void;
}

export function ApproveStep({ onNext }: ApproveStepProps) {
  const [usdcApproved, setUsdcApproved] = useState(false);
  const [ctApproved, setCtApproved] = useState(false);
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const contracts = (contractsData as { contracts?: Record<string, string> })
    .contracts;
  const usdcAddress = contracts?.usdc;
  const conditionalTokensAddress = contracts?.conditionalTokens;
  const predictionVaultAddress = contracts?.predictionVault;

  const runUsdcApprove = useCallback(() => {
    if (
      !thirdwebClient ||
      !usdcAddress ||
      !predictionVaultAddress
    ) {
      toast.error("Contract addresses not configured");
      return;
    }
    const contract = getContract({
      client: thirdwebClient,
      chain: baseSepolia,
      address: usdcAddress as `0x${string}`,
    });
    const tx = prepareContractCall({
      contract,
      method: "function approve(address spender, uint256 amount) returns (bool)",
      params: [
        predictionVaultAddress as `0x${string}`,
        MAX_UINT256,
      ],
    });
    sendTransaction(tx, {
      onSuccess: () => {
        setUsdcApproved(true);
        toast.success("Collateral (USDC) approval submitted");
      },
      onError: (err) => {
        toast.error(err?.message ?? "USDC approval failed");
      },
    });
  }, [sendTransaction, usdcAddress, predictionVaultAddress]);

  const runCtApprove = useCallback(() => {
    if (
      !thirdwebClient ||
      !conditionalTokensAddress ||
      !predictionVaultAddress
    ) {
      toast.error("Contract addresses not configured");
      return;
    }
    const contract = getContract({
      client: thirdwebClient,
      chain: baseSepolia,
      address: conditionalTokensAddress as `0x${string}`,
    });
    const tx = prepareContractCall({
      contract,
      method: "function setApprovalForAll(address operator, bool approved)",
      params: [predictionVaultAddress as `0x${string}`, true],
    });
    sendTransaction(tx, {
      onSuccess: () => {
        setCtApproved(true);
        toast.success("Conditional tokens approval submitted");
      },
      onError: (err) => {
        toast.error(err?.message ?? "Conditional tokens approval failed");
      },
    });
  }, [sendTransaction, conditionalTokensAddress, predictionVaultAddress]);

  const bothDone = usdcApproved && ctApproved;
  const canProceed = bothDone;

  return (
    <section
      className="flex flex-col items-center justify-center gap-8 px-4 py-12"
      aria-label="Token approvals"
    >
      <h2 className="text-center text-xl font-semibold text-(--reg-text) sm:text-2xl">
        Approve token spending
      </h2>
      <p className="max-w-md text-center text-sm text-(--reg-muted)">
        Approve the prediction vault to spend your collateral (USDC) and
        conditional outcome tokens. Required before trading. Each action
        requires a wallet signature.
      </p>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border border-(--reg-border) bg-(--reg-card) p-4">
          <div>
            <p className="font-medium text-(--reg-text)">Collateral (USDC)</p>
            <p className="text-xs text-(--reg-muted)">
              Allow the vault to use your USDC for trades
            </p>
          </div>
          <button
            type="button"
            onClick={runUsdcApprove}
            disabled={isPending || usdcApproved}
            className="register-btn-primary shrink-0 cursor-pointer px-4 py-2 text-sm disabled:opacity-50"
          >
            {usdcApproved ? "Approved" : isPending ? "Confirm in wallet…" : "Approve USDC"}
          </button>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-(--reg-border) bg-(--reg-card) p-4">
          <div>
            <p className="font-medium text-(--reg-text)">Conditional tokens</p>
            <p className="text-xs text-(--reg-muted)">
              Allow the vault to transfer your outcome tokens
            </p>
          </div>
          <button
            type="button"
            onClick={runCtApprove}
            disabled={isPending || ctApproved}
            className="register-btn-primary shrink-0 cursor-pointer px-4 py-2 text-sm disabled:opacity-50"
          >
            {ctApproved ? "Approved" : isPending ? "Confirm in wallet…" : "Approve CT"}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="register-btn-primary cursor-pointer px-6 py-3 disabled:opacity-50"
      >
        {canProceed ? "Continue" : "Complete both approvals above to continue"}
      </button>
    </section>
  );
}
