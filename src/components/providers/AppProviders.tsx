"use client";

import { ReduxProvider } from "./ReduxProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ThirdwebProvider } from "@/components/auth";
import { WebSocketConnector } from "@/components/WebSocketConnector";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <ThirdwebProvider>
        <ThemeProvider>
          <WebSocketConnector />
          {children}
        </ThemeProvider>
      </ThirdwebProvider>
    </ReduxProvider>
  );
}
