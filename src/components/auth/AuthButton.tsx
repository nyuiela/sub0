"use client";

import { ConnectButton } from "thirdweb/react";
import { useAppSelector } from "@/store/hooks";
import { thirdwebClient } from "@/lib/thirdweb/client";
import { getConnectTheme } from "@/lib/thirdweb/connect-theme";
import {
  generatePayload,
  isLoggedIn as checkLoggedIn,
  login as doLoginAction,
  logout as doLogoutAction,
} from "@/app/actions/auth";

const connectButtonClass =
  "!rounded-md !border !border-border !bg-surface !px-3 !py-2 !text-sm !font-medium !text-foreground !transition-colors duration-200 hover:!bg-primary-muted hover:!text-foreground focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-primary focus-visible:!ring-offset-2";

const connectLabelClass =
  "!rounded-md !border !border-transparent !bg-primary !px-3 !py-2 !text-sm !font-medium !text-white !shadow-sm !transition-opacity hover:!opacity-90 focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-primary focus-visible:!ring-offset-2";

export function AuthButton() {
  const themeId = useAppSelector((state) => state.theme.themeId);

  if (!thirdwebClient) {
    return (
      <span className="text-xs text-muted">
        Set NEXT_PUBLIC_THIRDWEB_CLIENT_ID to enable sign-in
      </span>
    );
  }

  return (
    <ConnectButton
      client={thirdwebClient}
      theme={getConnectTheme(themeId)}
      connectButton={{
        label: "Connect",
        className: connectLabelClass,
      }}
      detailsButton={{
        className: connectButtonClass,
      }}
      connectModal={{
        title: "Connect wallet",
        size: "wide",
        showThirdwebBranding: false,
      }}
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
