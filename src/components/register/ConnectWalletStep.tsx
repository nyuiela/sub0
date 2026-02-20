"use client";

import { useState } from "react";
import { ConnectButton } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb/client";
import {
  generatePayload,
  isLoggedIn as checkLoggedIn,
  login as doLoginAction,
  logout as doLogoutAction,
} from "@/app/actions/auth";

export interface ConnectWalletStepProps {
  onNext: () => void;
}

export function ConnectWalletStep({ onNext }: ConnectWalletStepProps) {
  const [error, setError] = useState<string | null>(null);

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
        <h2 className="text-center text-xl font-semibold text-[var(--reg-text)] sm:text-2xl">
          Connect your wallet
        </h2>
        <p className="text-center text-sm text-[var(--reg-muted)]">
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
        <h2 className="text-xl font-semibold text-[var(--reg-text)] sm:text-2xl">
          Connect your wallet
        </h2>
        <p className="mt-2 text-sm text-[var(--reg-muted)]">
          Sign in with your Web3 wallet to continue registration.
        </p>
      </header>
      <div className="register-glass flex flex-col items-center gap-6 rounded-xl px-8 py-10">
        <ConnectButton
          client={thirdwebClient}
          connectButton={{
            label: "Connect wallet",
            className:
              "register-btn-primary cursor-pointer px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed",
          }}
          connectModal={{
            title: "Connect wallet",
            size: "wide",
            showThirdwebBranding: false,
          }}
          signInButton={{
            label: "Sign in",
            className:
              "register-btn-primary cursor-pointer px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed",
          }}
          theme="dark"
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
          className="register-btn-primary cursor-pointer px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
      {error && (
        <p className="text-center text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
