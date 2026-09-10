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
  LogOut,
  ChevronDown,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
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
  const { user, logout, authChecked, syncSession } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const handleLogout = async () => {
    try {
      await logout();
      router.refresh();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setMounted(true);
    if (!authChecked) {
      void syncSession();
    }
  }, [authChecked, syncSession]);

  // 監聽滾動以更新目前 Active Section 與 Header 背景狀態
  useEffect(() => {
    if (pathname !== "/") return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = NAV_ITEMS.filter((item) => !item.isPage).map((item) =>
        item.href.replace("#", ""),
      );

      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(`#${section}`);
            break;
          }
        }
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

  const isHome = pathname === "/";
  const isSolid = !isHome || isScrolled;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 h-16 z-50 transition-all duration-300 text-white select-none",
        isSolid
          ? "bg-[#1e1c24]/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* 手機/窄版畫面：左側三橫槓選單按鈕 (不需要顯示 bar_logo) */}
        <div className="flex md:hidden items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="text-white hover:bg-white/10 h-9 w-9 cursor-pointer -ml-1"
            aria-label="開啟選單"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* 桌機寬版畫面：左側社團 Logo 與名稱 (窄版畫面隱藏) */}
        <button
          type="button"
          onClick={() => handleNavClick("", false)}
          className="hidden md:flex items-center gap-3 cursor-pointer group text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ffc000] rounded-md p-1 -ml-1"
          aria-label="回首頁"
        >
          <div className="relative w-36 sm:w-44 h-9 select-none">
            <Image
              src="/image/Bar_Logo_Yellow.png"
              alt="臺科大機器人研究社標誌"
              fill
              priority
              draggable={false}
              className="object-contain object-left select-none pointer-events-none"
              sizes="180px"
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

        {/* 右側：桌機會員狀態 / 登入註冊按鈕 */}
        <div className="hidden md:flex items-center gap-2.5">
          {mounted && user ? (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-[#ffc000] h-9"
                  >
                    <User className="w-3.5 h-3.5 text-[#ffc000]" />
                    <span className="font-medium text-white truncate max-w-[110px]">
                      {user.name || "社員"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[100px] w-auto bg-[#1e1c24] border-white/10 text-slate-200 shadow-xl p-1 rounded-lg z-50"
                >
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      void handleLogout();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-colors group"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300 transition-colors" />
                    <span>登出</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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

        {/* 右側：手機/窄版畫面快捷按鈕 */}
        <div className="flex md:hidden items-center gap-2">
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
                className="bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] font-bold cursor-pointer rounded-lg text-xs gap-1 h-8 px-3"
              >
                登入
              </Button>
            </LoginModal>
          )}
        </div>
      </div>

      {/* 手機抽屜選單 (Mobile Sheet Drawer) - 排版與寬度與資源管理系統 Sidebar 完全一致 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 gap-0 border-0 flex flex-col text-white"
          style={{ backgroundColor: "#34313d" }}
          showCloseButton={false}
          aria-describedby={undefined}
        >
          {/* Header */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              handleNavClick("", false);
            }}
            className="p-5 flex flex-col items-center gap-2 border-b border-white/10 group cursor-pointer transition-colors hover:bg-white/[0.04] text-left w-full shrink-0"
            title="返回社團官網頂部"
          >
            <div className="relative w-full h-12">
              <Image
                src="/image/Bar_Logo_Yellow.png"
                alt="臺科大機器人研究社標誌"
                fill
                className="object-contain"
                priority
              />
            </div>
            <SheetTitle className="text-base font-bold text-white tracking-[0.2em] mt-1 text-center group-hover:text-[#ffc000] transition-colors">
              社團官網
            </SheetTitle>
          </button>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto pt-3 pb-4 px-3 space-y-1 scrollbar-dark">
            {NAV_ITEMS.map((item) => {
              const isActive = item.isPage
                ? pathname === item.href
                : pathname === "/" && activeSection === item.href;

              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start mb-1 cursor-pointer transition-colors duration-150",
                    isActive
                      ? "font-semibold hover:bg-white/10"
                      : "text-white/60 hover:text-white hover:bg-white/10",
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: "rgba(255,192,0,0.15)",
                          color: "#ffc000",
                        }
                      : undefined
                  }
                  onClick={() => {
                    setOpen(false);
                    handleNavClick(item.href, item.isPage);
                  }}
                >
                  <item.icon
                    className="mr-3 h-5 w-5 transition-colors"
                    style={
                      isActive
                        ? { color: "#ffc000" }
                        : { color: "rgba(255,255,255,0.4)" }
                    }
                  />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {/* Footer / User */}
          <div
            className="p-4 border-t border-white/10 shrink-0 mt-auto"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
          >
            {mounted && user ? (
              <>
                <div className="flex items-center gap-3 mb-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-white/60" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">
                      {user.name || "使用者"}
                    </p>
                    <div className="space-y-0.5 mt-0.5">
                      <p className="text-xs text-white/50 break-words leading-tight">
                        {user.department || "未設定系所"}
                      </p>
                      <p className="text-xs text-white/40 font-mono">
                        {user.studentId || "未登入"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 my-2" />
                <Link href="/dashboard/announcements" onClick={() => setOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start mb-2 hover:bg-white/10"
                    style={{ color: "#ffc000" }}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    進入資源管理系統
                  </Button>
                </Link>

                {isAdmin && (
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start mb-2 hover:bg-white/10"
                      style={{ color: "#ffc000" }}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      管理員後台
                    </Button>
                  </Link>
                )}

                <Button
                  variant="ghost"
                  className="w-full justify-start text-white/60 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                  onClick={() => {
                    setOpen(false);
                    void handleLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4 text-red-400" />
                  登出
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <LoginModal>
                  <Button
                    variant="ghost"
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold justify-start cursor-pointer rounded-lg gap-2"
                  >
                    <LogIn className="mr-2 h-4 w-4 text-[#ffc000]" />
                    登入系統
                  </Button>
                </LoginModal>
                <RegisterModal>
                  <Button className="w-full bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] font-bold justify-start cursor-pointer rounded-lg gap-2">
                    <UserPlus className="mr-2 h-4 w-4" />
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
