"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, authChecked, syncSession } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }

    return unsub;
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!authChecked) {
      void syncSession();
      return;
    }

    if (!user) {
      router.replace("/");
    }
  }, [hasHydrated, authChecked, syncSession, user, router]);

  if (!hasHydrated || !authChecked || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // 首頁是深色背景，用金色滑塊；其他子頁面是白色背景，用深色滑塊
  const isDashboardHome = pathname === "/dashboard";

  return (
    <div className="flex h-full overflow-hidden bg-white">
      <AppSidebar />
      <MobileNav variant="dashboard" />
      <main className={`flex-1 lg:ml-64 overflow-y-scroll h-full p-4 pt-14 lg:p-8 pb-[env(safe-area-inset-bottom)] scroll-smooth ${isDashboardHome ? "scrollbar-dark" : "scrollbar-light"}`}>
        {children}
      </main>
    </div>
  );
}
