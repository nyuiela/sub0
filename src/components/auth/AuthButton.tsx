"use client";

import { useRouter } from "next/navigation";
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

type SessionResponse = { loggedIn: boolean; registered?: boolean };

const BUTTON_HEIGHT = "2.25rem";
const BUTTON_PADDING = "0.5rem 0.75rem";
const BUTTON_FONT_SIZE = "0.875rem";

const connectButtonStyle: React.CSSProperties = {
  height: BUTTON_HEIGHT,
  minWidth: "unset",
  padding: BUTTON_PADDING,
  fontSize: BUTTON_FONT_SIZE,
};

const connectButtonClassName =
  "rounded-md border border-transparent bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const detailsButtonClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

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
        className: connectButtonClassName,
        style: connectButtonStyle,
      }}
      detailsButton={{
        className: detailsButtonClassName,
        style: connectButtonStyle,
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
          // const sessionRes = await fetch("/api/auth/session", {
          //   credentials: "include",
          // });
          // const data = (await sessionRes.json()) as SessionResponse;
          // if (data.loggedIn === true && data.registered === false) {
          //   router.replace("/register");
          // }
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
