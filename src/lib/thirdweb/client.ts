/**
 * thirdweb client for browser (ConnectButton, wallet connection).
 * Use clientId from dashboard; never expose secret key on the client.
 * @see https://portal.thirdweb.com/typescript/v5/getting-started
 */

import { createThirdwebClient } from "thirdweb";
import type { ThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ?? "";

export const thirdwebClient: ThirdwebClient | null = clientId
  ? createThirdwebClient({ clientId })
  : null;
