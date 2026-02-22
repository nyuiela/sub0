import { DashboardLayout } from "@/components/layout";
import { MarketDetailPage } from "@/components/market/MarketDetail";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <MarketDetailPage marketId={id} />
    </DashboardLayout>
  );
}
