"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getCurrentUser } from "@/lib/api/auth";
import type { CurrentUserResponse } from "@/types/settings.api.types";

interface AuthContextValue {
  user: CurrentUserResponse | null;
  loading: boolean;
  error: boolean;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const u = await getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((u) => {
        if (!cancelled) {
          setUser(u);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    refetch: fetchUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    return {
      user: null,
      loading: true,
      error: false,
      refetch: async () => {},
    };
  }
  return ctx;
}
