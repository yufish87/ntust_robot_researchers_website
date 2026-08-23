"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  LayoutGrid,
  List,
  Search,
  Package,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Wrench,
  Info,
} from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { cn } from "@/lib/utils";

interface ApplicationItem {
  id: string;
  studentId: string;
  name: string;
  reason: string;
  items: Array<{ code: string; name: string; qty: number } | string>;
  allocated?: Array<{ code: string; items: string[] }>;
  summary: string;
  pickupDate: string;
  returnDate: string;
  status: string;
  createdAt: string;
  reviewer?: string;
  reviewedAt?: string;
  rejectReason?: string;
}

interface FlattenedBorrowedItem {
  appId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  allocatedIds: string[];
  pickupDate: string;
  returnDate: string;
  status: string;
  createdAt: string;
  rawApp: ApplicationItem;
}

type ViewMode = "grid" | "table";
type StatusFilter = "all" | "active" | "pending" | "returned" | "rejected";

export default function ApplicationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // 初始化讀取使用者偏好的檢視模式
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("ntust_rrc_equipment_apps_view_mode") as ViewMode;
      if (savedMode === "grid" || savedMode === "table") {
        setViewMode(savedMode);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("ntust_rrc_equipment_apps_view_mode", mode);
    } catch {
      // ignore
    }
  };

  /* ---------- 資料載入（useQuery 快取）---------- */
  const { data: applications = [], isLoading: loading, error } = useQuery({
    queryKey: ["my-equipment-apps"],
    queryFn: async () => {
      const res = await api.get("/equipment/applications");
      if (res.data.success) return res.data.data as ApplicationItem[];
      throw new Error(res.data.message || "無法載入器材借用紀錄");
    },
  });

  /* ---------- 狀態顏色與樣式定義 ---------- */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "待審核":
        return {
          label: "待審核",
          variant: "outline" as const,
          className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          icon: Clock,
        };
      case "已核准":
        return {
          label: "已核准",
          variant: "outline" as const,
          className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          icon: CheckCircle2,
        };
      case "已借出":
        return {
          label: "借用中（未歸還）",
          variant: "outline" as const,
          className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-medium",
          icon: Package,
        };
      case "已歸還":
        return {
          label: "已歸還",
          variant: "outline" as const,
          className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
          icon: CheckCircle2,
        };
      case "不予通過":
        return {
          label: "不予通過",
          variant: "outline" as const,
          className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
          icon: XCircle,
        };
      default:
        return {
          label: status,
          variant: "outline" as const,
          className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
          icon: Info,
        };
    }
  };

  /* ---------- 輔助解析分配序號 ---------- */
  const getAllocatedIdArray = (app: ApplicationItem, code?: string): string[] => {
    if (!code || !Array.isArray(app.allocated)) return [];
    const matched = app.allocated.find((alloc) => alloc.code === code);
    if (!matched || !Array.isArray(matched.items)) return [];
    return matched.items;
  };

  /* ---------- 統整尚未歸還器材（扁平化單一器材列表） ---------- */
  const unreturnedItemList = useMemo<FlattenedBorrowedItem[]>(() => {
    const list: FlattenedBorrowedItem[] = [];
    applications.forEach((app) => {
      if (app.status === "已借出" || app.status === "已核准") {
        if (Array.isArray(app.items)) {
          app.items.forEach((it) => {
            if (typeof it === "string") {
              list.push({
                appId: app.id,
                itemCode: "-",
                itemName: it,
                qty: 1,
                allocatedIds: [],
                pickupDate: app.pickupDate,
                returnDate: app.returnDate,
                status: app.status,
                createdAt: app.createdAt,
                rawApp: app,
              });
            } else {
              const allocated = getAllocatedIdArray(app, it.code);
              list.push({
                appId: app.id,
                itemCode: it.code,
                itemName: it.name,
                qty: it.qty,
                allocatedIds: allocated,
                pickupDate: app.pickupDate,
                returnDate: app.returnDate,
                status: app.status,
                createdAt: app.createdAt,
                rawApp: app,
              });
            }
          });
        }
      }
    });
    return list;
  }, [applications]);

  /* ---------- 統計遙測指標（Telemetry Metrics） ---------- */
  const stats = useMemo(() => {
    const activeApps = applications.filter(
      (app) => app.status === "已借出" || app.status === "已核准",
    );
    const pendingApps = applications.filter((app) => app.status === "待審核");
    const returnedApps = applications.filter((app) => app.status === "已歸還");

    // 不重複器材品項數
    const distinctItemCodes = new Set<string>();
    let totalUnreturnedQty = 0;
    unreturnedItemList.forEach((item) => {
      distinctItemCodes.add(item.itemCode || item.itemName);
      totalUnreturnedQty += item.qty;
    });

    // 逾期判斷（今日之後逾期）
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdueItems = unreturnedItemList.filter((item) => {
      if (!item.returnDate) return false;
      const ret = new Date(item.returnDate);
      ret.setHours(23, 59, 59, 999);
      return ret.getTime() < now.getTime() && item.status === "已借出";
    });

    return {
      activeAppsCount: activeApps.length,
      distinctItemCount: distinctItemCodes.size,
      totalUnreturnedQty,
      pendingAppsCount: pendingApps.length,
      returnedAppsCount: returnedApps.length,
      overdueCount: overdueItems.length,
    };
  }, [applications, unreturnedItemList]);

  /* ---------- 格式化日期顯示 (避免 ISO UTC 偏移與 1970-01-01 錯誤) ---------- */
  const formatAppDate = (dateStr?: string, fallbackId?: string) => {
    if (!dateStr || dateStr.startsWith("1970-01-01") || dateStr === "Invalid Date") {
      if (fallbackId) {
        const idMatch = fallbackId.match(/^REQ-(\d{4})(\d{2})(\d{2})-/);
        if (idMatch) {
          return `${idMatch[1]}-${idMatch[2]}-${idMatch[3]}`;
        }
      }
      return "—";
    }

    // 若包含 ISO 格式字串如 "2025-10-29T16:00:00.000Z"
    if (dateStr.includes("T")) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }
    }

    // 若為 "2025-10-01 08:00:00" 則取前半部
    if (dateStr.includes(" ")) {
      return dateStr.split(" ")[0];
    }

    return dateStr;
  };

  /* ---------- 逾期天數/倒數格式化 ---------- */
  const getReturnCountdownText = (returnDateStr: string, status: string) => {
    if (!returnDateStr) return { text: "未指定", isOverdue: false, isUrgent: false };
    const formattedDate = formatAppDate(returnDateStr);
    if (formattedDate === "—") return { text: "未指定", isOverdue: false, isUrgent: false };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = formattedDate.split("-");
    if (parts.length < 3) return { text: "未指定", isOverdue: false, isUrgent: false };

    const target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (status === "已歸還") {
      return { text: "已歸還", isOverdue: false, isUrgent: false };
    }

    if (diffDays < 0) {
      return { text: `已逾期 ${Math.abs(diffDays)} 天`, isOverdue: true, isUrgent: true };
    }
    if (diffDays === 0) {
      return { text: "今日到期", isOverdue: false, isUrgent: true };
    }
    if (diffDays <= 3) {
      return { text: `剩餘 ${diffDays} 天到期`, isOverdue: false, isUrgent: true };
    }
    return { text: `剩餘 ${diffDays} 天`, isOverdue: false, isUrgent: false };
  };

  /* ---------- 篩選與搜尋計算 ---------- */
  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        // 狀態篩選
        if (statusFilter === "active") {
          return app.status === "已借出" || app.status === "已核准";
        }
        if (statusFilter === "pending") {
          return app.status === "待審核";
        }
        if (statusFilter === "returned") {
          return app.status === "已歸還";
        }
        if (statusFilter === "rejected") {
          return app.status === "不予通過";
        }
        return true;
      })
      .filter((app) => {
        // 關鍵字搜尋
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const idMatch = app.id?.toLowerCase().includes(q);
        const reasonMatch = app.reason?.toLowerCase().includes(q);
        const summaryMatch = app.summary?.toLowerCase().includes(q);
        const itemsMatch =
          Array.isArray(app.items) &&
          app.items.some((it) =>
            typeof it === "string"
              ? it.toLowerCase().includes(q)
              : it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q),
          );
        return idMatch || reasonMatch || summaryMatch || itemsMatch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [applications, statusFilter, searchQuery]);

  const openAppDetail = (app: ApplicationItem) => {
    setSelectedApp(app);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 標題列 Header */}
      <AdminPageHeader
        title="器材借用申請紀錄"
        description="追蹤個人器材借用申請進度、點收歸還狀況與名下所有尚未歸還器材明細。"
      >
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Link href="/dashboard/equipment" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              器材目錄
            </Button>
          </Link>
          <Link href="/dashboard/equipment" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold shadow-xs cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4">
              <Plus className="mr-1.5 h-4 w-4" />
              新增借用申請
            </Button>
          </Link>
        </div>
      </AdminPageHeader>

      {/* 統整重要數據遙測卡片 (Telemetry Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 卡片 1: 借用品項種類數 */}
        <div className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 tracking-wider">
              借用器材
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {stats.distinctItemCount}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">種</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
            包含目前已借出與已核准之器材
          </p>
        </div>

        {/* 卡片 2: 尚未歸還總件數 */}
        <div className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 tracking-wider">
              尚未歸還
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {stats.totalUnreturnedQty}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">件</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
            名下 {stats.activeAppsCount} 筆借用單持有中
          </p>
        </div>

        {/* 卡片 3: 待審核申請數 */}
        <div className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 tracking-wider">
              待審核
            </span>
            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {stats.pendingAppsCount}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">筆</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
            幹部審核通過後即可取件
          </p>
        </div>

        {/* 卡片 4: 逾期提醒 / 歷史累計 */}
        <div
          className={cn(
            "bg-white dark:bg-[#201e26] border rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden transition-colors",
            stats.overdueCount > 0
              ? "border-red-400/50 bg-red-500/5 dark:border-red-500/30"
              : "border-slate-200 dark:border-white/10",
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-sm font-semibold tracking-wider",
                stats.overdueCount > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-600 dark:text-slate-300",
              )}
            >
              {stats.overdueCount > 0 ? "逾期未歸還" : "已歸還結案"}
            </span>
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                stats.overdueCount > 0
                  ? "bg-red-500/15 text-red-600 dark:text-red-400 animate-pulse"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              )}
            >
              {stats.overdueCount > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums",
                stats.overdueCount > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-900 dark:text-white",
              )}
            >
              {stats.overdueCount > 0 ? stats.overdueCount : stats.returnedAppsCount}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {stats.overdueCount > 0 ? "項逾期" : "筆歷史"}
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
            {stats.overdueCount > 0 ? "請盡速攜帶器材至社辦歸還" : "無任何逾期借用項目"}
          </p>
        </div>
      </div>

      {/* 工具列：狀態標籤 + 關鍵字搜尋 + 檢視切換按鈕 */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 p-3 sm:p-4 rounded-xl shadow-xs">
        {/* 狀態過濾按鈕 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <Button
            variant={statusFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "h-9 px-3.5 text-sm font-semibold cursor-pointer rounded-lg shrink-0",
              statusFilter === "all"
                ? "bg-[#34313d] text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10",
            )}
          >
            全部 ({applications.length})
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("active")}
            className={cn(
              "h-9 px-3.5 text-sm font-semibold cursor-pointer rounded-lg shrink-0",
              statusFilter === "active"
                ? "bg-[#ffc000] text-black hover:bg-yellow-400 font-bold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10",
            )}
          >
            借用中/尚未歸還 ({stats.activeAppsCount})
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className={cn(
              "h-9 px-3.5 text-sm font-semibold cursor-pointer rounded-lg shrink-0",
              statusFilter === "pending"
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10",
            )}
          >
            待審核 ({stats.pendingAppsCount})
          </Button>
          <Button
            variant={statusFilter === "returned" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("returned")}
            className={cn(
              "h-9 px-3.5 text-sm font-semibold cursor-pointer rounded-lg shrink-0",
              statusFilter === "returned"
                ? "bg-slate-600 text-white hover:bg-slate-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10",
            )}
          >
            已歸還 ({stats.returnedAppsCount})
          </Button>
        </div>

        {/* 搜尋欄 + Google Drive 風格切換按鈕群組 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-60 lg:w-68">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="搜尋單號、器材或原因…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-sm bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus-visible:ring-1 focus-visible:ring-[#ffc000]"
            />
          </div>

          {/* 類 Google Drive 檢視切換按鈕 */}
          <div
            className="flex items-center bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 shrink-0"
            role="group"
            aria-label="檢視模式切換"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleViewModeChange("grid")}
              className={cn(
                "h-8 px-2.5 rounded-md cursor-pointer text-sm flex items-center transition-all",
                viewMode === "grid"
                  ? "bg-white dark:bg-[#34313d] text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
              )}
              aria-label="切換為格狀檢視"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleViewModeChange("table")}
              className={cn(
                "h-8 px-2.5 rounded-md cursor-pointer text-sm flex items-center transition-all",
                viewMode === "table"
                  ? "bg-white dark:bg-[#34313d] text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
              )}
              aria-label="切換為表格檢視"
              aria-pressed={viewMode === "table"}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 載入中 / 錯誤 / 空狀態處理 */}
      {loading ? (
        <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-16 text-center text-slate-500 dark:text-slate-400 text-sm">
          <div className="animate-spin w-6 h-6 border-2 border-[#ffc000] border-t-transparent rounded-full mx-auto mb-3" />
          載入器材借用紀錄中…
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-[#201e26] rounded-xl border border-red-200 dark:border-red-900/40 p-8 text-center text-red-500 text-sm">
          載入失敗: {(error as Error)?.message || "未知錯誤"}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-14 text-center">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-bold mb-1">目前沒有任何器材借用紀錄</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
            您可以前往器材目錄挑選所需的感測器、開發板或馬達等器材進行線上借用申請。
          </p>
          <Link href="/dashboard/equipment">
            <Button className="bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold cursor-pointer">
              前往器材目錄挑選
            </Button>
          </Link>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-12 text-center text-slate-500 text-sm">
          找不到符合篩選條件的借用申請紀錄
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 檢視模式 A: 格狀檢視 (Grid / Card View)                                    */}
          {/* ========================================================================= */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApplications.map((app) => {
                const badge = getStatusBadge(app.status);
                const BadgeIcon = badge.icon;
                const returnCountdown = getReturnCountdownText(app.returnDate, app.status);

                return (
                  <Card
                    key={app.id}
                    className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-xs overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-white/20 transition-all"
                  >
                    {/* 卡片標題區 */}
                    <CardHeader className="bg-slate-50/80 dark:bg-white/5 p-4 border-b border-slate-100 dark:border-white/5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-base font-bold text-slate-900 dark:text-white tracking-wider">
                              {app.id}
                            </span>
                            <Badge
                              variant={badge.variant}
                              className={cn(
                                "text-xs px-2.5 py-0.5 rounded-md flex items-center gap-1 font-medium",
                                badge.className,
                              )}
                            >
                              <BadgeIcon className="w-3.5 h-3.5" />
                              {badge.label}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            申請日期: {formatAppDate(app.createdAt, app.id)}
                          </CardDescription>
                        </div>

                        {/* 歸還日期與倒數 */}
                        <div className="text-right shrink-0">
                          <div className="text-sm font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            歸還期限: {formatAppDate(app.returnDate)}
                          </div>
                          {app.status === "已借出" && (
                            <span
                              className={cn(
                                "inline-block text-xs font-mono font-semibold mt-0.5 whitespace-nowrap",
                                returnCountdown.isOverdue
                                  ? "text-red-500"
                                  : returnCountdown.isUrgent
                                    ? "text-amber-500"
                                    : "text-blue-500",
                              )}
                            >
                              {returnCountdown.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {/* 卡片內容區 */}
                    <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                      <div className="space-y-3">
                        {/* 借用原因 */}
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            借用原因
                          </span>
                          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {app.reason || "無填寫原因"}
                          </p>
                        </div>

                        {/* 借用器材清單 */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              器材清單 (
                              {Array.isArray(app.items)
                                ? app.items.reduce(
                                    (acc, it) => acc + (typeof it === "string" ? 1 : it.qty),
                                    0,
                                  )
                                : 1}{" "}
                              件)
                            </span>
                          </div>
                          <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-2.5 border border-slate-100 dark:border-white/5 space-y-2 max-h-52 overflow-y-auto scrollbar-thin">
                            {Array.isArray(app.items) && app.items.length > 0 ? (
                              app.items.map((item, idx) => {
                                if (typeof item === "string") {
                                  return (
                                    <div
                                      key={idx}
                                      className="text-sm text-slate-700 dark:text-slate-300 p-2.5 rounded-md bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5"
                                    >
                                      <span className="font-medium">{item}</span>
                                    </div>
                                  );
                                }
                                const allocated = getAllocatedIdArray(app, item.code);
                                return (
                                  <div
                                    key={idx}
                                    className="text-sm p-2.5 rounded-md bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1.5"
                                  >
                                    {/* 品項名稱與借用數量 */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="min-w-0 flex-1 flex items-center gap-1.5">
                                        <span className="font-medium text-slate-900 dark:text-white truncate">
                                          {item.name}
                                        </span>
                                        <span className="text-xs font-mono text-slate-400 shrink-0">
                                          ({item.code})
                                        </span>
                                      </div>
                                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
                                        x{item.qty}
                                      </span>
                                    </div>

                                    {/* 實體編號 Pill 清單（自動換行，不擠壓品項名稱） */}
                                    {allocated.length > 0 && (
                                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="text-xs text-slate-400 font-mono shrink-0">
                                          分配序號:
                                        </span>
                                        {allocated.map((idStr) => (
                                          <Badge
                                            key={idStr}
                                            variant="outline"
                                            className="text-xs px-2 py-0.5 font-mono bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                          >
                                            {idStr}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-sm text-slate-500">{app.summary || "無詳細品項"}</div>
                            )}
                          </div>
                        </div>

                        {/* 若被拒絕，顯示拒絕理由 */}
                        {app.rejectReason && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-lg text-sm text-red-600 dark:text-red-400">
                            <span className="font-bold mr-1">拒絕原因:</span>
                            {app.rejectReason}
                          </div>
                        )}
                      </div>

                      {/* 底部按鈕 */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <div className="text-xs text-slate-400 font-mono">
                          {app.reviewer && `審核幹部: ${app.reviewer}`}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAppDetail(app)}
                          className="h-8 px-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          查看詳情
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 檢視模式 B: 欄位/表格檢視 (Table / List View)                               */}
          {/* ========================================================================= */}
          {viewMode === "table" && (
            <div className="space-y-6">
              {/* 重點區塊一：目前所有尚未歸還器材彙整明細表 */}
              {unreturnedItemList.length > 0 && statusFilter !== "returned" && statusFilter !== "rejected" && (
                <div className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-xs overflow-hidden">
                  <div className="p-4 bg-slate-50/90 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-5 bg-[#ffc000] rounded-xs" />
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        目前尚未歸還器材清單
                        <Badge className="bg-[#ffc000] text-black font-mono font-bold text-xs h-5 px-1.5">
                          {stats.totalUnreturnedQty} 件持有中
                        </Badge>
                      </h2>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      涵蓋 {stats.distinctItemCount} 種不重複品項
                    </span>
                  </div>

                  <Table className="min-w-[850px]">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap pl-4">
                          器材名稱
                        </TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          型號代碼
                        </TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white text-center whitespace-nowrap">
                          借用數量
                        </TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          分配實體編號
                        </TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          所屬申請單
                        </TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          借用日期
                        </TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          預計歸還
                        </TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          歸還狀態
                        </TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white text-right whitespace-nowrap pr-4">
                          操作
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unreturnedItemList.map((item, idx) => {
                        const countdown = getReturnCountdownText(item.returnDate, item.status);
                        return (
                          <TableRow
                            key={`${item.appId}-${item.itemCode}-${idx}`}
                            className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                          >
                            <TableCell className="font-medium text-slate-900 dark:text-white text-sm pl-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[220px]">{item.itemName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">
                              {item.itemCode || "-"}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-center text-slate-900 dark:text-white text-sm tabular-nums whitespace-nowrap">
                              {item.qty}
                            </TableCell>
                            <TableCell className="font-mono">
                              {item.allocatedIds.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                                  {item.allocatedIds.map((idStr) => (
                                    <Badge
                                      key={idStr}
                                      variant="outline"
                                      className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 whitespace-nowrap"
                                    >
                                      {idStr}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-slate-700 dark:text-slate-200 font-semibold text-sm whitespace-nowrap">
                              {item.appId}
                            </TableCell>
                            <TableCell className="font-mono text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                              {formatAppDate(item.pickupDate || item.createdAt, item.appId)}
                            </TableCell>
                            <TableCell className="font-mono text-slate-900 dark:text-white font-medium text-sm whitespace-nowrap">
                              {formatAppDate(item.returnDate)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium",
                                  countdown.isOverdue
                                    ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold animate-pulse"
                                    : countdown.isUrgent
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                      : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
                                )}
                              >
                                {countdown.text}
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-4 whitespace-nowrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAppDetail(item.rawApp)}
                                className="h-8 px-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                              >
                                詳情
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* 區塊二：所有申請單歷史紀錄表格 (Applications Master Table) */}
              <div className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50/90 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    借用申請單總表
                    <span className="text-sm font-normal text-slate-400">
                      (共 {filteredApplications.length} 筆紀錄)
                    </span>
                  </h2>
                </div>

                <Table className="min-w-[850px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap pl-4">
                        申請單號
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        申請日期
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        借用器材摘要
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        借用原因
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        預計歸還
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        審核狀態
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white text-right whitespace-nowrap pr-4">
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => {
                      const badge = getStatusBadge(app.status);
                      const BadgeIcon = badge.icon;
                      const returnCountdown = getReturnCountdownText(app.returnDate, app.status);

                      // 器材摘要字串
                      const itemsSummary = Array.isArray(app.items)
                        ? app.items
                            .map((it) => (typeof it === "string" ? it : `${it.name} x${it.qty}`))
                            .join("、 ")
                        : app.summary || "無品項";

                      return (
                        <TableRow
                          key={app.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                        >
                          <TableCell className="font-mono font-bold text-slate-900 dark:text-white text-sm pl-4 whitespace-nowrap">
                            {app.id}
                          </TableCell>
                          <TableCell className="font-mono text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                            {formatAppDate(app.createdAt, app.id)}
                          </TableCell>
                          <TableCell className="text-slate-800 dark:text-slate-200 text-sm min-w-[180px] max-w-[260px]">
                            <p className="truncate font-medium" title={itemsSummary}>
                              {itemsSummary}
                            </p>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400 text-sm min-w-[150px] max-w-[240px]">
                            <p className="truncate" title={app.reason}>
                              {app.reason || "無填寫"}
                            </p>
                          </TableCell>
                          <TableCell className="font-mono text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                            <div>{formatAppDate(app.returnDate)}</div>
                            {app.status === "已借出" && (
                              <div
                                className={cn(
                                  "text-xs font-semibold mt-0.5",
                                  returnCountdown.isOverdue
                                    ? "text-red-500"
                                    : returnCountdown.isUrgent
                                      ? "text-amber-500"
                                      : "text-blue-500",
                                )}
                              >
                                {returnCountdown.text}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant={badge.variant}
                              className={cn(
                                "text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium w-fit",
                                badge.className,
                              )}
                            >
                              <BadgeIcon className="w-3.5 h-3.5" />
                              {badge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-4 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAppDetail(app)}
                              className="h-8 px-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            >
                              <Eye className="w-4 h-4 mr-1.5" />
                              查看
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {/* 申請單詳細資訊 Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedApp && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between gap-3 pr-6">
                  <div>
                    <DialogTitle className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                      申請單詳情: {selectedApp.id}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      申請時間: {formatAppDate(selectedApp.createdAt, selectedApp.id)}
                    </DialogDescription>
                  </div>
                  {(() => {
                    const badge = getStatusBadge(selectedApp.status);
                    const BadgeIcon = badge.icon;
                    return (
                      <Badge
                        variant={badge.variant}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium shrink-0",
                          badge.className,
                        )}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </Badge>
                    );
                  })()}
                </div>
              </DialogHeader>

              {/* 申請人與借用時間資訊 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-sm">
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5 whitespace-nowrap">申請社員</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono whitespace-nowrap">
                    {selectedApp.name} ({selectedApp.studentId})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5 whitespace-nowrap">預計取件日期</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono whitespace-nowrap">
                    {formatAppDate(selectedApp.pickupDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5 whitespace-nowrap">預計歸還日期</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono whitespace-nowrap">
                    {formatAppDate(selectedApp.returnDate)}
                  </span>
                </div>
              </div>

              {/* 借用原因 */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  借用原因與專案用途
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 p-3.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 leading-relaxed whitespace-pre-wrap">
                  {selectedApp.reason || "無填寫借用原因"}
                </p>
              </div>

              {/* 器材明細清單表格 */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                  <span>借用器材品項明細</span>
                  <span className="text-slate-400 text-xs font-normal">
                    共{" "}
                    {Array.isArray(selectedApp.items)
                      ? selectedApp.items.reduce(
                          (acc, it) => acc + (typeof it === "string" ? 1 : it.qty),
                          0,
                        )
                      : 1}{" "}
                    件
                  </span>
                </h4>
                <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap pl-3">
                          器材名稱
                        </TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          代碼
                        </TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white text-center whitespace-nowrap">
                          數量
                        </TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white whitespace-nowrap pr-3">
                          分配實體編號
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(selectedApp.items) && selectedApp.items.length > 0 ? (
                        selectedApp.items.map((item, idx) => {
                          if (typeof item === "string") {
                            return (
                              <TableRow key={idx}>
                                <TableCell className="font-medium text-sm pl-3" colSpan={4}>
                                  {item}
                                </TableCell>
                              </TableRow>
                            );
                          }
                          const allocated = getAllocatedIdArray(selectedApp, item.code);
                          return (
                            <TableRow key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                              <TableCell className="font-medium text-slate-900 dark:text-white text-sm pl-3 whitespace-nowrap">
                                {item.name}
                              </TableCell>
                              <TableCell className="font-mono text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">
                                {item.code}
                              </TableCell>
                              <TableCell className="font-mono font-bold text-center text-slate-900 dark:text-white text-sm tabular-nums whitespace-nowrap">
                                {item.qty}
                              </TableCell>
                              <TableCell className="font-mono pr-3">
                                {allocated.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 max-w-sm">
                                    {allocated.map((idStr) => (
                                      <Badge
                                        key={idStr}
                                        variant="outline"
                                        className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 whitespace-nowrap"
                                      >
                                        {idStr}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-xs">尚未分配實體序號</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-slate-500 text-center py-4 text-sm">
                            {selectedApp.summary || "無品項"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* 拒絕原因（若有） */}
              {selectedApp.rejectReason && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl text-sm text-red-700 dark:text-red-300">
                  <span className="font-bold block mb-1">審核不予通過原因:</span>
                  <p className="leading-relaxed">{selectedApp.rejectReason}</p>
                </div>
              )}

              {/* 審核紀錄 */}
              {selectedApp.reviewer && (
                <div className="text-xs text-slate-400 font-mono flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/5">
                  <span>審核幹部: {selectedApp.reviewer}</span>
                  {selectedApp.reviewedAt && <span>審核時間: {formatAppDate(selectedApp.reviewedAt)}</span>}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
