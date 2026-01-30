"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  Menu,
  Settings
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    // Basic Client-side protection
    // Note: Middleware should also handle this for better security/UX
    const checkAuth = () => {
        if (!isAuthenticated()) {
            router.push("/login")
            return
        }
        
        // Check Role
        if (user && user.role !== 'admin' && user.role !== 'owner') {
             router.push("/") // Redirect non-admins to home
             return
        }
    }
    checkAuth()
  }, [user, isAuthenticated, router])

  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return null // Or a loading spinner while redirecting
  }

  const navItems = [
    {
      title: "概覽",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "申請審核",
      href: "/admin/applications",
      icon: FileText,
    },
    {
      title: "成員管理",
      href: "/admin/users",
      icon: Users,
    },
    {
        title: "系統設定",
        href: "/admin/settings",
        icon: Settings
    }
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 w-64">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          社團管理後台
        </h1>
        <p className="text-xs text-slate-400 mt-1">NTUST RRC Admin</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
                    <div className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        isActive 
                            ? "bg-blue-600 text-white shadow-md" 
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}>
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                    </div>
                </Link>
            )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="mb-4 px-3">
             <div className="text-sm font-medium text-white">{user.name}</div>
             <div className="text-xs text-slate-500">{user.studentId}</div>
        </div>
        <Button 
            variant="outline" 
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30 border-slate-700"
            onClick={() => {
                logout()
                router.push("/login")
            }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          登出
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shadow-xl z-10">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between text-white">
           <span className="font-bold">管理後台</span>
           <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
             <SheetTrigger asChild>
               <Button variant="ghost" size="icon" className="text-white">
                 <Menu className="h-6 w-6" />
               </Button>
             </SheetTrigger>
             <SheetContent side="left" className="p-0 border-r-slate-800 w-64 bg-slate-900 text-white">
                <SidebarContent />
             </SheetContent>
           </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
             <div className="max-w-6xl mx-auto">
                 {children}
             </div>
        </main>
      </div>
    </div>
  )
}
