"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CalendarEvent, CalendarCategory } from "@/types/calendar";
import {
  CALENDAR_CATEGORY_CONFIG,
  STANDARD_CALENDAR_CATEGORIES,
  getCurrentSemester,
  getWeekdayName,
} from "@/config/calendar";
import { CalendarEventDialog } from "@/components/admin/calendar/calendar-event-dialog";
import { ExcelImportDialog } from "@/components/admin/calendar/excel-import-dialog";
import { AdminCalendarView } from "@/components/admin/calendar/admin-calendar-view";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { exportOfficialCalendarExcel } from "@/lib/excel-calendar";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CalendarDays,
  MapPin,
  Download,
  ChevronDown,
  Calendar as CalendarIcon,
  TableProperties,
} from "lucide-react";

/**
 * 後台明亮色系類別徽章樣式設定 (符合 /admin 設計語彙)
 */
const ADMIN_CATEGORY_BADGE: Record<
  CalendarCategory,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  course: {
    label: "社課/工作坊",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  activity: {
    label: "活動/社員大會",
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-200/80",
    dot: "bg-sky-500",
  },
  holiday: {
    label: "考試/國定假日",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200/80",
    dot: "bg-rose-500",
  },
  exam: {
    label: "考試/國定假日",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200/80",
    dot: "bg-rose-500",
  },
  custom: {
    label: "其他日程",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200/80",
    dot: "bg-purple-500",
  },
};

export default function AdminCalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentSem = useMemo(() => getCurrentSemester(), []);

  // 狀態
  const [selectedSemester, setSelectedSemester] = useState<string>(currentSem);
  const [selectedCategory, setSelectedCategory] = useState<CalendarCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminViewMode, setAdminViewMode] = useState<"table" | "calendar">("table");
  const [createDefaultDate, setCreateDefaultDate] = useState<string>("");

  // 對話框狀態
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // 刪除確認
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 取得行事曆列表
  const {
    data: events = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<CalendarEvent[]>({
    queryKey: ["admin-calendar-events", selectedSemester],
    queryFn: async () => {
      const url =
        selectedSemester === "all"
          ? "/api/admin/calendar"
          : `/api/admin/calendar?semester=${encodeURIComponent(selectedSemester)}`;
      const res = await axios.get(url);
      return res.data?.data || [];
    },
  });

  // 統計指標計算
  const stats = useMemo(() => {
    let courses = 0;
    let activities = 0;
    let examsAndHolidays = 0;
    for (const evt of events) {
      if (evt.category === "course") courses++;
      else if (evt.category === "activity") activities++;
      else if (evt.category === "exam" || evt.category === "holiday") examsAndHolidays++;
    }
    return {
      total: events.length,
      courses,
      activities,
      examsAndHolidays,
    };
  }, [events]);

  // 可選學期清單
  const availableSemesters = useMemo(() => {
    const set = new Set<string>();
    set.add(currentSem);
    for (const evt of events) {
      if (evt.semester) set.add(evt.semester);
    }
    return Array.from(set).sort().reverse();
  }, [events, currentSem]);

  // 搜尋與類別篩選
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchCategory =
        selectedCategory === "all" ||
        evt.category === selectedCategory ||
        (selectedCategory === "holiday" && evt.category === "exam");
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        evt.title.toLowerCase().includes(query) ||
        (evt.location && evt.location.toLowerCase().includes(query)) ||
        (evt.semester && evt.semester.toLowerCase().includes(query));
      return matchCategory && matchQuery;
    });
  }, [events, selectedCategory, searchQuery]);

  // 新增 / 修改 Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<CalendarEvent>) => {
      if (data.id) {
        const res = await axios.put("/api/admin/calendar", data);
        if (!res.data?.success) throw new Error(res.data?.message || "更新失敗");
        return res.data;
      } else {
        const res = await axios.post("/api/admin/calendar", data);
        if (!res.data?.success) throw new Error(res.data?.message || "新增失敗");
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({
        title: "儲存成功",
        description: "行事曆日程已同步更新至後端資料庫",
      });
    },
    onError: (err: any) => {
      toast({
        title: "儲存失敗",
        description: err.message || "發生未知錯誤",
        variant: "destructive",
      });
    },
  });

  // 批次新增 Mutation (Excel)
  const batchMutation = useMutation({
    mutationFn: async (eventList: Array<Omit<CalendarEvent, "id">>) => {
      const res = await axios.post("/api/admin/calendar/batch", { events: eventList });
      if (!res.data?.success) throw new Error(res.data?.message || "批次匯入失敗");
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({
        title: "批次匯入成功",
        description: `成功匯入 ${data.data?.count || 0} 筆活動日程`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "匯入失敗",
        description: err.message || "發生未知錯誤",
        variant: "destructive",
      });
    },
  });

  // 刪除 Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete("/api/admin/calendar", { data: { id } });
      if (!res.data?.success) throw new Error(res.data?.message || "刪除失敗");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({
        title: "刪除成功",
        description: "已成功從行事曆移除該事件",
      });
      setDeletingId(null);
    },
    onError: (err: any) => {
      toast({
        title: "刪除失敗",
        description: err.message || "發生未知錯誤",
        variant: "destructive",
      });
      setDeletingId(null);
    },
  });

  const handleOpenCreate = () => {
    setCreateDefaultDate("");
    setEditingEvent(null);
    setEventDialogOpen(true);
  };

  const handleAddEventAtDate = (dateStr: string) => {
    setCreateDefaultDate(dateStr);
    setEditingEvent(null);
    setEventDialogOpen(true);
  };

  const handleOpenEdit = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    setEventDialogOpen(true);
  };

  // 下載標準範例 Excel (格式與 115學年曆-社團.xlsx 與 PDF 規格完全相同，含 Logo 與校曆色彩)
  const handleExportExcel = async () => {
    try {
      const targetSem = selectedSemester === "all" ? currentSem : selectedSemester;
      await exportOfficialCalendarExcel({
        events: filteredEvents,
        semester: targetSem,
      });
      toast({
        title: "下載成功",
        description: `已成功下載「臺科大機器人研究社_社團行事曆_${targetSem}.xlsx」（採用社團官方校曆形式）`,
      });
    } catch (err: any) {
      toast({
        title: "下載失敗",
        description: err?.message || "匯出 Excel 發生錯誤",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 頂部橫幅 (標準黑底卡片，與社團課程與教材維護等頁面規格統一) */}
      <AdminPageHeader
        title="社團行事曆維護與排程"
        description="排定全學期社課、活動、假期與重要考試停課。"
      >
        <Button
          variant="outline"
          onClick={() => void refetch()}
          disabled={isLoading || isFetching}
          aria-busy={isFetching}
          className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
        >
          <RefreshCw
            className={`mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          重新整理
        </Button>

        <Button
          variant="outline"
          onClick={() => setImportDialogOpen(true)}
          className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 gap-1.5"
        >
          <FileSpreadsheet className="h-4 w-4 mr-1 text-emerald-400" />
          匯入 Excel
        </Button>

        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold shadow-xs cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 gap-1.5"
        >
          <Plus className="h-4 w-4 mr-1" />
          新增日程事件
        </Button>
      </AdminPageHeader>

      {/* 統計指標卡片 (手機雙欄、平板/桌面四欄自適應) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl p-3.5 sm:p-4 text-center shadow-xs">
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {stats.total}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">總日程事件</p>
        </div>
        <div className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl p-3.5 sm:p-4 text-center shadow-xs">
          <p className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {stats.courses}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">社課/工作坊</p>
        </div>
        <div className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl p-3.5 sm:p-4 text-center shadow-xs">
          <p className="text-xl sm:text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 tabular-nums">
            {stats.activities}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">活動/社員大會</p>
        </div>
        <div className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl p-3.5 sm:p-4 text-center shadow-xs">
          <p className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            {stats.examsAndHolidays}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">考試/國定假日</p>
        </div>
      </div>

      {/* 篩選工具列 (乾淨白底卡片，支援手機 / 平板 / 桌面自適應) */}
      <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-xs p-3.5 sm:p-4 space-y-3 sm:space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
          {/* 學期下拉 (滿版寬度原生下拉選單) */}
          <div className="space-y-1.5 w-full">
            <label htmlFor="calendar-filter-sem" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              學年學期
            </label>
            <div className="relative w-full">
              <select
                id="calendar-filter-sem"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="h-9 w-full appearance-none bg-white dark:bg-[#1a1820] border border-slate-200 dark:border-white/10 rounded-lg pl-3 pr-8 text-sm text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#ffc000] hover:border-slate-300 transition-colors font-normal"
              >
                <option value="all">所有學期</option>
                {availableSemesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem} 學年度
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 類別篩選 (滿版寬度原生下拉選單) */}
          <div className="space-y-1.5 w-full">
            <label htmlFor="calendar-filter-cat" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              事件類別
            </label>
            <div className="relative w-full">
              <select
                id="calendar-filter-cat"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as CalendarCategory | "all")}
                className="h-9 w-full appearance-none bg-white dark:bg-[#1a1820] border border-slate-200 dark:border-white/10 rounded-lg pl-3 pr-8 text-sm text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#ffc000] hover:border-slate-300 transition-colors font-normal"
              >
                <option value="all">全部類別 (總日程事件)</option>
                {STANDARD_CALENDAR_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 關鍵字搜尋 */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label htmlFor="calendar-filter-search" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              搜尋關鍵字
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="calendar-filter-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋事件名稱、地點、學期…"
                className="bg-white dark:bg-[#1a1820] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 h-9 text-sm pl-8.5 rounded-lg hover:border-slate-300 focus-visible:border-slate-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 篩選結果資訊、視圖切換與下載現有 Excel 按鈕 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
            <span>符合篩選條件：</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10">
              {filteredEvents.length}
            </span>
            <span>筆日程</span>
            {selectedSemester !== "all" && (
              <span className="text-slate-400 dark:text-slate-500 font-mono">
                ({selectedSemester} 學年期)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* 視圖切換器 (表格列表 / 月曆檢視，固定等寬確保切換時不跳動) */}
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setAdminViewMode("table")}
                className={`flex items-center justify-center gap-1.5 w-[88px] py-1 rounded-md text-xs transition-all cursor-pointer ${
                  adminViewMode === "table"
                    ? "bg-[#ffc000] text-[#1e1c24] font-bold shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium"
                }`}
              >
                <TableProperties className="w-3.5 h-3.5 shrink-0" />
                表格列表
              </button>
              <button
                type="button"
                onClick={() => setAdminViewMode("calendar")}
                className={`flex items-center justify-center gap-1.5 w-[88px] py-1 rounded-md text-xs transition-all cursor-pointer ${
                  adminViewMode === "calendar"
                    ? "bg-[#ffc000] text-[#1e1c24] font-bold shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                月曆檢視
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-8 text-xs text-slate-700 dark:text-slate-200 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-slate-200 dark:border-white/10 gap-1.5 transition-all cursor-pointer"
              title="下載社團標準日曆格式 Excel 範例"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              下載標準範例 Excel
              {filteredEvents.length > 0 && (
                <span className="ml-1 text-[11px] text-slate-400 font-mono">
                  ({filteredEvents.length})
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 主要內容容器 (根據 adminViewMode 切換月曆檢視或表格列表) */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#ffc000]" />
          <span className="text-xs font-mono">載入日程資料中…</span>
        </div>
      ) : adminViewMode === "calendar" ? (
        <AdminCalendarView
          events={filteredEvents}
          onSelectEvent={handleOpenEdit}
          onAddEventAtDate={handleAddEventAtDate}
        />
      ) : (
        <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-xs sm:text-sm">
              目前無符合之行事曆事件，可點擊上方「新增日程事件」或「匯入 Excel」開始建立。
            </div>
          ) : (
            <>
              {/* 1. 手機版專屬卡片列表 (小於 md 螢幕，垂直卡片無需橫向滾動) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-white/5">
              {filteredEvents.map((evt) => {
                const badge = ADMIN_CATEGORY_BADGE[evt.category] || ADMIN_CATEGORY_BADGE.custom;
                const weekday = getWeekdayName(evt.startDate);

                return (
                  <div key={evt.id} className="p-4 space-y-2.5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    {/* 頂部標籤列 */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {evt.week ? (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold tabular-nums border border-slate-200/80 dark:border-white/10">
                            W{evt.week}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center justify-center w-[92px] py-0.5 rounded text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* 狀態 */}
                      {evt.status === "tentative" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          暫定
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          確定
                        </span>
                      )}
                    </div>

                    {/* 事件標題 */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {evt.title}
                      </h3>
                    </div>

                    {/* 日期與地點 */}
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 font-mono tabular-nums">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {evt.startDate}（週{weekday}）
                          {evt.endDate && evt.endDate !== evt.startDate ? ` ~ ${evt.endDate}` : ""}
                        </span>
                      </div>
                      {evt.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}
                    </div>

                    {/* 課程綁定與操作按鈕 */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 gap-2">
                      <div>
                        {evt.courseId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/70 text-xs font-mono">
                            <BookOpen className="w-3 h-3 text-indigo-600" />
                            已排課
                          </span>
                        ) : evt.category === "course" ? (
                          <Link
                            href={`/admin/courses?fromCalendarEvent=${evt.id}`}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <BookOpen className="w-3 h-3" />
                            建立社課
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(evt)}
                          className="h-8 px-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          編輯
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingId(evt.id)}
                          className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          刪除
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. 平板與桌面版完整資料表格 (md 以上螢幕，水平可平滑滾動) */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="w-full min-w-[820px]">
                <TableHeader>
                  <TableRow className="bg-muted/50 dark:bg-white/5">
                    <TableHead className="w-14 text-center">週次</TableHead>
                    <TableHead className="w-28">開始日期</TableHead>
                    <TableHead className="w-14 text-center">星期</TableHead>
                    <TableHead className="w-28 text-center">類別</TableHead>
                    <TableHead className="min-w-[180px]">事件名稱</TableHead>
                    <TableHead className="w-36">地點 / 備註</TableHead>
                    <TableHead className="w-20 text-center">狀態</TableHead>
                    <TableHead className="w-24 text-center">關聯課程</TableHead>
                    <TableHead className="w-24 text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((evt) => {
                    const badge = ADMIN_CATEGORY_BADGE[evt.category] || ADMIN_CATEGORY_BADGE.custom;
                    const weekday = getWeekdayName(evt.startDate);

                    return (
                      <TableRow key={evt.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                        {/* 週次 */}
                        <TableCell className="text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                          {evt.week ? `W${evt.week}` : "—"}
                        </TableCell>

                        {/* 開始日期 */}
                        <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">
                          {evt.startDate}
                        </TableCell>

                        {/* 星期 */}
                        <TableCell className="text-center text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          週{weekday}
                        </TableCell>

                        {/* 類別 Badge */}
                        <TableCell className="text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center w-[88px] py-0.5 rounded text-[11px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </TableCell>

                        {/* 事件名稱 */}
                        <TableCell className="font-medium text-slate-900 dark:text-white">
                          <span className="truncate max-w-[240px] block" title={evt.title}>
                            {evt.title}
                          </span>
                        </TableCell>

                        {/* 地點備註 */}
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                          <span className="truncate max-w-[150px] block" title={evt.location || ""}>
                            {evt.location || "—"}
                          </span>
                        </TableCell>

                        {/* 狀態 */}
                        <TableCell className="text-center whitespace-nowrap">
                          {evt.status === "tentative" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              暫定
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              確定
                            </span>
                          )}
                        </TableCell>

                        {/* 關聯課程 */}
                        <TableCell className="text-center whitespace-nowrap">
                          {evt.courseId ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[10px] font-mono"
                              title={`課程 ID: ${evt.courseId}`}
                            >
                              <BookOpen className="w-3 h-3 text-indigo-600" />
                              已綁定
                            </span>
                          ) : evt.category === "course" ? (
                            <Link
                              href={`/admin/courses?fromCalendarEvent=${evt.id}`}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                              <BookOpen className="w-3 h-3" />
                              排課
                            </Link>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>

                        {/* 操作按鈕 */}
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(evt)}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                              title="編輯事件"
                              aria-label={`編輯事件 ${evt.title}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingId(evt.id)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                              title="刪除事件"
                              aria-label={`刪除事件 ${evt.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* 底部數據總覽 */}
        {!isLoading && filteredEvents.length > 0 && (
          <div className="px-4 py-3 bg-muted/20 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              共 {filteredEvents.length} 個日程事件
              {filteredEvents.length !== events.length && `（篩選自全部 ${events.length} 個事件）`}
            </span>
          </div>
        )}
        </div>
      )}

      {/* 新增/編輯/批次新增日程彈窗 */}
      <CalendarEventDialog
        open={eventDialogOpen}
        onOpenChange={(open) => {
          setEventDialogOpen(open);
          if (!open) {
            setCreateDefaultDate("");
          }
        }}
        event={editingEvent}
        defaultDate={createDefaultDate}
        defaultSemester={selectedSemester === "all" ? currentSem : selectedSemester}
        onSave={async (data) => {
          await saveMutation.mutateAsync(data as any);
        }}
        onBatchSave={async (list) => {
          await batchMutation.mutateAsync(list as any);
        }}
      />

      {/* 批次匯入彈窗 (僅 Excel) */}
      <ExcelImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        defaultSemester={selectedSemester === "all" ? currentSem : selectedSemester}
        onBatchImport={async (list) => {
          await batchMutation.mutateAsync(list as any);
        }}
      />

      {/* 刪除確認 AlertDialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="w-[95vw] sm:max-w-[480px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除此行事曆日程？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除後此事件將自網站行事曆與匯出日曆中移除，此動作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
