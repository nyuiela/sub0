"use client";

import type { AuthMethod } from "@/types/register.types";
import { AUTH_METHODS } from "@/types/register.types";

const LABELS: Record<AuthMethod, string> = {
  WALLET: "Wallet",
  SSO: "SSO",
  PASSKEY: "Passkey",
};

const DESCRIPTIONS: Record<AuthMethod, string> = {
  WALLET: "Connect and sign with your Web3 wallet.",
  SSO: "Sign in with a supported provider (coming soon).",
  PASSKEY: "Use device passkey (coming soon).",
};

export interface AuthMethodStepProps {
  value: AuthMethod | null;
  onChange: (method: AuthMethod) => void;
  onNext: () => void;
}

export function AuthMethodStep({ value, onChange, onNext }: AuthMethodStepProps) {
  return (
    <section
      className="flex flex-col items-center justify-center gap-8 px-4 py-12"
      aria-label="Choose authentication method"
    >
      <h2 className="text-center text-xl font-semibold text-[var(--reg-text)] sm:text-2xl">
        How do you want to sign in?
      </h2>
      <ul className="grid w-full max-w-lg gap-4 sm:grid-cols-3">
        {AUTH_METHODS.map((method) => (
          <li key={method}>
            <button
              type="button"
              onClick={() => onChange(method)}
              data-selected={value === method}
              disabled={method !== "WALLET"}
              className="register-glass register-card-interactive cursor-pointer w-full p-6 text-left disabled:opacity-60 disabled:cursor-not-allowed"
              aria-pressed={value === method}
              aria-label={`Select ${LABELS[method]}`}
            >
              <span className="font-medium text-[var(--reg-text)]">{LABELS[method]}</span>
              <p className="mt-2 text-sm text-[var(--reg-muted)]">
                {DESCRIPTIONS[method]}
              </p>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onNext}
        disabled={value !== "WALLET"}
        className="register-btn-primary cursor-pointer px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </section>
  );
}
