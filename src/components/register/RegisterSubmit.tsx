"use client";

import { useState } from "react";
import type { RegisterPayload, RegisterSuccessResponse } from "@/types/register.types";

export interface RegisterSubmitProps {
  payload: RegisterPayload;
  onSuccess: (res: RegisterSuccessResponse) => void;
}

export function RegisterSubmit({ payload, onSuccess }: RegisterSubmitProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as
        | RegisterSuccessResponse
        | { error?: string };
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Registration failed");
        setStatus("error");
        return;
      }
      onSuccess(data as RegisterSuccessResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
      setStatus("error");
    }
  };

  return (
    <section
      className="flex flex-col items-center justify-center gap-8 px-4 py-12"
      aria-label="Complete registration"
    >
      <h2 className="text-center text-xl font-semibold text-(--reg-text) sm:text-2xl">
        Complete registration
      </h2>
      <p className="text-center text-sm text-(--reg-muted)">
        Submit to create your account and agent. You must be signed in with your wallet.
      </p>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={status === "submitting"}
        className="register-btn-primary cursor-pointer px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Submitting..." : "Register"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </section>
  );
}
