"use client";

import type { PrimaryMission } from "@/types/register.types";

const MISSIONS: { id: PrimaryMission; label: string }[] = [
  { id: "market-analysis", label: "Market Analysis" },
  { id: "autonomous-trading", label: "Autonomous Trading" },
  { id: "yield-optimization", label: "Yield Optimization" },
];

export interface MissionSelectProps {
  value: PrimaryMission | null;
  onChange: (mission: PrimaryMission) => void;
  onNext: () => void;
}

export function MissionSelect({ value, onChange, onNext }: MissionSelectProps) {
  return (
    <section
      className="flex min-h-[60dvh] flex-col items-center justify-center gap-10 px-4 py-12"
      aria-label="Select primary mission"
    >
      <h2 className="w-full text-center text-xl font-semibold text-(--reg-text) sm:text-2xl">
        What is your primary mission?
      </h2>
      <ul className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {MISSIONS.map(({ id, label }) => (
          <li key={id} className="flex">
            <button
              type="button"
              onClick={() => onChange(id)}
              onDoubleClick={onNext}
              data-selected={value === id}
              className="register-glass register-card-interactive flex min-h-40 w-full flex-col items-center justify-center gap-3 p-6 text-center"
              aria-pressed={value === id}
              aria-label={`Select ${label}`}
            >
              <span
                className="text-2xl opacity-90"
                aria-hidden
              >
                {id === "market-analysis" ? "📊" : id === "autonomous-trading" ? "🤖" : "📈"}
              </span>
              <span className="font-medium text-(--reg-text)">{label}</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onNext}
        disabled={value === null}
        className="register-btn-primary cursor-pointer px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </section>
  );
}
