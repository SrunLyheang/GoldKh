import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 px-9 py-[30px]">{children}</main>
    </div>
  );
}
