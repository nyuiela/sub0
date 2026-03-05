import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="flex flex-1 flex-col items-center justify-center min-h-0 overflow-auto px-4 py-12"
      aria-labelledby="not-found-heading"
    >
      <section
        className="flex flex-col items-center gap-6 rounded-lg border border-border bg-surface px-8 py-10 max-w-md w-full text-center"
        aria-labelledby="not-found-heading"
      >
        <h1
          id="not-found-heading"
          className="text-4xl font-semibold tracking-tight text-foreground tabular-nums"
        >
          404
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-3 pt-2" aria-label="Navigation to main pages">
          <Link
            href="/"
            className="rounded-md border border-primary bg-transparent px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Markets
          </Link>
          <Link
            href="/tracker"
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Tracker
          </Link>
          <Link
            href="/trade"
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Trade
          </Link>
        </nav>
      </section>
    </main>
  );
}
