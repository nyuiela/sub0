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
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api/auth";
import { getDiceBearAvatarUrl } from "@/lib/avatar";
import { baseSepolia } from "thirdweb/chains";
import { contracts } from "@/contract/contracts.json";

type SessionResponse = { loggedIn: boolean; registered?: boolean };

const BUTTON_HEIGHT = "2.25rem";
const BUTTON_PADDING = "0.5rem 0.75rem";
const BUTTON_FONT_SIZE = "0.875rem";

const connectButtonStyle: React.CSSProperties = {
  height: BUTTON_HEIGHT,
  minWidth: "unset",
  padding: BUTTON_PADDING,
  fontSize: BUTTON_FONT_SIZE,
  border: "none",
};

const connectButtonClassName =
  "rounded-md border border-transparent bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const detailsButtonClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

type User = {
  id: string;
  address: string;
  email: string;
  username: string;
  imageUrl: string | null;
  authMethod: "WALLET" | "SSO" | "PASSKEY";
  totalVolume: string;
  pnl: string;
  createdAt: string;
  updatedAt: string;
  agents: {
    id: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
  }[];

};
export function AuthButton() {
  const themeId = useAppSelector((state) => state.theme.themeId);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        console.log("user", user);
        if (!cancelled) setUser(user as User);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      chain={baseSepolia}
      detailsButton={{
        className: detailsButtonClassName,
        style: connectButtonStyle,
        connectedAccountAvatarUrl: user?.imageUrl ? user.imageUrl : getDiceBearAvatarUrl(user?.address ?? "", "adventurer"),
        connectedAccountName: user?.username ?? "",
        // showBalanceInFiat: "USD",
        displayBalanceToken: {
          [baseSepolia.id]: contracts.usdc,
        } as Record<string, string>,

      }}
      connectModal={{
        title: "Connect wallet",
        size: "compact",
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
