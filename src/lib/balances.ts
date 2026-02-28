/**
 * Fetch ETH and USDC balances for an address on Base Sepolia.
 * Used by DepositToAgentModal to show agent wallet balances.
 */

import { createPublicClient, http } from "viem";
import { baseSepolia as baseSepoliaViem } from "viem/chains";
import { getContract } from "thirdweb";
import { balanceOf } from "thirdweb/extensions/erc20";
import { baseSepolia, sepolia } from "thirdweb/chains";
import { thirdwebClient } from "@/lib/thirdweb/client";
import contractsData from "@/contract/contracts.json";

const USDC_DECIMALS = 6;

export interface WalletBalances {
  eth: string;
  usdc: string;
  ethWei: bigint;
  usdcRaw: bigint;
}

const publicClient = createPublicClient({
  chain: baseSepoliaViem,
  transport: http(),
});

export async function getWalletBalances(address: string): Promise<WalletBalances> {
  const ethWei = await publicClient.getBalance({ address: address as `0x${string}` });
  const ethFormatted = Number(ethWei) / 1e18;
  const ethStr = ethFormatted < 0.0001 ? "0" : ethFormatted.toFixed(4);

  const usdcAddress = (contractsData as { contracts?: { usdc?: string } }).contracts?.usdc;
  let usdcRaw = BigInt(0);
  if (usdcAddress && thirdwebClient) {
    const contract = getContract({
      client: thirdwebClient,
      chain: sepolia,
      address: usdcAddress,
    });
    const result = await balanceOf({
      contract,
      address: address as `0x${string}`,
    });
    usdcRaw = typeof result === "bigint" ? result : BigInt(String(result ?? 0));
  }
  const usdcFormatted = Number(usdcRaw) / 10 ** USDC_DECIMALS;
  const usdcStr = usdcFormatted.toFixed(2);

  return { eth: ethStr, usdc: usdcStr, ethWei, usdcRaw };
}
