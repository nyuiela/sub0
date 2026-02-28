/**
 * Server-only USDC mint using THIRDWEB_AUTH_PRIVATE_KEY.
 * Mints test USDC to the given address on Base Sepolia (chainId 11155111).
 * Import only from server actions or API routes.
 *
 * Supports both mint(address,uint256) and mintTo(address,uint256).
 * Amount is in human units (e.g. 100 = 100 USDC); converted to 6 decimals for the contract.
 */

import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { createThirdwebClient } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";

import type { ThirdwebClient } from "thirdweb";
import contracts from "@/contract/contracts.json";

const USDC_DECIMALS = 6;

const secretKey = process.env.THIRDWEB_SECRET_KEY;
const privateKey = process.env.THIRDWEB_AUTH_PRIVATE_KEY;

const serverClient: ThirdwebClient | null =
  secretKey && secretKey.length > 0
    ? createThirdwebClient({ secretKey })
    : null;

function getMintAccount() {
  if (!serverClient || !privateKey) return null;
  const key = privateKey.startsWith("0x")
    ? (privateKey as `0x${string}`)
    : (`0x${privateKey}` as `0x${string}`);
  return privateKeyToAccount({
    client: serverClient,
    privateKey: key,
  });
}

const contractsConfig = contracts as {
  contracts?: { usdc?: string };
  conventions?: { usdcDecimals?: number };
};

function toUnits(amountHuman: number, decimals: number): bigint {
  const scale = 10 ** decimals;
  return BigInt(Math.round(amountHuman * scale));
}

export type MintUsdcResult =
  | { success: true; transactionHash: string }
  | { success: false; error: string };

/**
 * Mint USDC to the given address. Uses THIRDWEB_AUTH_PRIVATE_KEY to sign.
 * Amount is in human units (e.g. 100 = 100 USDC).
 * Tries mint(address,uint256) then mintTo(address,uint256).
 */
export async function mintUsdcToAddress(
  toAddress: string,
  amountHuman: number | string
): Promise<MintUsdcResult> {
  const account = getMintAccount();
  if (!account) {
    return {
      success: false,
      error: "Mint not configured (THIRDWEB_SECRET_KEY or THIRDWEB_AUTH_PRIVATE_KEY missing).",
    };
  }

  const usdcAddress = contractsConfig.contracts?.usdc;
  if (!usdcAddress) {
    return { success: false, error: "USDC contract address not found." };
  }

  const amount =
    typeof amountHuman === "string" ? parseFloat(amountHuman) : amountHuman;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Invalid amount." };
  }

  const decimals =
    contractsConfig.conventions?.usdcDecimals ?? USDC_DECIMALS;
  const amountWei = toUnits(amount, decimals);

  const contract = getContract({
    client: serverClient!,
    chain: sepolia,
    address: usdcAddress as `0x${string}`,
  });

  const methods = [
    () =>
      prepareContractCall({
        contract,
        method: "function mint(address to, uint256 amount)",
        params: [toAddress as `0x${string}`, amountWei],
      }),
    () =>
      prepareContractCall({
        contract,
        method: "function mintTo(address to, uint256 amount)",
        params: [toAddress as `0x${string}`, amountWei],
      }),
  ] as const;

  for (const getTransaction of methods) {
    try {
      const transaction = getTransaction();
      const result = await sendTransaction({
        account,
        transaction,
      });
      const txHash =
        typeof result === "object" &&
          result !== null &&
          "transactionHash" in result
          ? (result as { transactionHash: string }).transactionHash
          : String(result);
      return { success: true, transactionHash: txHash };
    } catch {
      continue;
    }
  }

  return {
    success: false,
    error:
      "Mint reverted. Ensure the wallet (THIRDWEB_AUTH_PRIVATE_KEY) has minter role on the USDC contract, or the contract exposes mint(address,uint256) or mintTo(address,uint256).",
  };
}
