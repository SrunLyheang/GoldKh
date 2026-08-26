import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    return redirectToSignIn();
  }

  return <DashboardShell>{children}</DashboardShell>;
}
