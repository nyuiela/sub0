"use client";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { FontSwitcher } from "@/components/FontSwitcher";
import { WebSocketStatusIndicator } from "@/components/WebSocketStatus";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <section className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Sub0
        </h1>
        <nav className="flex flex-wrap items-center gap-4">
          <ThemeSwitcher />
          <FontSwitcher />
          <WebSocketStatusIndicator />
        </nav>
      </section>
    </header>
  );
}
