"use client";

const LABELS = ["Safe", "Moderate", "Balanced", "Aggressive", "Degens Only"];
const RISK_VALUES = [0, 0.25, 0.5, 0.75, 1];

export interface RiskSliderProps {
  value: number;
  onChange: (value: number) => void;
  onNext: () => void;
}

export function RiskSlider({ value, onChange, onNext }: RiskSliderProps) {
  const index = RISK_VALUES.reduce(
    (best, v, i) => (Math.abs(v - value) < Math.abs(RISK_VALUES[best] - value) ? i : best),
    0
  );
  const label = LABELS[index] ?? "Balanced";

  return (
    <section
      className="flex flex-col items-center justify-center gap-8 px-4 py-12"
      aria-label="Agent risk tolerance"
    >
      <h2 className="text-center text-xl font-semibold text-[var(--reg-text)] sm:text-2xl">
        Agent Persona Calibration
      </h2>
      <p className="text-center text-sm text-[var(--reg-muted)]">
        Risk Tolerance: <strong className="text-[var(--reg-text)]">{label}</strong>
      </p>
      <div className="w-full max-w-md">
        <label className="sr-only">Risk tolerance from Safe to Degens Only</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full appearance-none rounded-full bg-[var(--reg-surface)] accent-[var(--reg-neon-violet)]"
          style={{
            background: `linear-gradient(to right, var(--reg-neon-violet) 0%, var(--reg-neon-violet) ${value * 100}%, rgba(139,92,246,0.2) ${value * 100}%, rgba(139,92,246,0.2) 100%)`,
          }}
        />
        <div className="mt-2 flex justify-between text-xs text-[var(--reg-muted)]">
          <span>Safe</span>
          <span>Degens Only</span>
        </div>
      </div>
      <button type="button" onClick={onNext} className="register-btn-primary cursor-pointer px-6 py-3">
        Continue
      </button>
    </section>
  );
}
