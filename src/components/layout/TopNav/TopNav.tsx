"use client";

import Link from "next/link";
import { PrimaryTabs } from "@/components/layout/PrimaryTabs";
import { SearchBar } from "@/components/layout/SearchBar";
import { AccountBar } from "@/components/layout/AccountBar";
import { AuthButton } from "@/components/auth";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuth } from "@/contexts/AuthContext";

export function TopNav() {
  const { user, loading } = useAuth();
  const isRegistered =
    loading ? null : user != null && (user.id != null || user.address != null);
  const showRegister = isRegistered === false;

  return (
    <header className="sticky top-0 z-40 bg-surface px-4">
      <section className="flex flex-wrap items-center gap-2 py-2 sm:gap-3 sm:py-1 w-full justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="shrink-0 cursor-pointer text-lg font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Sub0
          </Link>
          <PrimaryTabs isRegistered={isRegistered !== false} />
        </div>

        <SearchBar />
        <div className="flex shrink-0 items-center gap-2">
          <ThemeSwitcher />
          <AccountBar />
          {showRegister && (
            <Link
              href="/register"
              className="rounded-md border border-primary bg-transparent px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Register
            </Link>
          )}
          <AuthButton />
        </div>
      </section>
    </header>
  );
}
