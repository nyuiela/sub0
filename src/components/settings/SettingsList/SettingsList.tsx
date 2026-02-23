"use client";

import type { SettingsSectionId } from "@/types/settings.types";
import { SETTINGS_SECTIONS } from "@/types/settings.types";

const itemBase =
  "flex w-full flex-col items-start gap-0.5 rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:bg-primary-muted/30 hover:border-primary/40";

export interface SettingsListProps {
  onSelectSection: (id: SettingsSectionId) => void;
}

export function SettingsList({
  onSelectSection,
}: SettingsListProps) {
  return (
    <section
      className="flex flex-1 flex-col gap-4 overflow-auto px-4 py-6"
      aria-label="Settings menu"
    >
      <h2 className="text-lg font-semibold text-foreground">
        Settings
      </h2>
      <ul className="flex flex-col gap-2" role="list">
        {SETTINGS_SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => onSelectSection(section.id)}
              className={itemBase}
              aria-label={`Open ${section.label} settings`}
            >
              <span className="text-sm font-medium text-foreground">
                {section.label}
              </span>
              <span className="text-xs text-muted">
                {section.description}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
