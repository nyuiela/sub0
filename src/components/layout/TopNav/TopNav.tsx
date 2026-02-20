"use client";

import Link from "next/link";
import { PrimaryTabs } from "@/components/layout/PrimaryTabs";
import { SearchBar } from "@/components/layout/SearchBar";
import { AccountBar } from "@/components/layout/AccountBar";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { FontSwitcher } from "@/components/FontSwitcher";
import { SizeSwitcher } from "@/components/SizeSwitcher";
import { WebSocketStatusIndicator } from "@/components/WebSocketStatus";

export function TopNav() {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <section className="mx-auto flex w-full h-fit flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 text-sm">
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold tracking-tight text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          Sub0
        </Link>
        <PrimaryTabs />
        <SearchBar />
        <AccountBar />
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-4">
          <span className="hidden border-l border-[var(--color-border)] pl-2 sm:inline" aria-hidden />
          <div className="hidden items-center gap-2 sm:flex">
            <ThemeSwitcher />
            <FontSwitcher />
            <SizeSwitcher />
            <WebSocketStatusIndicator />
          </div>
        </div>
      </section>
    </header>
  );
}
