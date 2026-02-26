"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ClaimEntryPage() {
  const router = useRouter();
  const [claimCode, setClaimCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = claimCode.trim();
    if (!trimmed) {
      setError("Enter a claim code.");
      return;
    }
    setError(null);
    router.push(`/claim/${encodeURIComponent(trimmed)}`);
  }

  return (
    <main
      className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-12"
      aria-label="Claim external agent"
    >
      <section
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm"
        aria-labelledby="claim-heading"
      >
        <h1 id="claim-heading" className="text-xl font-semibold text-foreground">
          Claim external agent
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bring your own agent (BYOA): if you have a claim code from an external
          agent registration, enter it below to link the agent to your wallet
          and account.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label htmlFor="claim-code" className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Claim code
            </span>
            <input
              id="claim-code"
              type="text"
              value={claimCode}
              onChange={(e) => {
                setClaimCode(e.target.value);
                setError(null);
              }}
              placeholder="e.g. abc-def-123"
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              aria-invalid={error != null}
              aria-describedby={error ? "claim-error" : undefined}
            />
          </label>
          {error != null && (
            <p id="claim-error" className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Continue to claim
            </button>
            <Link
              href="/"
              className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Back to app
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
