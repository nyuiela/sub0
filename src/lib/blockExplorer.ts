/**
 * Block explorer URL helpers. TENDERLY_EXPLORER_URL may end with /transactions;
 * for a specific tx use base + /tx/{hash} (e.g. /tx/0x...).
 */

/** Strip trailing /transactions so the URL is a base suitable for /tx/{hash}. */
export function getBlockExplorerBaseUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  return url.trim().replace(/\/transactions\/?$/i, "");
}

/** Build explorer link for a transaction hash. Uses base URL (no /transactions). */
export function getBlockExplorerTxUrl(
  blockExplorerUrl: string | undefined,
  txHash: string
): string | undefined {
  const base = getBlockExplorerBaseUrl(blockExplorerUrl);
  if (!base || !txHash?.trim()) return undefined;
  const hash = txHash.trim();
  if (!hash) return undefined;
  return `${base}/tx/${hash}`;
}
