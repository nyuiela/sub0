"use client";

import { ReduxProvider } from "./ReduxProvider";
import { ThemeProvider } from "./ThemeProvider";
import { WebSocketConnector } from "@/components/WebSocketConnector";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <ThemeProvider>
        <WebSocketConnector />
        {children}
      </ThemeProvider>
    </ReduxProvider>
  );
}
