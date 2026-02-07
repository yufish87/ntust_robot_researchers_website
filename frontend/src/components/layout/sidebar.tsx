"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  CreditCard, 
  Home, 
  Settings, 
  LogOut, 
  User,
  Wrench,
  Megaphone, // for Announcements
  Trophy,    // for Competitions
  BookOpen,  // for Courses
  Lightbulb  // for Wishlist
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    title: "概覽",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "公告",
    href: "/dashboard/announcements",
    icon: Megaphone,
  },
  {
    title: "課程",
    href: "/dashboard/courses",
    icon: BookOpen,
  },
  {
    title: "器材借用",
    href: "/dashboard/equipment",
    icon: Wrench,
  },
  {
    title: "財務報帳",
    href: "/dashboard/finance",
    icon: CreditCard,
  },
  {
    title: "競賽意願",
    href: "/dashboard/competitions",
    icon: Trophy,
  },
  {
    title: "許願池",
    href: "/dashboard/wishlist",
    icon: Lightbulb,
  },
  {
    title: "個人設定",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter(); 

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="flex bg-slate-50 border-r border-slate-200 h-screen w-64 flex-col fixed left-0 top-0">
      {/* Header */}
      <div className="p-6 flex flex-col items-center gap-2 border-b border-slate-100">
        <div className="relative w-full h-12">
           <Image 
             src="/image/Bar_Logo.png" 
             alt="RRC Logo" 
             fill
             className="object-contain"
             priority
           />
        </div>
        <p className="text-base font-bold text-black tracking-[0.2em] mt-1 text-center">資源管理系統</p>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => {
          // Prevent "Dashboard" from being active on sub-routes like "/dashboard/finance"
          const isActive = item.href === "/dashboard" 
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1",
                  isActive 
                    ? "bg-white text-primary shadow-sm font-semibold hover:bg-white" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Footer / User */}
      <div className="p-4 border-t border-slate-200 bg-white">
      <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
             <User className="w-4 h-4 text-slate-500" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-700 truncate">{user?.name || "使用者"}</p>
            <div className="space-y-0.5 mt-0.5">
               <p className="text-xs text-slate-500 break-words leading-tight">{user?.department || "未設定系所"}</p>
               <p className="text-xs text-slate-400 font-mono">{user?.studentId || "未登入"}</p>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          登出
        </Button>
      </div>
    </div>
  );
}
