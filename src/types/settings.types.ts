/**
 * Settings page section identifiers.
 * Used for in-page navigation: Profile, Agent Studio, Vault & Funds, Developer API.
 */

export const SETTINGS_SECTION_IDS = [
  "profile",
  "agent-studio",
  "claim-agent",
  "vault",
  "developer-api",
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

/** Section id for main list (no sub-view). Agent edit uses agent id string. */
export type SettingsViewId = null | SettingsSectionId | string;

export interface SettingsSectionItem {
  id: SettingsSectionId;
  label: string;
  description: string;
}

export const SETTINGS_SECTIONS: SettingsSectionItem[] = [
  { id: "profile", label: "Profile", description: "Global profile and account" },
  { id: "agent-studio", label: "Agent Studio", description: "Configure AI trading agents" },
  { id: "claim-agent", label: "Claim external agent", description: "BYOA: link an external agent to your wallet" },
  { id: "vault", label: "Vault & Funds", description: "USDC balance and deposits" },
  { id: "developer-api", label: "Developer API", description: "API keys and integration" },
];
