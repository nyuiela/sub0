/**
 * SDK claim API: GET claim info, POST claim (wallet binding).
 * Backend: GET/POST /api/sdk/claim/:claimCode
 */

function getBackendBase(): string {
  if (typeof window === "undefined") return "";
  return (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
}

export interface ClaimInfo {
  claim_code: string;
  status: "UNCLAIMED" | "CLAIMED";
  agent_name?: string;
}

export async function getClaimInfo(claimCode: string): Promise<ClaimInfo> {
  const base = getBackendBase();
  const url = `${base}/api/sdk/claim/${encodeURIComponent(claimCode)}`;
  const res = await fetch(url);
  const data = (await res.json().catch(() => ({}))) as ClaimInfo & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Claim info failed: ${res.status}`);
  return data;
}

export interface ClaimSubmitResult {
  success: boolean;
  agent_id?: string;
  user_id?: string;
}

export async function submitClaim(
  claimCode: string,
  params: { address: string; signature: string; message: string }
): Promise<ClaimSubmitResult> {
  const base = getBackendBase();
  const url = `${base}/api/sdk/claim/${encodeURIComponent(claimCode)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = (await res.json().catch(() => ({}))) as ClaimSubmitResult & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Claim failed: ${res.status}`);
  return data;
}
