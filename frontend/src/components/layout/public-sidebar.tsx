"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Info,
  Megaphone,
  BookOpen,
  Phone,
  LogIn,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { LoginModal } from "@/components/auth/login-modal";
import { RegisterModal } from "@/components/auth/register-modal";
import { AppSidebar } from "./sidebar";

export const publicNavItems = [
  { title: "首頁", href: "#hero", icon: Home },
  { title: "社團簡介", href: "#about", icon: Info },
  { title: "最新公告", href: "#news", icon: Megaphone },
  { title: "課程資訊", href: "#courses", icon: BookOpen },
  { title: "聯絡我們", href: "#footer", icon: Phone },
];

export function PublicSidebar() {
  const { user, authChecked, syncSession } = useAuthStore();
  const isAuthenticated = authChecked && !!user;
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !authChecked) {
      void syncSession();
    }
  }, [mounted, authChecked, syncSession]);

  // 當使用者已登入時，直接在 Sidebar 區域切換為資源管理系統 Sidebar，無須重整整個頁面
  if (mounted && isAuthenticated) {
    return <AppSidebar />;
  }

  const handleItemClick = (
    item: (typeof publicNavItems)[number],
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    if (item.href.startsWith("#")) {
      if (pathname === "/") {
        const target = document.querySelector(item.href);
        if (target) target.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push("/" + item.href);
      }
    } else {
      router.push(item.href);
    }
  };

  return (
    <div className="hidden lg:flex bg-slate-50 border-r border-slate-200 h-dvh w-64 flex-col fixed left-0 top-0 z-50">
      {/* Header */}
      <div className="p-6 flex flex-col items-center gap-2 border-b border-slate-100">
        <div className="relative w-full h-12">
          <Image
            src="/image/Bar_Logo.png"
            alt="臺科大機器人研究社標誌"
            fill
            sizes="208px"
            className="object-contain"
            priority
            quality={75}
          />
        </div>
        <p className="text-base font-bold text-black tracking-[0.2em] mt-1 text-center">
          社團官網
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-light">
        {publicNavItems.map((item) => {
          return (
            <div key={item.href} className="block">
              <Button
                variant="ghost"
                className="w-full justify-start mb-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                onClick={(e) => handleItemClick(item, e)}
              >
                <item.icon className="mr-3 h-5 w-5 text-slate-400" />
                {item.title}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Footer / Auth */}
      <div
        className="p-4 border-t border-slate-200 bg-white space-y-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
      >
        {mounted &&
          (!authChecked ? (
            <Button
              disabled
              variant="outline"
              className="w-full border-slate-300 text-slate-500 justify-start"
            >
              請稍後...
            </Button>
          ) : (
            <>
              <LoginModal>
                <Button className="w-full bg-[#34313c] hover:bg-[#2d2a33] text-white font-bold justify-start cursor-pointer border border-transparent">
                  <LogIn className="mr-3 h-4 w-4" />
                  登入系統
                </Button>
              </LoginModal>
              <RegisterModal>
                <Button
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 justify-start cursor-pointer"
                >
                  <UserPlus className="mr-3 h-4 w-4" />
                  註冊帳號
                </Button>
              </RegisterModal>
            </>
          ))}
      </div>
    </div>
  );
}
