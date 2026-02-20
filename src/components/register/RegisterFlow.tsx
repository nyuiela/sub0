"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  PrimaryMission,
  AgentCreatePayload,
  AgentTemplatePayload,
  RegisterSuccessResponse,
} from "@/types/register.types";
import type { AgentChoice } from "./AgentStep";
import { RegisterProgress } from "./RegisterProgress";
import { HeroStart } from "./HeroStart";
import { MissionSelect } from "./MissionSelect";
import { RiskSlider } from "./RiskSlider";
import { UsernameStep } from "./UsernameStep";
import { AgentStep } from "./AgentStep";
import { ConnectWalletStep } from "./ConnectWalletStep";
import { ApproveStep } from "./ApproveStep";
import { RegisterSubmit } from "./RegisterSubmit";
import { RegisterSuccess } from "./RegisterSuccess";

const STEPS = [
  "hero",
  "mission",
  "risk",
  "username",
  "agent",
  "auth",
  "approve",
  "submit",
] as const;
const TOTAL = STEPS.length;

export function RegisterFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [mission, setMission] = useState<PrimaryMission | null>(null);
  const [riskValue, setRiskValue] = useState(0.5);
  const [username, setUsername] = useState("");
  const [agentChoice, setAgentChoice] = useState<AgentChoice | null>(null);
  const [agentCreate, setAgentCreate] = useState<Partial<AgentCreatePayload>>({});
  const [agentTemplate, setAgentTemplate] = useState<Partial<AgentTemplatePayload>>({});
  const [successData, setSuccessData] = useState<RegisterSuccessResponse | null>(null);

  const step = STEPS[stepIndex];
  const showProgress = stepIndex > 0 && step !== "hero" && successData === null;

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, TOTAL - 1));
  }, []);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && step !== "hero" && step !== "submit") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, goNext]);

  if (successData) {
    return (
      <>
        <RegisterProgress step={TOTAL} totalSteps={TOTAL} showEnterHint={false} />
        <RegisterSuccess data={successData} />
      </>
    );
  }

  return (
    <>
      {showProgress && (
        <RegisterProgress
          step={stepIndex}
          totalSteps={TOTAL}
          showEnterHint={step !== "submit"}
          onBack={goBack}
        />
      )}
      <div className="pt-16">
        {step === "hero" && <HeroStart onStart={goNext} />}
        {step === "mission" && (
          <MissionSelect value={mission} onChange={setMission} onNext={goNext} />
        )}
        {step === "risk" && (
          <RiskSlider value={riskValue} onChange={setRiskValue} onNext={goNext} />
        )}
        {step === "username" && (
          <UsernameStep value={username} onChange={setUsername} onNext={goNext} />
        )}
        {step === "agent" && (
          <AgentStep
            choice={agentChoice}
            onChoiceChange={setAgentChoice}
            createPayload={agentCreate}
            onCreatePayloadChange={setAgentCreate}
            templatePayload={agentTemplate}
            onTemplatePayloadChange={setAgentTemplate}
            onNext={goNext}
          />
        )}
        {step === "auth" && <ConnectWalletStep onNext={goNext} />}
        {step === "approve" && <ApproveStep onNext={goNext} />}
        {step === "submit" && (
          <RegisterSubmit
            payload={{
              username: username.trim(),
              authMethod: "WALLET",
              agent:
                agentChoice === "create" && agentCreate?.name
                  ? {
                      create: {
                        name: agentCreate.name,
                        ...(agentCreate.persona && { persona: agentCreate.persona }),
                        ...(agentCreate.modelSettings && {
                          modelSettings: agentCreate.modelSettings,
                        }),
                        ...(agentCreate.strategy && {
                          strategy: agentCreate.strategy,
                        }),
                      },
                    }
                  : agentChoice === "template" &&
                      agentTemplate?.templateId &&
                      agentTemplate?.name
                    ? {
                        template: {
                          templateId: agentTemplate.templateId,
                          name: agentTemplate.name,
                          ...(agentTemplate.persona && {
                            persona: agentTemplate.persona,
                          }),
                          ...(agentTemplate.modelSettings && {
                            modelSettings: agentTemplate.modelSettings,
                          }),
                          ...(agentTemplate.strategy && {
                            strategy: agentTemplate.strategy,
                          }),
                        },
                      }
                    : {
                        create: { name: "My Agent" },
                      },
            }}
            onSuccess={setSuccessData}
          />
        )}
      </div>
    </>
  );
}
