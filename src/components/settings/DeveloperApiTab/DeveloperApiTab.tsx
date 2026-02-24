"use client";

export function DeveloperApiTab() {
  return (
    <section className="flex flex-col gap-6 p-4" aria-labelledby="developer-api-heading">
      <header id="developer-api-heading">
        <h2 className="text-lg font-semibold text-foreground">Developer API</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          API keys and integration settings.
        </p>
      </header>
      <article
        className="rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
      >
        <p className="text-sm text-muted-foreground">
          API key management and documentation will be available here.
        </p>
      </article>
    </section>
  );
}
