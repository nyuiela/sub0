/**
 * Block explorer URL helpers. TENDERLY_EXPLORER_URL may end with /transactions;
 * for a specific tx use base + /tx/{hash} (e.g. /tx/0x...).
 */

export const DEFAULT_BLOCK_EXPLORER_BASE = "https://sepolia.etherscan.io";

/** Effective base URL for tx links: env or Sepolia default. */
export function getEffectiveBlockExplorerBaseUrl(): string {
  const url =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL;
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (trimmed) return trimmed.replace(/\/transactions\/?$/i, "");
  return DEFAULT_BLOCK_EXPLORER_BASE;
}

/** Strip trailing /transactions so the URL is a base suitable for /tx/{hash}. */
export function getBlockExplorerBaseUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  return url.trim().replace(/\/transactions\/?$/i, "");
}

/** Build explorer link for a transaction hash. Uses base URL (no /transactions). When blockExplorerUrl is omitted, uses getEffectiveBlockExplorerBaseUrl() (Sepolia default). */
export function getBlockExplorerTxUrl(
  blockExplorerUrl: string | undefined,
  txHash: string
): string | undefined {
  const base =
    blockExplorerUrl !== undefined
      ? getBlockExplorerBaseUrl(blockExplorerUrl)
      : getEffectiveBlockExplorerBaseUrl();
  if (!base || !txHash?.trim()) return undefined;
  const hash = txHash.trim();
  if (!hash) return undefined;
  return `${base}/tx/${hash}`;
}
