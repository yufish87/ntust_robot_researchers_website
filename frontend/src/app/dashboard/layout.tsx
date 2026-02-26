import { AppSidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full overflow-hidden bg-white">
      <AppSidebar />
      <main className="flex-1 ml-64 overflow-y-scroll h-full p-8">
        {children}
      </main>
    </div>
  );
}
