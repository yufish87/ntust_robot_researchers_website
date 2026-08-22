"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  User,
  LogIn,
  UserPlus,
  ArrowRight,
  BookOpen,
  Info,
  Trophy,
  Megaphone,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/store/useAuthStore";
import { LoginModal } from "@/components/auth/login-modal";
import { RegisterModal } from "@/components/auth/register-modal";

const NAV_ITEMS = [
  { label: "關於我們", href: "#about", icon: Info },
  { label: "競賽榮譽", href: "#awards", icon: Trophy },
  { label: "最新消息", href: "#news", icon: Megaphone },
  { label: "社課資訊", href: "#courses", icon: GraduationCap },
  { label: "使用手冊", href: "/manual", icon: BookOpen, isPage: true },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authChecked, syncSession } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!authChecked) {
      void syncSession();
    }
  }, [authChecked, syncSession]);

  // 監聽滾動以更新目前 Active Section
  useEffect(() => {
    if (pathname !== "/") return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + 100;
      const sections = ["courses", "news", "awards", "about"];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveSection(`#${section}`);
            return;
          }
        }
      }
      if (window.scrollY < 300) {
        setActiveSection("");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const handleNavClick = (href: string, isPage?: boolean) => {
    setOpen(false);
    if (isPage) {
      router.push(href);
      return;
    }

    if (pathname === "/") {
      if (href === "") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push("/" + href);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-[#1e1c24] border-b border-white/10 text-white select-none">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* 左側：社團 Logo 與名稱 */}
        <button
          type="button"
          onClick={() => handleNavClick("", false)}
          className="flex items-center gap-3 cursor-pointer group text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ffc000] rounded-md p-1 -ml-1 transition-transform hover:scale-[1.02]"
          aria-label="回首頁"
        >
          <div className="relative w-36 sm:w-44 h-9">
            <Image
              src="/image/Bar_Logo_Yellow.png"
              alt="NTUST RRC Logo"
              fill
              priority
              className="object-contain object-left"
              sizes="(max-width: 640px) 150px, 180px"
            />
          </div>
        </button>

        {/* 中間：桌機導覽連結 (Desktop Navigation) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.isPage
              ? pathname === item.href
              : pathname === "/" && activeSection === item.href;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item.href, item.isPage)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ffc000]",
                  isActive
                    ? "text-[#ffc000] bg-white/10 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-white/5",
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-[#ffc000]" : "text-slate-400")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* 右側：會員狀態 / 登入註冊按鈕 */}
        <div className="hidden sm:flex items-center gap-2.5">
          {mounted && user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
                <User className="w-3.5 h-3.5 text-[#ffc000]" />
                <span className="font-medium text-white truncate max-w-[100px]">
                  {user.name || "社員"}
                </span>
              </div>
              <Link href="/dashboard/announcements">
                <Button
                  size="sm"
                  className="bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] font-bold cursor-pointer rounded-lg shadow-sm hover:shadow-md transition-all gap-1.5 h-9"
                >
                  進入系統
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LoginModal>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer rounded-lg text-sm font-medium gap-1.5 h-9"
                >
                  <LogIn className="w-4 h-4" />
                  登入系統
                </Button>
              </LoginModal>
              <RegisterModal>
                <Button
                  size="sm"
                  className="bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] font-bold cursor-pointer rounded-lg text-sm gap-1.5 shadow-sm hover:shadow-md transition-all h-9"
                >
                  <UserPlus className="w-4 h-4" />
                  加入社團
                </Button>
              </RegisterModal>
            </div>
          )}
        </div>

        {/* 手機版漢堡選單按鈕 */}
        <div className="flex sm:hidden items-center gap-2">
          {mounted && user ? (
            <Link href="/dashboard/announcements">
              <Button
                size="sm"
                className="bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] font-bold cursor-pointer rounded-lg text-xs gap-1 h-8 px-2.5"
              >
                進入系統
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          ) : (
            <LoginModal>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-200 hover:text-white hover:bg-white/10 text-xs px-2.5 h-8 font-medium cursor-pointer"
              >
                登入
              </Button>
            </LoginModal>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="text-white hover:bg-white/10 h-9 w-9 cursor-pointer"
            aria-label="開啟選單"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 手機抽屜選單 (Mobile Sheet Drawer) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="p-0 gap-0 border-r border-white/10 w-72 max-w-[80vw] bg-[#1e1c24] text-white flex flex-col justify-between"
          showCloseButton={false}
        >
          <div>
            <SheetHeader className="p-5 border-b border-white/10 flex flex-col items-center">
              <div className="relative w-40 h-10">
                <Image
                  src="/image/Bar_Logo_Yellow.png"
                  alt="NTUST RRC Logo"
                  fill
                  className="object-contain"
                  sizes="160px"
                />
              </div>
              <SheetTitle className="text-xs tracking-[0.2em] text-[#ffc000] font-mono uppercase mt-1">
                Robot Researchers Club
              </SheetTitle>
            </SheetHeader>

            <nav className="p-4 space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = item.isPage
                  ? pathname === item.href
                  : pathname === "/" && activeSection === item.href;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNavClick(item.href, item.isPage)}
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left flex items-center gap-3 cursor-pointer",
                      isActive
                        ? "text-[#ffc000] bg-white/10 font-bold"
                        : "text-slate-300 hover:text-white hover:bg-white/5",
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isActive ? "text-[#ffc000]" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-white/10 space-y-2 bg-white/[0.02]">
            {mounted && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-[#ffc000]/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#ffc000]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {user.name || "社員"}
                    </p>
                    <p className="text-xs text-slate-400 font-mono truncate">
                      {user.department || user.studentId || ""}
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/announcements" onClick={() => setOpen(false)}>
                  <Button className="w-full bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] font-bold cursor-pointer rounded-lg gap-2">
                    進入資源管理系統
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <LoginModal>
                  <Button
                    variant="ghost"
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold justify-center cursor-pointer rounded-lg gap-2"
                  >
                    <LogIn className="w-4 h-4 text-[#ffc000]" />
                    登入系統
                  </Button>
                </LoginModal>
                <RegisterModal>
                  <Button className="w-full bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] font-bold justify-center cursor-pointer rounded-lg gap-2">
                    <UserPlus className="w-4 h-4" />
                    加入社團 / 註冊
                  </Button>
                </RegisterModal>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
