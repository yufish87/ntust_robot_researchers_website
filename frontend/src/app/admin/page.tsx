"use client";

import Link from "next/link";
import {
  Megaphone,
  BookOpen,
  Wrench,
  Printer,
  CreditCard,
  Users,
  ClipboardCheck,
  BookOpenCheck,
  ArrowRight,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

const adminModules = [
  {
    title: "人員管理",
    description: "註冊授權碼派發、社員清單與權限組調整",
    href: "/admin/users",
    icon: Users,
    badge: "帳號與權限",
  },
  {
    title: "公告管理",
    description: "發布、編輯與管理社團最新公告與附件",
    href: "/admin/announcements",
    icon: Megaphone,
    badge: "官網發布",
  },
  {
    title: "課程管理",
    description: "維護社課資訊、講義投影片與錄影回放",
    href: "/admin/courses",
    icon: BookOpen,
    badge: "教學資源",
  },
  {
    title: "器材借用審核",
    description: "審核社員借用申請、面交點收與歸還結案",
    href: "/admin/equipment",
    icon: Wrench,
    badge: "資產審核",
  },
  {
    title: "器材庫存盤點",
    description: "管理器材總表庫存、新增規格與狀態清查",
    href: "/admin/equipment/inventory",
    icon: ClipboardCheck,
    badge: "資產管理",
  },
  {
    title: "機器借用審核",
    description: "審核 3D 列印與雷射切割機預約排程與安全要點",
    href: "/admin/machine",
    icon: Printer,
    badge: "機具設備",
  },
  {
    title: "報帳審核",
    description: "審核財務單據、核銷發票與批次撥款管理",
    href: "/admin/finance",
    icon: CreditCard,
    badge: "社團財務",
  },
  {
    title: "管理員操作手冊",
    description: "查看幹部標準作業程序、審核規範與指引說明",
    href: "/admin/manual",
    icon: BookOpenCheck,
    badge: "幹部手冊",
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <AdminPageHeader
        title="社團管理員後台"
        description="歡迎進入臺科大機器人研究社 社團管理系統。請選擇下方功能模組進行社團各項資源審核、盤點與人員維護作業。"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {adminModules.map((mod) => (
          <Link key={mod.href} href={mod.href} className="block group">
            <div className="bg-white dark:bg-[#201e26] p-5.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#ffc000] dark:hover:border-[#ffc000] shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center justify-center text-slate-800 dark:text-[#ffc000] group-hover:bg-[#ffc000]/10 group-hover:text-amber-600 dark:group-hover:text-[#ffc000] transition-colors">
                    <mod.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                    {mod.badge}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-[#ffc000] transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-[#ffc000] font-medium transition-colors">
                <span>進入管理</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
