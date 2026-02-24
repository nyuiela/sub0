"use client";

import Link from "next/link";
import {
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "@/types/settings.types";

export interface SettingsLayoutProps {
  children: React.ReactNode;
  sectionId: SettingsSectionId;
  onSelectSection: (id: SettingsSectionId) => void;
}

export function SettingsLayout({
  children,
  sectionId,
  onSelectSection,
}: SettingsLayoutProps) {
  return (
    <main
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:flex-row"
      aria-label="Settings"
    >
      <aside
        className="flex shrink-0 flex-col border-border/50 bg-surface/80 backdrop-blur-md md:w-64 md:border-r"
        style={{ borderLeftWidth: "1px", borderColor: "rgba(255,255,255,0.1)" }}
        aria-label="Settings navigation"
      >
        <header className="border-b border-border/50 px-4 py-4">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet focus-visible:ring-offset-2"
          >
            Back to app
          </Link>
          <h1 className="mt-2 text-lg font-semibold text-foreground">
            Settings
          </h1>
        </header>
        <nav className="flex-1 overflow-auto p-3" aria-label="Settings sections">
          <ul className="space-y-1" role="list">
            {SETTINGS_SECTIONS.map((section) => {
              const isActive = sectionId === section.id;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSection(section.id)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet focus-visible:ring-offset-2 ${
                      isActive
                        ? "border-accent-violet/40 bg-accent-violet/10 text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className="font-medium">{section.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {section.description}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <section
        className="flex min-h-0 flex-1 flex-col overflow-auto"
        aria-label="Settings content"
      >
        {children}
      </section>
    </main>
  );
}
