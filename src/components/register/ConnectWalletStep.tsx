"use client";

import { useState } from "react";
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

export interface ConnectWalletStepProps {
  onNext: () => void;
}

const connectBtnClass =
  "!rounded-lg !bg-primary !px-8 !py-4 !text-lg !font-semibold !text-white !shadow-sm !transition-opacity hover:!opacity-90 focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-primary disabled:!opacity-50 disabled:!cursor-not-allowed";

const signInBtnClass =
  "!rounded-lg !bg-primary !px-6 !py-3 !text-sm !font-medium !text-white !transition-opacity hover:!opacity-90 disabled:!opacity-50 disabled:!cursor-not-allowed";

export function ConnectWalletStep({ onNext }: ConnectWalletStepProps) {
  const [error, setError] = useState<string | null>(null);
  const themeId = useAppSelector((state) => state.theme.themeId);

  const handleContinue = async () => {
    setError(null);
    const loggedIn = await checkLoggedIn();
    if (loggedIn) {
      onNext();
    } else {
      setError("Please connect your wallet and sign in to continue.");
    }
  };

  if (!thirdwebClient) {
    return (
      <section
        className="flex flex-col items-center justify-center gap-6 px-4 py-12"
        aria-label="Connect wallet"
      >
        <h2 className="text-center text-xl font-semibold text-foreground sm:text-2xl">
          Connect your wallet
        </h2>
        <p className="text-center text-sm text-muted">
          Set NEXT_PUBLIC_THIRDWEB_CLIENT_ID in your environment to enable sign-in.
        </p>
      </section>
    );
  }

  return (
    <section
      className="flex flex-col items-center justify-center gap-8 px-4 py-12"
      aria-label="Connect wallet to sign in"
    >
      <header className="text-center">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
          Connect your wallet
        </h2>
        <p className="mt-2 text-sm text-muted">
          Sign in with your Web3 wallet to continue registration.
        </p>
      </header>
      <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-surface px-8 py-10 shadow-sm">
        <ConnectButton
          client={thirdwebClient}
          theme={getConnectTheme(themeId)}
          connectButton={{
            label: "Connect wallet",
            className: connectBtnClass,
          }}
          connectModal={{
            title: "Connect wallet",
            size: "wide",
            showThirdwebBranding: false,
          }}
          signInButton={{
            label: "Sign in",
            className: signInBtnClass,
          }}
          auth={{
            isLoggedIn: async () => checkLoggedIn(),
            doLogin: async (params) => {
              const result = await doLoginAction({
                payload: params.payload,
                signature: params.signature,
              });
              if (!result.success) {
                throw new Error("Login failed");
              }
            },
            getLoginPayload: async ({ address }) => generatePayload({ address }),
            doLogout: async () => {
              await doLogoutAction();
            },
          }}
        />
        <button
          type="button"
          onClick={handleContinue}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
      {error && (
        <p className="text-center text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
