"use client";

import Link from "next/link";

export function ClaimAgentTab() {
  return (
    <div className="p-4">
      <p className="text-sm text-muted-foreground">
        External agents (BYOA) are registered outside the app. When you receive
        a claim code, use it to bind that agent to your wallet and account so
        you can manage and fund it here.
      </p>
      <Link
        href="/claim"
        className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Enter claim code
      </Link>
    </div>
  );
}
