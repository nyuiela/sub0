"use client";

import { useState, useCallback } from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { AgentStudioForm } from "@/components/settings/AgentStudioForm";
import { VaultTab } from "@/components/settings/VaultTab";
import { DeveloperApiTab } from "@/components/settings/DeveloperApiTab";
import { AgentEditSection } from "@/components/settings/AgentEditSection";
import {
  SETTINGS_SECTIONS,
  type SettingsSectionId,
  type SettingsViewId,
} from "@/types/settings.types";

function getSectionTitle(viewId: SettingsViewId): string {
  if (viewId == null) return "Settings";
  const section = SETTINGS_SECTIONS.find((s) => s.id === viewId);
  if (section) return section.label;
  return "Agent";
}

function isAgentEditView(viewId: SettingsViewId): boolean {
  if (viewId == null) return false;
  if (SETTINGS_SECTIONS.some((s) => s.id === viewId)) return false;
  return typeof viewId === "string" && viewId.length > 0;
}

export function SettingsView() {
  const [currentView, setCurrentView] = useState<SettingsViewId>("profile");

  const handleBack = useCallback(() => {
    setCurrentView((prev) => {
      if (isAgentEditView(prev)) return "agent-studio";
      return null;
    });
  }, []);

  const handleSelectSection = useCallback((id: SettingsSectionId) => {
    setCurrentView(id);
  }, []);

  const handleSelectAgent = useCallback((agentId: string) => {
    setCurrentView(agentId);
  }, []);

  const showBack = currentView != null;

  return (
    <main
      className="flex h-full min-h-0 flex-col overflow-hidden bg-background md:flex-row"
      aria-label="Settings"
    >
      {/* Desktop: sidebar (~35% wider). Mobile: list only when no section selected. */}
      <div className="hidden md:flex md:h-full md:w-72 md:shrink-0">
        <SettingsSidebar
          currentView={currentView}
          onSelectSection={handleSelectSection}
          variant="sidebar"
        />
      </div>
      {currentView == null && (
        <div className="flex flex-1 flex-col md:hidden">
          <SettingsSidebar
            currentView={currentView}
            onSelectSection={handleSelectSection}
            variant="list"
          />
        </div>
      )}

      {/* Content: show only when a section or agent is selected (default is account). */}
      {currentView != null && (
      <section
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        aria-label="Settings content"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
          {showBack && (
            <span className="md:hidden">
              <button
                type="button"
                onClick={handleBack}
                className="flex shrink-0 items-center justify-center rounded-md p-2 text-muted transition-colors hover:bg-primary-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Back to settings"
              >
                <img
                  src="/icons/chevron-left.svg"
                  width={24}
                  height={24}
                  alt=""
                  aria-hidden
                  className="shrink-0"
                />
              </button>
            </span>
          )}
          <h1 className="text-lg font-semibold text-foreground">
            {getSectionTitle(currentView)}
          </h1>
        </header>

          {currentView === "profile" && <ProfileTab />}
          {currentView === "agent-studio" && <AgentStudioForm />}
          {currentView === "vault" && <VaultTab />}
          {currentView === "developer-api" && <DeveloperApiTab />}

          {isAgentEditView(currentView) && (
            <AgentEditSection agentId={currentView} />
          )}
        </section>
      )}
    </main>
  );
}
