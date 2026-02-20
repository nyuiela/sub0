"use client";

import { ConnectButton } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb/client";
import {
  generatePayload,
  isLoggedIn as checkLoggedIn,
  login as doLoginAction,
  logout as doLogoutAction,
} from "@/app/actions/auth";

export function AuthButton() {
  if (!thirdwebClient) {
    return (
      <span className="text-xs text-[var(--color-text-muted)]">
        Set NEXT_PUBLIC_THIRDWEB_CLIENT_ID to enable sign-in
      </span>
    );
  }

  return (
    <ConnectButton
      client={thirdwebClient}
      auth={{
        isLoggedIn: async () => {
          const loggedIn = await checkLoggedIn();
          return loggedIn;
        },
        doLogin: async (params) => {
          const result = await doLoginAction({
            payload: params.payload,
            signature: params.signature,
          });
          if (!result.success) {
            throw new Error("Login failed");
          }
        },
        getLoginPayload: async ({ address }) => {
          return generatePayload({ address });
        },
        doLogout: async () => {
          await doLogoutAction();
        },
      }}
    />
  );
}
