"use client";

export interface RegisterProgressProps {
  step: number;
  totalSteps: number;
  showEnterHint?: boolean;
  onBack?: () => void;
}

export function RegisterProgress({
  step,
  totalSteps,
  showEnterHint = true,
  onBack,
}: RegisterProgressProps) {
  const progress = totalSteps > 0 ? (step / totalSteps) * 100 : 0;
  const showBack = step > 0 && onBack != null;

  return (
    <header className="fixed left-0 right-0 top-0 z-[var(--z-sticky)] px-4 pt-4">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer text-sm font-medium text-[var(--reg-muted)] transition-colors hover:text-[var(--reg-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--reg-neon-violet)]"
            aria-label="Go back"
          >
            Back
          </button>
        )}
        <div className="register-progress min-w-0 flex-1">
        <div
          className="register-progress-fill"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={0}
          aria-valuemax={totalSteps}
          aria-label="Registration progress"
        />
        </div>
      </div>
      {showEnterHint && (
        <p className="register-terminal mt-4 text-center text-xs opacity-80">
          Press Enter <kbd className="rounded border border-current/30 px-1">↵</kbd>
        </p>
      )}
    </header>
  );
}
