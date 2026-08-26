import { auth } from "@clerk/nextjs/server";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    return redirectToSignIn();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-59 flex-1 px-9 py-[30px]">{children}</main>
    </div>
  );
}
