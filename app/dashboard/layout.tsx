import { DashboardShell } from "@/components/dashboard/dashboard-shell";

// No sign-in gate: proxy.ts guarantees every request here carries an
// anonymous device id, and each page scopes its queries to it (see
// lib/identity/device.ts).
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <DashboardShell>{children}</DashboardShell>;
}
