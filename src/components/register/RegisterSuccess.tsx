"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { RegisterSuccessResponse } from "@/types/register.types";

export interface RegisterSuccessProps {
  data: RegisterSuccessResponse;
}

export function RegisterSuccess({ data }: RegisterSuccessProps) {
  const router = useRouter();
  const { refetch } = useAuth();

  const handleGoToDashboard = async () => {
    await refetch();
    router.push("/");
  };

  return (
    <section
      className="flex flex-col items-center justify-center gap-8 px-4 py-12"
      aria-label="Registration complete"
    >
      <h2 className="text-center text-2xl font-semibold text-(--reg-text)">
        You are in
      </h2>
      <p className="text-center text-sm text-(--reg-muted)">
        Agent <strong className="text-(--reg-text)">{data.agent?.name}</strong> is ready.
      </p>
      <button
        type="button"
        onClick={() => void handleGoToDashboard()}
        className="register-btn-primary cursor-pointer px-8 py-4 text-lg no-underline"
      >
        Go to dashboard
      </button>
    </section>
  );
}
