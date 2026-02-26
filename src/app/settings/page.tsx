"use client";

import { useState, useCallback } from "react";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { AgentStudioForm } from "@/components/settings/AgentStudioForm";
import { VaultTab } from "@/components/settings/VaultTab";
import { DeveloperApiTab } from "@/components/settings/DeveloperApiTab";
import { ClaimAgentTab } from "@/components/settings/ClaimAgentTab/ClaimAgentTab";
import {
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "@/types/settings.types";

function SettingsContent({ sectionId }: { sectionId: SettingsSectionId }) {
  const section = SETTINGS_SECTIONS.find((s) => s.id === sectionId);
  const title = section?.label ?? "Settings";

  return (
    <>
      <header className="shrink-0 border-b border-border/50 bg-surface/80 px-4 py-4 backdrop-blur-md">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {section?.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {section.description}
          </p>
        )}
      </header>
      <div className="flex-1 overflow-auto">
        {sectionId === "profile" && <ProfileTab />}
        {sectionId === "agent-studio" && <AgentStudioForm />}
        {sectionId === "claim-agent" && <ClaimAgentTab />}
        {sectionId === "vault" && <VaultTab />}
        {sectionId === "developer-api" && <DeveloperApiTab />}
      </div>
    </>
  );
}

export default function SettingsPage() {
  const [sectionId, setSectionId] = useState<SettingsSectionId>("profile");
  const handleSelectSection = useCallback((id: SettingsSectionId) => {
    setSectionId(id);
  }, []);

  return (
    <SettingsLayout sectionId={sectionId} onSelectSection={handleSelectSection}>
      <SettingsContent sectionId={sectionId} />
    </SettingsLayout>
  );
}
