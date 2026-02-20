"use client";

const FOOTER_LINKS = [
  { label: "Markets", href: "#" },
  { label: "Account", href: "#" },
  { label: "X Tracker", href: "#" },
  { label: "Wallet Tracker", href: "#" },
  { label: "Telegram Tracker", href: "#" },
  { label: "Season 1", href: "#" },
  { label: "App", href: "#" },
  { label: "Invite", href: "#" },
  { label: "Events", href: "#" },
];

export function BottomNav() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <nav
        className="mx-auto flex max-w-[1600px] flex-wrap justify-center gap-2 px-4 py-3 sm:justify-start sm:gap-4 sm:px-6"
        aria-label="Secondary navigation"
      >
        {FOOTER_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="cursor-pointer text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            {label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
