/**
 * EIP-712 UserTrade typed data for order signing.
 * Contract: USER_TRADE_TYPEHASH = keccak256(
 *   "UserTrade(bytes32 marketId,uint256 outcomeIndex,bool buy,uint256 quantity,uint256 maxCostUsdc,uint256 nonce,uint256 deadline)"
 * )
 */

import contractsData from "@/contract/contracts.json";
import { USDC_DECIMALS, OUTCOME_TOKEN_DECIMALS } from "@/lib/formatNumbers";

type ContractsJson = {
  chainId?: number;
  contracts?: { predictionVault?: string };
  eip712?: { domainName?: string; domainVersion?: string };
};

const CONTRACTS = contractsData as ContractsJson;
const CHAIN_ID = CONTRACTS.chainId ?? 84532;
const VERIFYING_CONTRACT = CONTRACTS.contracts?.predictionVault as `0x${string}` | undefined;
const DOMAIN_NAME = CONTRACTS.eip712?.domainName ?? "Sub0PredictionVault";
const DOMAIN_VERSION = CONTRACTS.eip712?.domainVersion ?? "1";

/** UUID string to bytes32 (32 hex chars = 16 bytes, left-pad with zeros to 32 bytes = 64 hex). */
function uuidToBytes32(uuid: string): `0x${string}` {
  const hex = uuid.replace(/-/g, "").toLowerCase();
  if (hex.length !== 32) return `0x${"0".repeat(64)}` as `0x${string}`;
  return (`0x${"0".repeat(32)}${hex}`) as `0x${string}`;
}

export interface UserTradeMessage {
  marketId: `0x${string}`;
  outcomeIndex: bigint;
  buy: boolean;
  quantity: bigint;
  maxCostUsdc: bigint;
  nonce: bigint;
  deadline: bigint;
}

export interface UserTradeTypedData {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: `0x${string}`;
  };
  types: {
    UserTrade: Array<{ name: string; type: string }>;
  };
  primaryType: "UserTrade";
  message: UserTradeMessage;
}

/** Build EIP-712 typed data for UserTrade. Quantities and maxCostUsdc are in human form; converted to raw (6 decimals) inside. */
export function buildUserTradeTypedData(params: {
  marketId: string;
  outcomeIndex: number;
  buy: boolean;
  quantity: string | number;
  maxCostUsdc: string | number;
  nonce: string | number | bigint;
  deadline: number;
}): UserTradeTypedData {
  const q = Number(params.quantity);
  const cost = Number(params.maxCostUsdc);
  const quantityRaw = BigInt(Math.floor(q * 10 ** OUTCOME_TOKEN_DECIMALS));
  const maxCostUsdcRaw = BigInt(Math.floor(cost * 10 ** USDC_DECIMALS));
  const nonceBig = typeof params.nonce === "bigint" ? params.nonce : BigInt(String(params.nonce));
  return {
    domain: {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      chainId: CHAIN_ID,
      verifyingContract: VERIFYING_CONTRACT ?? ("0x0000000000000000000000000000000000000000" as `0x${string}`),
    },
    types: {
      UserTrade: [
        { name: "marketId", type: "bytes32" },
        { name: "outcomeIndex", type: "uint256" },
        { name: "buy", type: "bool" },
        { name: "quantity", type: "uint256" },
        { name: "maxCostUsdc", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "UserTrade",
    message: {
      marketId: uuidToBytes32(params.marketId),
      outcomeIndex: BigInt(params.outcomeIndex),
      buy: params.buy,
      quantity: quantityRaw,
      maxCostUsdc: maxCostUsdcRaw,
      nonce: nonceBig,
      deadline: BigInt(params.deadline),
    },
  };
}

/** Serialize typed data for eth_signTypedData_v4 (message values as hex/decimal strings). */
export function serializeTypedDataForSigning(data: UserTradeTypedData): Record<string, unknown> {
  const msg = data.message;
  return {
    domain: data.domain,
    types: data.types,
    primaryType: data.primaryType,
    message: {
      marketId: msg.marketId,
      outcomeIndex: msg.outcomeIndex.toString(),
      buy: msg.buy,
      quantity: msg.quantity.toString(),
      maxCostUsdc: msg.maxCostUsdc.toString(),
      nonce: msg.nonce.toString(),
      deadline: msg.deadline.toString(),
    },
  };
}

/** EIP-1193 provider type for signing. */
export type EIP1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

/**
 * Request EIP-712 signature from the given provider (e.g. window.ethereum).
 * Returns 0x-prefixed signature string.
 */
export async function signUserTradeTypedData(
  provider: EIP1193Provider,
  address: string,
  typedData: Record<string, unknown>
): Promise<string> {
  const result = await provider.request({
    method: "eth_signTypedData_v4",
    params: [address, JSON.stringify(typedData)],
  });
  return typeof result === "string" ? result : "";
}

/** Default deadline: 5 minutes from now (unix seconds). */
export function defaultDeadline(): number {
  return Math.floor(Date.now() / 1000) + 300;
}
