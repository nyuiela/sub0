"use client";

export function WalletsSection() {
  return (
    <section
      className="flex flex-1 flex-col gap-6 overflow-auto px-4 py-6"
      aria-label="Wallets settings content"
    >
      <article className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium text-foreground">Linked wallets</h3>
        <p className="mt-2 text-sm text-muted">
          Wallet connections are managed via the connect button in the app
          header. Use it to connect, switch, or disconnect wallets. Only one
          wallet is linked to your account at a time.
        </p>
      </article>
    </section>
  );
}
