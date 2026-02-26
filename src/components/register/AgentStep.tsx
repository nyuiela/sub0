"use client";

import { useState } from "react";
import {
  PERSONA_MAX_LENGTH,
  type AgentCreatePayload,
  type AgentTemplatePayload,
} from "@/types/register.types";
import { MODEL_OPTIONS, getDefaultModelOption } from "@/lib/settings.schema";

export type AgentChoice = "create" | "template";

export interface AgentStepProps {
  choice: AgentChoice | null;
  onChoiceChange: (c: AgentChoice) => void;
  createPayload: Partial<AgentCreatePayload>;
  onCreatePayloadChange: (p: Partial<AgentCreatePayload>) => void;
  templatePayload: Partial<AgentTemplatePayload>;
  onTemplatePayloadChange: (p: Partial<AgentTemplatePayload>) => void;
  onNext: () => void;
}

export function AgentStep({
  choice,
  onChoiceChange,
  createPayload,
  onCreatePayloadChange,
  templatePayload,
  onTemplatePayloadChange,
  onNext,
}: AgentStepProps) {
  const defaultModel = getDefaultModelOption();
  const [createName, setCreateName] = useState(createPayload.name ?? "");
  const [createPersona, setCreatePersona] = useState(createPayload.persona ?? "");
  const [createModel, setCreateModel] = useState(
    (createPayload.modelSettings as Record<string, unknown> | undefined)?.model as string | undefined
      ?? defaultModel
  );
  const [templateId, setTemplateId] = useState(templatePayload.templateId ?? "");
  const [templateName, setTemplateName] = useState(templatePayload.name ?? "");
  const [templatePersona, setTemplatePersona] = useState(
    templatePayload.persona ?? ""
  );
  const [templateModel, setTemplateModel] = useState(
    (templatePayload.modelSettings as Record<string, unknown> | undefined)?.model as string | undefined
      ?? defaultModel
  );

  const personaTrimmed = (s: string) => s.slice(0, PERSONA_MAX_LENGTH);
  const createPersonaSafe = personaTrimmed(createPersona);
  const templatePersonaSafe = personaTrimmed(templatePersona);

  const handleNext = () => {
    if (choice === "create") {
      onCreatePayloadChange({
        ...createPayload,
        name: createName.trim(),
        persona: createPersonaSafe.trim() || undefined,
        modelSettings: { model: createModel || defaultModel },
      });
    } else if (choice === "template") {
      onTemplatePayloadChange({
        ...templatePayload,
        templateId: templateId.trim(),
        name: templateName.trim(),
        persona: templatePersonaSafe.trim() || undefined,
        modelSettings: { model: templateModel || defaultModel },
      });
    }
    onNext();
  };

  const canNext =
    (choice === "create" && createName.trim().length > 0) ||
    (choice === "template" &&
      templateId.trim().length > 0 &&
      templateName.trim().length > 0);

  return (
    <section
      className="flex flex-col items-center justify-center gap-8 px-4 py-12"
      aria-label="Create or select agent"
    >
      <h2 className="text-center text-xl font-semibold text-(--reg-text) sm:text-2xl">
        Create agent or use a template
      </h2>
      <ul className="grid w-full max-w-md gap-4 sm:grid-cols-2">
        <li>
          <button
            type="button"
            onClick={() => onChoiceChange("create")}
            data-selected={choice === "create"}
            className="register-glass register-card-interactive cursor-pointer w-full p-6 text-left"
            aria-pressed={choice === "create"}
          >
            <span className="font-medium text-(--reg-text)">
              Create new agent
            </span>
            <p className="mt-2 text-sm text-(--reg-muted)">
              Name and optional persona (no keys required).
            </p>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => onChoiceChange("template")}
            data-selected={choice === "template"}
            className="register-glass register-card-interactive cursor-pointer w-full p-6 text-left"
            aria-pressed={choice === "template"}
          >
            <span className="font-medium text-(--reg-text)">
              From template
            </span>
            <p className="mt-2 text-sm text-(--reg-muted)">
              Template ID and name; optional persona.
            </p>
          </button>
        </li>
      </ul>
      {choice === "create" && (
        <div className="flex w-full max-w-md flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-(--reg-muted)">
              Agent name (required)
            </span>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="My Agent"
              className="register-glass rounded-lg border border-(--reg-border) bg-transparent px-4 py-3 text-(--reg-text) placeholder:text-(--reg-muted) focus:border-(--reg-neon-violet) focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-(--reg-muted)">
              Persona (optional, max {PERSONA_MAX_LENGTH} characters)
            </span>
            <textarea
              value={createPersona}
              onChange={(e) => setCreatePersona(e.target.value)}
              placeholder="Describe your agent's behavior and style..."
              rows={4}
              maxLength={PERSONA_MAX_LENGTH}
              className="register-glass rounded-lg border border-(--reg-border) bg-transparent px-4 py-3 text-(--reg-text) placeholder:text-(--reg-muted) focus:border-(--reg-neon-violet) focus:outline-none resize-y"
            />
            <span className="text-xs text-(--reg-muted)">
              {createPersona.length} / {PERSONA_MAX_LENGTH}
            </span>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-(--reg-muted)">
              Model
            </span>
            <select
              value={createModel}
              onChange={(e) => setCreateModel(e.target.value)}
              className="register-glass rounded-lg border border-(--reg-border) bg-transparent px-4 py-3 text-(--reg-text) focus:border-(--reg-neon-violet) focus:outline-none"
              aria-label="Select model for new agent"
            >
              {MODEL_OPTIONS.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                  disabled={o.comingSoon === true}
                >
                  {o.comingSoon === true ? `${o.label} (Coming soon)` : o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {choice === "template" && (
        <div className="flex w-full max-w-md flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-(--reg-muted)">
              Template ID (required)
            </span>
            <input
              type="text"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="template-id"
              className="register-glass rounded-lg border border-(--reg-border) bg-transparent px-4 py-3 text-(--reg-text) placeholder:text-(--reg-muted) focus:border-(--reg-neon-violet) focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-(--reg-muted)">
              Agent name (required)
            </span>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="My Agent"
              className="register-glass rounded-lg border border-(--reg-border) bg-transparent px-4 py-3 text-(--reg-text) placeholder:text-(--reg-muted) focus:border-(--reg-neon-violet) focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-(--reg-muted)">
              Persona (optional, max {PERSONA_MAX_LENGTH} characters)
            </span>
            <textarea
              value={templatePersona}
              onChange={(e) => setTemplatePersona(e.target.value)}
              placeholder="Override or add persona..."
              rows={4}
              maxLength={PERSONA_MAX_LENGTH}
              className="register-glass rounded-lg border border-(--reg-border) bg-transparent px-4 py-3 text-(--reg-text) placeholder:text-(--reg-muted) focus:border-(--reg-neon-violet) focus:outline-none resize-y"
            />
            <span className="text-xs text-(--reg-muted)">
              {templatePersona.length} / {PERSONA_MAX_LENGTH}
            </span>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-(--reg-muted)">
              Model
            </span>
            <select
              value={templateModel}
              onChange={(e) => setTemplateModel(e.target.value)}
              className="register-glass rounded-lg border border-(--reg-border) bg-transparent px-4 py-3 text-(--reg-text) focus:border-(--reg-neon-violet) focus:outline-none"
              aria-label="Select model for agent from template"
            >
              {MODEL_OPTIONS.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                  disabled={o.comingSoon === true}
                >
                  {o.comingSoon === true ? `${o.label} (Coming soon)` : o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <button
        type="button"
        onClick={handleNext}
        disabled={!choice || !canNext}
        className="register-btn-primary cursor-pointer px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </section>
  );
}
