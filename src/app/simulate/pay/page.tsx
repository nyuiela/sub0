"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Payment is now made by the agent on the backend when you start a simulation.
 * Redirect to the Simulate tab.
 */
export default function SimulatePayPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/simulate");
  }, [router]);
  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm text-muted-foreground">Redirecting to Simulate...</p>
    </main>
  );
}
