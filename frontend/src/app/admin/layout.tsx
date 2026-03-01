"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [hasHydrated, setHasHydrated] = useState(false);

  const isAdmin = useMemo(
    () => user?.role === "admin" || user?.role === "owner",
    [user?.role]
  );

  // 等待 zustand persist hydration 完成，避免 SSR 時 user 為 null 就跳轉
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    // 已經 hydrated 的情境（如 hot reload）
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "權限不足",
        description: "您沒有管理員權限，無法進入管理員後台。",
      });
      router.replace("/dashboard");
    }
  }, [hasHydrated, user, isAdmin, router, toast]);

  // 尚未 hydrated 或未登入 — 顯示 Loading
  if (!hasHydrated || !user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-white">
      <AdminSidebar />
      <main className="flex-1 ml-64 overflow-y-scroll h-full p-8">
        {children}
      </main>
    </div>
  );
}

