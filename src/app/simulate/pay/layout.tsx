import { Suspense } from "react";

function PayPageFallback() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <p className="text-sm text-muted-foreground">Loading payment...</p>
    </main>
  );
}

export default function SimulatePayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<PayPageFallback />}>{children}</Suspense>;
}
