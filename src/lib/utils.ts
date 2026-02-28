/** Convert string to integer string for BigInt. Decimals (e.g. "22.6") are expanded by 10^decimals; no decimals = truncate. */
export function toIntegerString(s: string, decimals?: number): string {
  const t = String(s ?? "").trim();
  if (!t) return "0";
  if (!t.includes(".")) return t;
  if (decimals === undefined || decimals <= 0) {
    const part = t.split(".")[0];
    return part ?? "0";
  }
  const [whole = "0", frac = ""] = t.split(".");
  const padded = frac.padEnd(decimals, "0").slice(0, decimals);
  return (BigInt(whole) * (BigInt(10) ** BigInt(decimals)) + BigInt(padded || "0")).toString();
}
