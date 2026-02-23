"use client";

export function AccountSection() {
  return (
    <section
      className="flex flex-1 flex-col gap-6 overflow-auto px-4 py-6"
      aria-label="Account settings content"
    >
      <article className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium text-foreground">Profile</h3>
        <p className="mt-2 text-sm text-muted">
          Your wallet connection and profile are managed from the header. Connect
          or disconnect your wallet there to update your account.
        </p>
      </article>
      <article className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium text-foreground">Account management</h3>
        <p className="mt-2 text-sm text-muted">
          Username and auth method are set during registration. Changes require
          re-authentication.
        </p>
      </article>
    </section>
  );
}
