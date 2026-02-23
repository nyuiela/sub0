/**
 * Settings page section identifiers.
 * Used for in-page navigation between main list and section views.
 */

export const SETTINGS_SECTION_IDS = [
  "account",
  "wallets",
  "agents",
  "templates",
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

/** Section id for "main list" (no sub-view). Agent edit uses agent id string. */
export type SettingsViewId = null | SettingsSectionId | string;

export interface SettingsSectionItem {
  id: SettingsSectionId;
  label: string;
  description: string;
}

export const SETTINGS_SECTIONS: SettingsSectionItem[] = [
  { id: "account", label: "Account", description: "Profile and account management" },
  { id: "wallets", label: "Wallets", description: "Linked wallets and connections" },
  { id: "agents", label: "Agents", description: "Agents you created or linked" },
  { id: "templates", label: "Agent templates", description: "Templates and skills for agents" },
];
