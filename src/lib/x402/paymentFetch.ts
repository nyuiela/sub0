/**
 * Build a payment-enabled fetch for x402 (Base Sepolia or Base mainnet).
 * Uses the browser's injected provider (e.g. MetaMask) or a Thirdweb account.
 */

import { createWalletClient, custom } from "viem";
import { base, baseSepolia } from "viem/chains";
import { viemAdapter } from "thirdweb/adapters/viem";
import { base as baseChain, baseSepolia as baseSepoliaChain } from "thirdweb/chains";
import type { Account } from "thirdweb/wallets";
import { thirdwebClient } from "@/lib/thirdweb/client";

const BASE_SEPOLIA_CHAIN_ID = 84532;
const BASE_MAINNET_CHAIN_ID = 8453;

/** Max payment allowed by the client (USDC). Must be >= backend simulation price.*/
const MAX_PAYMENT_USDC = 500;
const MAX_PAYMENT_ATOMIC = BigInt(Math.floor(MAX_PAYMENT_USDC * 1e6));

interface EIP1193Like {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

function getProvider(): EIP1193Like | null | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & { ethereum?: EIP1193Like };
  return w.ethereum ?? null;
}

function chainForId(chainId: number) {
  if (chainId === BASE_MAINNET_CHAIN_ID) return base;
  return baseSepolia;
}

function chainToAddParams(chainId: number): { chainId: string; chainName: string; nativeCurrency: { name: string; symbol: string; decimals: number }; rpcUrls: string[]; blockExplorerUrls?: string[] } {
  const chain = chainForId(chainId);
  return {
    chainId: `0x${chain.id.toString(16)}`,
    chainName: chain.name,
    nativeCurrency: { name: chain.nativeCurrency.name, symbol: chain.nativeCurrency.symbol, decimals: chain.nativeCurrency.decimals },
    rpcUrls: [...chain.rpcUrls.default.http],
    blockExplorerUrls: chain.blockExplorers?.default?.url ? [chain.blockExplorers.default.url] : undefined,
  };
}

/**
 * Ensures the wallet is on the payment chain (Base Sepolia or Base). If not, prompts to add the chain and switch.
 * Call this before getPaymentFetch when payment is required so the user can pay on the correct network.
 * @param paymentChainId - Chain id (84532 Base Sepolia, 8453 Base mainnet).
 * @returns true if already on chain or user switched; false if no provider, user rejected, or switch failed.
 */
export async function ensurePaymentChain(paymentChainId: number): Promise<boolean> {
  const provider = getProvider();
  if (!provider || typeof (provider as EIP1193Like).request !== "function") return false;
  const req = (provider as EIP1193Like).request;
  try {
    const hexChainId = (await req({ method: "eth_chainId" })) as string | undefined;
    const current = hexChainId ? parseInt(hexChainId, 16) : 0;
    if (current === paymentChainId) return true;
    try {
      await req({ method: "wallet_switchEthereumChain", params: [{ chainId: `0x${paymentChainId.toString(16)}` }] });
      return true;
    } catch (switchErr: unknown) {
      const code = (switchErr as { code?: number })?.code;
      if (code === 4902) {
        await req({ method: "wallet_addEthereumChain", params: [chainToAddParams(paymentChainId)] });
        await req({ method: "wallet_switchEthereumChain", params: [{ chainId: `0x${paymentChainId.toString(16)}` }] });
        return true;
      }
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Human-readable name for the payment chain (for toasts).
 */
export function getPaymentChainName(chainId: number): string {
  if (chainId === BASE_MAINNET_CHAIN_ID) return "Base";
  if (chainId === BASE_SEPOLIA_CHAIN_ID) return "Base Sepolia";
  return `Chain ${chainId}`;
}

/**
 * Returns a fetch function that handles 402 by signing with the given Thirdweb account.
 * Use in the payment popup when the user has connected via Thirdweb (e.g. ConnectButton).
 * Call ensurePaymentChain(paymentChainId) first so the user is on the correct network.
 * @param account - Active account from useActiveAccount().
 * @param paymentChainId - Chain id for payment (84532 Base Sepolia, 8453 Base mainnet).
 */
export async function getPaymentFetchFromThirdwebAccount(
  account: Account,
  paymentChainId: number
): Promise<typeof fetch | null> {
  if (!thirdwebClient) return null;
  const chain =
    paymentChainId === BASE_MAINNET_CHAIN_ID ? baseChain : baseSepoliaChain;
  try {
    const x402 = await import("x402-fetch");
    const walletClient = viemAdapter.walletClient.toViem({
      account,
      client: thirdwebClient,
      chain,
    });
    type SignerArg = Parameters<typeof x402.wrapFetchWithPayment>[1];
    return x402.wrapFetchWithPayment(
      fetch,
      walletClient as SignerArg,
      MAX_PAYMENT_ATOMIC
    ) as typeof fetch;
  } catch {
    return null;
  }
}

/**
 * Returns a fetch function that handles 402 by signing payment with the connected wallet, or null if no provider.
 * Use for POST /api/simulate/start when the backend requires x402 payment.
 * Call ensurePaymentChain(paymentChainId) first so the user is on the correct network.
 * @param paymentChainId - Chain id for payment (84532 Base Sepolia, 8453 Base mainnet). Default 84532.
 */
export async function getPaymentFetch(
  paymentChainId: number = BASE_SEPOLIA_CHAIN_ID
): Promise<typeof fetch | null> {
  const provider = getProvider();
  if (!provider || typeof (provider as EIP1193Like).request !== "function") {
    return null;
  }
  try {
    const x402 = await import("x402-fetch");
    const client = createWalletClient({
      transport: custom(provider as import("viem").EIP1193Provider),
      chain: chainForId(paymentChainId),
    });
    type SignerArg = Parameters<typeof x402.wrapFetchWithPayment>[1];
    return x402.wrapFetchWithPayment(
      fetch,
      client as unknown as SignerArg,
      MAX_PAYMENT_ATOMIC
    ) as typeof fetch;
  } catch {
    return null;
  }
}

export function getPaymentChainId(): number {
  return BASE_SEPOLIA_CHAIN_ID;
}

/** USDC on payment chains (must match backend x402 config). */
const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

/** USDC contract address for the payment chain (for display in popup). */
export function getPaymentChainUsdcAddress(paymentChainId: number): string {
  return paymentChainId === BASE_MAINNET_CHAIN_ID ? USDC_BASE_MAINNET : USDC_BASE_SEPOLIA;
}

/**
 * Fetch USDC balance (atomic units) for an address on the payment chain.
 * Use before starting payment to show "Insufficient USDC" when balance is too low.
 */
export async function getPaymentChainUsdcBalance(
  address: string,
  paymentChainId: number
): Promise<bigint> {
  if (!thirdwebClient) return BigInt(0);
  const usdcAddress =
    paymentChainId === BASE_MAINNET_CHAIN_ID ? USDC_BASE_MAINNET : USDC_BASE_SEPOLIA;
  const chain =
    paymentChainId === BASE_MAINNET_CHAIN_ID ? baseChain : baseSepoliaChain;
  try {
    const { getContract } = await import("thirdweb");
    const { balanceOf } = await import("thirdweb/extensions/erc20");
    const contract = getContract({
      client: thirdwebClient,
      chain,
      address: usdcAddress as `0x${string}`,
    });
    const result = await balanceOf({
      contract,
      address: address as `0x${string}`,
    });
    return typeof result === "bigint" ? result : BigInt(String(result ?? 0));
  } catch {
    return BigInt(0);
  }
}

/**
 * Expected simulation cost in USDC (same formula as backend x402/pricing.ts).
 * Use to check user has enough USDC before payment.
 */
export function computeSimulatePriceUsdc(
  maxMarkets: number,
  durationMinutes: number
): number {
  const base = 0.5;
  const perMarket = 0.02;
  const perMinute = 0.02;
  return base + maxMarkets * perMarket + durationMinutes * perMinute;
}

export { BASE_SEPOLIA_CHAIN_ID, BASE_MAINNET_CHAIN_ID };
