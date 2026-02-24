/**
 * Response types for settings API (profile, vault), auth/me.
 * Auth: JWT/session only (credentials: include).
 */

/** GET /api/auth/me – current user from JWT. */
export interface CurrentUserResponse {
  id?: string;
  address?: string;
  userId?: string;
  username?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

export interface ProfileResponse {
  username: string | null;
  email: string | null;
  globalPnl: string;
  totalVolume: string;
}

export interface ProfilePatchBody {
  username?: string | null;
  email?: string | null;
}

export interface VaultBalanceResponse {
  balance: string;
}

export interface VaultDepositBody {
  amount: string;
}

export interface VaultWithdrawBody {
  amount: string;
}

export interface VaultActionResponse {
  success: boolean;
  balance: string;
}
