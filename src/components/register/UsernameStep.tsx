"use client";

import { useCallback, useState } from "react";
import { checkUsernameAvailable } from "@/lib/api/register";

/** Letters, numbers, underscore, hyphen. Same as backend. */
const USERNAME_REGEX = /^[-a-zA-Z0-9_]{2,32}$/;

export interface UsernameStepProps {
  value: string;
  onChange: (username: string) => void;
  onNext: () => void;
}

export function UsernameStep({ value, onChange, onNext }: UsernameStepProps) {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [touched, setTouched] = useState(false);

  const handleCheck = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setStatus("invalid");
      return;
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      setStatus("invalid");
      return;
    }
    setStatus("checking");
    try {
      const res = await checkUsernameAvailable(trimmed);
      setStatus(res.available ? "available" : "taken");
    } catch {
      setStatus("taken");
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (value.trim().length >= 2) handleCheck();
  }, [value, handleCheck]);

  const canNext = status === "available" && value.trim().length >= 2;

  return (
    <section
      className="flex flex-col items-center justify-center gap-8 px-4 py-12"
      aria-label="Choose username"
    >
      <h2 className="text-center text-xl font-semibold text-(--reg-text) sm:text-2xl">
        Choose your username
      </h2>
      <p className="text-center text-sm text-(--reg-muted)">
        2–32 characters, letters, numbers, underscore, hyphen.
      </p>
      <label className="flex w-full max-w-sm flex-col gap-2">
        <span className="sr-only">Username</span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setStatus("idle");
          }}
          onBlur={handleBlur}
          placeholder="username"
          autoComplete="username"
          className="register-glass w-full rounded-lg border border-(--reg-border) bg-transparent px-4 py-3 text-(--reg-text) placeholder:text-(--reg-muted) focus:border-(--reg-neon-violet) focus:outline-none focus:ring-2 focus:ring-(--reg-neon-violet)/30"
          aria-invalid={touched && (status === "invalid" || status === "taken")}
          aria-describedby="username-hint"
        />
        <span id="username-hint" className="min-h-[1.5em] text-xs text-(--reg-muted)">
          {status === "checking" && "Checking..."}
          {status === "available" && "Username is available."}
          {status === "taken" && "Username is taken or invalid."}
          {status === "invalid" && touched && value.trim().length > 0 && "Invalid format."}
        </span>
      </label>
      <button
        type="button"
        onClick={handleCheck}
        disabled={status === "checking"}
        className="cursor-pointer text-sm text-(--reg-neon-blue) underline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Check availability
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="register-btn-primary cursor-pointer px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </section>
  );
}
