"use client";

import {
  SETTINGS_SECTION_IDS,
  SETTINGS_SECTIONS,
  type SettingsSectionId,
  type SettingsViewId,
} from "@/types/settings.types";

function getActiveSectionId(viewId: SettingsViewId): SettingsSectionId | null {
  if (viewId == null) return null;
  if (SETTINGS_SECTION_IDS.includes(viewId as SettingsSectionId))
    return viewId as SettingsSectionId;
  if (typeof viewId === "string") return "agents";
  return null;
}

export interface SettingsSidebarProps {
  currentView: SettingsViewId;
  onSelectSection: (id: SettingsSectionId) => void;
  /** When true, render as compact sidebar (desktop). When false, render as full-width list (mobile). */
  variant: "sidebar" | "list";
}

export function SettingsSidebar({
  currentView,
  onSelectSection,
  variant,
}: SettingsSidebarProps) {
  const activeId = getActiveSectionId(currentView);

  const itemBaseSidebar =
    "flex w-full flex-col items-start gap-0.5 rounded-md border border-transparent px-3 py-2.5 text-left text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
  const itemBaseList =
    "flex w-full flex-col items-start gap-0.5 rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:bg-primary-muted/30 hover:border-primary/40";

  const isSidebar = variant === "sidebar";

  return (
    <aside
      className={
        isSidebar
          ? "flex min-h-0 w-full flex-1 flex-col overflow-auto border-r border-border bg-surface py-4 pl-6 pr-4"
          : "flex flex-1 flex-col gap-4 overflow-auto px-4 py-6"
      }
      aria-label="Settings navigation"
    >
      {isSidebar && (
        <h2 className="px-0 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Settings
        </h2>
      )}
      {!isSidebar && (
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
      )}
      <nav aria-label="Settings sections">
        <ul className="flex flex-col gap-1" role="list">
          {SETTINGS_SECTIONS.map((section) => {
            const isActive = activeId === section.id;
            const base = isSidebar ? itemBaseSidebar : itemBaseList;
            const activeClass = isActive
              ? "bg-primary-muted text-primary border-primary/30"
              : "hover:bg-primary-muted/20 hover:text-foreground text-muted";
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onSelectSection(section.id)}
                  className={`${base} ${activeClass}`}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Open ${section.label} settings`}
                >
                  <span className="font-medium">{section.label}</span>
                  <span className={isSidebar ? "text-xs" : "text-xs"}>
                    {section.description}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
