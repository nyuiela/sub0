"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletBalanceRefreshProvider } from "@/contexts/WalletBalanceRefreshContext";
import { ReduxProvider } from "./ReduxProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ThirdwebProvider } from "@/components/auth";
import { WebSocketConnector } from "@/components/WebSocketConnector";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <ThirdwebProvider>
        <AuthProvider>
        <WalletBalanceRefreshProvider>
          <ThemeProvider>
            <WebSocketConnector />
            {children}
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </WalletBalanceRefreshProvider>
        </AuthProvider>
      </ThirdwebProvider>
    </ReduxProvider>
  );
}
