import { DashboardLayout } from "@/components/layout";

export default function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
