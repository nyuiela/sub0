import { ClaimFlow } from "@/components/claim/ClaimFlow";

type PageProps = { params: Promise<{ claimCode: string }> };

export default async function ClaimPage({ params }: PageProps) {
  const { claimCode } = await params;
  const trimmed = claimCode?.trim() ?? "";
  if (!trimmed) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-muted">Invalid claim link.</p>
      </main>
    );
  }
  return (
    <main className="container mx-auto max-w-lg px-4 py-8">
      <ClaimFlow claimCode={trimmed} />
    </main>
  );
}
