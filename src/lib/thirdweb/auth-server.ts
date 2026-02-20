/**
 * thirdweb Auth (SIWE) – server-only. Used by server actions.
 * Requires THIRDWEB_SECRET_KEY and THIRDWEB_AUTH_PRIVATE_KEY in env.
 * @see https://portal.thirdweb.com/typescript/v5/auth
 */

import { createAuth } from "thirdweb/auth";
import { createThirdwebClient } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";

const secretKey = process.env.THIRDWEB_SECRET_KEY;
const privateKey = process.env.THIRDWEB_AUTH_PRIVATE_KEY;
const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";

if (!secretKey) {
  console.warn("THIRDWEB_SECRET_KEY is not set; auth will not work.");
}
if (!privateKey) {
  console.warn("THIRDWEB_AUTH_PRIVATE_KEY is not set; auth will not work.");
}

const serverClient = createThirdwebClient({
  secretKey: secretKey ?? "",
});

const adminAccount = privateKeyToAccount({
  client: serverClient,
  privateKey: (privateKey ?? "0x0000000000000000000000000000000000000000000000000000000000000001") as `0x${string}`,
});

export const thirdwebAuth = createAuth({
  domain,
  client: serverClient,
  adminAccount,
});
