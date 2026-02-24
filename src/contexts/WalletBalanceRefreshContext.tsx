"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface WalletBalanceRefreshContextValue {
  /** Increment to force header balance (e.g. ConnectButton) to refetch. */
  refreshKey: number;
  /** Call after a successful mint/transfer so the header balance updates. */
  refreshBalance: () => void;
}

const WalletBalanceRefreshContext = createContext<WalletBalanceRefreshContextValue | null>(null);

export function WalletBalanceRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshBalance = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);
  return (
    <WalletBalanceRefreshContext.Provider value={{ refreshKey, refreshBalance }}>
      {children}
    </WalletBalanceRefreshContext.Provider>
  );
}

export function useWalletBalanceRefresh(): WalletBalanceRefreshContextValue {
  const ctx = useContext(WalletBalanceRefreshContext);
  if (ctx == null) {
    return {
      refreshKey: 0,
      refreshBalance: () => {},
    };
  }
  return ctx;
}
