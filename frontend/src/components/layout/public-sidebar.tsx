"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Info, Megaphone, BookOpen, Phone, LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "首頁", href: "#hero", icon: Home },
  { title: "社團簡介", href: "#about", icon: Info },
  { title: "最新公告", href: "#news", icon: Megaphone },
  { title: "課程資訊", href: "#courses", icon: BookOpen },
  { title: "聯絡我們", href: "#contact", icon: Phone },
];

export function PublicSidebar() {
  return (
    <div className="flex bg-slate-50 border-r border-slate-200 h-screen w-64 flex-col fixed left-0 top-0 hidden md:flex z-50">
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
        <p className="text-base font-bold text-black tracking-[0.2em] mt-1 text-center">社團官網</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <div key={item.href} className="block">
            <Button 
              variant="ghost" 
              className="w-full justify-start mb-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector(item.href);
                if (target) target.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <item.icon className="mr-3 h-5 w-5 text-slate-400" />
              {item.title}
            </Button>
          </div>
        ))}
      </div>

      {/* Footer / Auth */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-2">
        <Link href="/auth/login" className="w-full block">
          <Button 
            className="w-full bg-[#34313c] hover:bg-[#2d2a33] text-white font-bold justify-start"
          >
            <LogIn className="mr-3 h-4 w-4" />
            登入系統
          </Button>
        </Link>
        <Link href="/auth/register" className="w-full block">
          <Button 
            variant="outline" 
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 justify-start"
          >
            <UserPlus className="mr-3 h-4 w-4" />
            註冊帳號
          </Button>
        </Link>
      </div>
    </div>
  );
}
