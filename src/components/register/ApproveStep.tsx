"use client";

export interface ApproveStepProps {
  onNext: () => void;
}

export function ApproveStep({ onNext }: ApproveStepProps) {
  return (
    <section
      className="flex flex-col items-center justify-center gap-8 px-4 py-12"
      aria-label="ERC20 approval"
    >
      <h2 className="text-center text-xl font-semibold text-[var(--reg-text)] sm:text-2xl">
        Approve token allowance
      </h2>
      <p className="max-w-md text-center text-sm text-[var(--reg-muted)]">
        In your wallet, approve the ERC20 spending allowance for the sub0 contract. This is required before trading.
      </p>
      <button type="button" onClick={onNext} className="register-btn-primary cursor-pointer px-6 py-3">
        I have approved
      </button>
    </section>
  );
}
