"use server";

import { getSession } from "@/app/actions/auth";
import { mintUsdcToAddress } from "@/lib/thirdweb/mint-usdc-server";

const AUTH_ERROR = "Sign in with your wallet to receive test USDC.";

export type MintUsdcActionResult =
  | { success: true; transactionHash: string }
  | { success: false; error: string };

/**
 * Mints test USDC to the currently logged-in user's wallet address.
 * Uses THIRDWEB_AUTH_PRIVATE_KEY on the server. Amount in USDC (e.g. 100 = 100 USDC).
 */
export async function mintUsdcForCurrentUser(
  amount: number | string = 100
): Promise<MintUsdcActionResult> {
  const session = await getSession();
  if (!session?.address) {
    return { success: false, error: AUTH_ERROR };
  }
  return mintUsdcToAddress(session.address, amount);
}
