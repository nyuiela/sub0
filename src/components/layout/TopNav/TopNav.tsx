"use client";

import Link from "next/link";
import { PrimaryTabs } from "@/components/layout/PrimaryTabs";
import { SearchBar } from "@/components/layout/SearchBar";
import { AccountBar } from "@/components/layout/AccountBar";
import { AuthButton } from "@/components/auth";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface px-4">
      <section className="flex flex-wrap items-center gap-2 py-2 sm:gap-3 sm:py-1 w-full justify-between">
        <div className="flex items-center gap-4">

          <Link
            href="/"
            className="shrink-0 cursor-pointer text-lg font-semibold tracking-tight text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Sub0
          </Link>
          <PrimaryTabs />
        </div>

        <SearchBar />
        <div className="flex shrink-0 items-center gap-2">
          <AccountBar />
          <AuthButton />
        </div>
        {/* Theme/Font/Size/WebSocket controls commented out to simplify nav */}
      </section>
    </header>
  );
}
