import { AppSidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full overflow-hidden bg-white">
      <AppSidebar />
      <MobileNav variant="dashboard" />
      <main className="flex-1 lg:ml-64 overflow-y-scroll h-full p-4 pt-14 lg:p-8">
        {children}
      </main>
    </div>
  );
}
