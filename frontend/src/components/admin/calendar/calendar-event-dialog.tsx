"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarEvent, CalendarCategory, CalendarStatus } from "@/types/calendar";
import {
  CALENDAR_CATEGORY_CONFIG,
  STANDARD_CALENDAR_CATEGORIES,
  getCurrentSemester,
} from "@/config/calendar";
import {
  Loader2,
  ChevronDown,
  Plus,
  Trash2,
  CalendarPlus,
  Layers,
  CalendarDays,
  Copy,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  Clock,
  Info,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes";
import { useQuery } from "@tanstack/react-query";
import { Course } from "@/lib/types/course";

interface CalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null; // null 為新增，非 null 為編輯
  defaultDate?: string;
  defaultSemester?: string;
  onSave: (data: Partial<CalendarEvent>) => Promise<void>;
  onBatchSave?: (events: Array<Omit<CalendarEvent, "id">>) => Promise<void>;
}

interface BatchRowItem {
  id: string;
  week: string;
  startDate: string;
  endDate: string;
  category: CalendarCategory;
  title: string;
  location: string;
}

// 輔助函式：日期增加天數（避免時區轉換偏誤）
const addDaysToDate = (dateStr: string, days: number): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "";
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return "";
  const target = new Date(y, m, d + days);
  const outY = target.getFullYear();
  const outM = String(target.getMonth() + 1).padStart(2, "0");
  const outD = String(target.getDate()).padStart(2, "0");
  return `${outY}-${outM}-${outD}`;
};

const createEmptyRow = (week = ""): BatchRowItem => ({
  id: Math.random().toString(36).substring(2, 9),
  week,
  startDate: "",
  endDate: "",
  category: "course",
  title: "",
  location: "TR-516",
});

export function CalendarEventDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
  defaultSemester,
  onSave,
  onBatchSave,
}: CalendarEventDialogProps) {
  // 模式：單筆新增/編輯 vs 批次新增多個活動
  const [mode, setMode] = useState<"single" | "batch">("single");

  // 單筆狀態
  const [semester, setSemester] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CalendarCategory>("course");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [week, setWeek] = useState<string>("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<CalendarStatus>("confirmed");
  const [courseId, setCourseId] = useState("");
  const [meetingDate, setMeetingDate] = useState("115.08.13");

  // 批次狀態
  const [batchSemester, setBatchSemester] = useState("");
  const [batchMeetingDate, setBatchMeetingDate] = useState("115.08.13");
  const [batchRows, setBatchRows] = useState<BatchRowItem[]>([
    createEmptyRow("1"),
    createEmptyRow("2"),
    createEmptyRow("3"),
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 取得現有課程清單（供「社課/工作坊」關聯選取使用）
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses");
      const json = await res.json();
      return json?.success && Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // 課程列表排序（最新在前）
  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => {
      const dateA = a.courseDate || a.uploadTime || "";
      const dateB = b.courseDate || b.uploadTime || "";
      return dateB.localeCompare(dateA);
    });
  }, [courses]);

  // 當前已選中之課程物件
  const selectedCourseItem = useMemo(() => {
    return courses.find((c) => c.id === courseId);
  }, [courses, courseId]);

  // 初始化與重設表單
  useEffect(() => {
    if (event) {
      setMode("single");
      setSemester(event.semester || defaultSemester || getCurrentSemester());
      setTitle(event.title || "");
      setCategory(event.category || "course");
      setStartDate(event.startDate || "");
      setEndDate(event.endDate || event.startDate || "");
      setWeek(event.week ? String(event.week) : "");
      setLocation(event.location || "");
      setStatus(event.status || "confirmed");
      setCourseId(event.courseId || "");
      setMeetingDate(event.updatedAt || "115.08.13");
    } else {
      const cur = defaultSemester || getCurrentSemester();
      setSemester(cur);
      setBatchSemester(cur);
      setTitle("");
      setCategory("course");
      setStartDate(defaultDate || "");
      setEndDate(defaultDate || "");
      setWeek("");
      setLocation("TR-516");
      setStatus("confirmed");
      setCourseId("");
      setMeetingDate("115.08.13");
      setBatchMeetingDate("115.08.13");
      setBatchRows([
        createEmptyRow("1"),
        createEmptyRow("2"),
        createEmptyRow("3"),
      ]);
    }
    setError(null);
  }, [event, defaultDate, defaultSemester, open]);

  // 檢查表單是否有尚未儲存的變更內容 (防呆警告判定)
  const isDirty = useMemo(() => {
    if (!open) return false;

    if (mode === "single") {
      if (event) {
        // 編輯模式：比較是否與原有事件不同
        return (
          title.trim() !== (event.title || "").trim() ||
          startDate !== (event.startDate || "") ||
          endDate !== (event.endDate || event.startDate || "") ||
          category !== (event.category || "course") ||
          location.trim() !== (event.location || "").trim() ||
          week.trim() !== (event.week ? String(event.week) : "").trim() ||
          status !== (event.status || "confirmed") ||
          courseId.trim() !== (event.courseId || "").trim() ||
          meetingDate.trim() !== (event.updatedAt || "115.08.13").trim() ||
          semester.trim() !== (event.semester || defaultSemester || getCurrentSemester()).trim()
        );
      } else {
        // 新增模式：檢查使用者是否有輸入資料
        const curSem = defaultSemester || getCurrentSemester();
        return (
          title.trim() !== "" ||
          startDate !== (defaultDate || "") ||
          (endDate !== "" && endDate !== (defaultDate || "")) ||
          category !== "course" ||
          (location.trim() !== "" && location.trim() !== "TR-516") ||
          week.trim() !== "" ||
          courseId.trim() !== "" ||
          semester.trim() !== curSem ||
          meetingDate.trim() !== "115.08.13"
        );
      }
    } else {
      // 批次模式：檢查任一列是否有填入名稱、開始日期，或修改了預設列數/地點/會議時間
      const hasEditedRows = batchRows.some(
        (r) => r.title.trim() !== "" || r.startDate !== "" || (r.location.trim() !== "" && r.location.trim() !== "TR-516")
      );
      const rowsChanged = batchRows.length !== 3;
      const meetingChanged = batchMeetingDate.trim() !== "115.08.13";
      return hasEditedRows || rowsChanged || meetingChanged;
    }
  }, [
    open,
    mode,
    event,
    title,
    startDate,
    endDate,
    category,
    location,
    week,
    status,
    courseId,
    meetingDate,
    semester,
    defaultDate,
    defaultSemester,
    batchRows,
    batchMeetingDate,
  ]);

  // 未儲存變更防呆警告 (與 courses、announcements 頁面風格一致)
  const { confirmDiscard } = useUnsavedChangesWarning(open && isDirty, {
    message:
      "您有尚未儲存的活動內容，確定要放棄編輯並關閉視窗嗎？\n\nAre you sure you want to discard your changes and close this window?",
  });

  // 安全關閉處理常式（攔截遮罩點擊、ESC、右上角叉叉與取消按鈕）
  const handleRequestClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isDirty) {
        if (!confirmDiscard()) return;
      }
      onOpenChange(nextOpen);
    },
    [isDirty, confirmDiscard, onOpenChange]
  );

  // 有效填寫筆數統計（即時派生狀態）
  const validBatchCount = useMemo(
    () => batchRows.filter((r) => r.title.trim() && r.startDate).length,
    [batchRows]
  );

  // 單筆儲存
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("請輸入事件名稱");
      return;
    }
    if (!startDate) {
      setError("請選擇開始日期");
      return;
    }
    if (endDate && endDate < startDate) {
      setError("結束日期不得早於開始日期");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Partial<CalendarEvent> = {
        semester: semester.trim(),
        title: title.trim(),
        category,
        startDate,
        endDate: endDate || startDate,
        week: week ? parseInt(week, 10) : undefined,
        location: location.trim(),
        status,
        courseId: category === "course" ? courseId.trim() : "",
        updatedAt: meetingDate.trim() || undefined,
      };

      if (event?.id) {
        payload.id = event.id;
      }

      await onSave(payload);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  // 批次列更新
  const handleUpdateBatchRow = (id: string, field: keyof BatchRowItem, value: any) => {
    setBatchRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // 批次新增一般空白列
  const handleAddBatchRow = () => {
    setBatchRows((prev) => {
      const lastWeek = prev.length > 0 ? prev[prev.length - 1].week : "";
      const lastWeekNum = lastWeek ? parseInt(lastWeek, 10) : NaN;
      const nextWeek = !isNaN(lastWeekNum) ? String(lastWeekNum + 1) : String(prev.length + 1);
      return [...prev, createEmptyRow(nextWeek)];
    });
  };

  // 智慧複製特定列為下週（自動週次+1、開始/結束日期+7天）
  const handleDuplicateNextWeek = (sourceId: string) => {
    setBatchRows((prev) => {
      const idx = prev.findIndex((r) => r.id === sourceId);
      if (idx === -1) return prev;
      const src = prev[idx];
      const srcWeekNum = src.week ? parseInt(src.week, 10) : NaN;
      const nextWeek = !isNaN(srcWeekNum) ? String(srcWeekNum + 1) : "";
      const nextStart = src.startDate ? addDaysToDate(src.startDate, 7) : "";
      const nextEnd = src.endDate ? addDaysToDate(src.endDate, 7) : nextStart;

      const newRow: BatchRowItem = {
        id: Math.random().toString(36).substring(2, 9),
        week: nextWeek,
        startDate: nextStart,
        endDate: nextEnd,
        category: src.category,
        title: src.title,
        location: src.location || "TR-516",
      };

      const copy = [...prev];
      copy.splice(idx + 1, 0, newRow);
      return copy;
    });
  };

  // 快速接續最後一列新增一週（自動延續週次與+7天）
  const handleAppendNextWeek = () => {
    setBatchRows((prev) => {
      if (prev.length === 0) return [createEmptyRow("1")];
      const last = prev[prev.length - 1];
      const lastWeekNum = last.week ? parseInt(last.week, 10) : NaN;
      const nextWeek = !isNaN(lastWeekNum) ? String(lastWeekNum + 1) : String(prev.length + 1);
      const nextStart = last.startDate ? addDaysToDate(last.startDate, 7) : "";
      const nextEnd = last.endDate ? addDaysToDate(last.endDate, 7) : nextStart;

      return [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          week: nextWeek,
          startDate: nextStart,
          endDate: nextEnd,
          category: last.category || "course",
          title: "",
          location: last.location || "TR-516",
        },
      ];
    });
  };

  // 快速批量擴充 5 週
  const handleAddFiveWeeks = () => {
    setBatchRows((prev) => {
      let currentLast = prev.length > 0 ? prev[prev.length - 1] : null;
      const newRows: BatchRowItem[] = [];
      for (let i = 0; i < 5; i++) {
        const prevWeekNum = currentLast?.week ? parseInt(currentLast.week, 10) : NaN;
        const nextWeek = !isNaN(prevWeekNum) ? String(prevWeekNum + 1) : String(prev.length + i + 1);
        const nextStart = currentLast?.startDate ? addDaysToDate(currentLast.startDate, 7) : "";
        const nextEnd = currentLast?.endDate ? addDaysToDate(currentLast.endDate, 7) : nextStart;
        const row: BatchRowItem = {
          id: Math.random().toString(36).substring(2, 9),
          week: nextWeek,
          startDate: nextStart,
          endDate: nextEnd,
          category: currentLast?.category || "course",
          title: "",
          location: currentLast?.location || "TR-516",
        };
        newRows.push(row);
        currentLast = row;
      }
      return [...prev, ...newRows];
    });
  };

  // 清除無標題且無日期的空白列
  const handleCleanEmptyRows = () => {
    setBatchRows((prev) => {
      const filtered = prev.filter((r) => r.title.trim() || r.startDate);
      return filtered.length > 0 ? filtered : [createEmptyRow("1")];
    });
  };

  // 刪除列
  const handleRemoveBatchRow = (id: string) => {
    setBatchRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.id !== id);
    });
  };

  // 批次送出
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = batchRows.filter((r) => r.title.trim() && r.startDate);
    if (validRows.length === 0) {
      setError("請至少填寫一筆活動的「開始日期」與「活動名稱」");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = validRows.map((r) => ({
        semester: batchSemester.trim() || getCurrentSemester(),
        title: r.title.trim(),
        category: r.category,
        startDate: r.startDate,
        endDate: r.endDate || r.startDate,
        week: r.week ? parseInt(r.week, 10) : undefined,
        location: r.location.trim(),
        status: "confirmed" as const,
        updatedAt: batchMeetingDate.trim() || undefined,
      }));

      if (onBatchSave) {
        await onBatchSave(payload);
      } else {
        for (const item of payload) {
          await onSave(item);
        }
      }
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "批次新增失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleRequestClose}>
      <DialogContent
        className={cn(
          "w-full transition-all duration-200 p-0 gap-0 overflow-hidden flex flex-col border border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-[#141218] text-foreground",
          mode === "batch" && !event
            ? "h-[94dvh] sm:h-[88vh] max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-6xl rounded-t-2xl sm:rounded-2xl"
            : "max-h-[90vh] w-[95vw] sm:max-w-[560px] rounded-2xl"
        )}
      >
        {/* 頂部固定標題列 */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-[#1a1822] shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pr-8">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                {event
                  ? "編輯行事曆日程"
                  : mode === "batch"
                  ? "批次新增行事曆日程"
                  : "新增行事曆日程"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {event
                  ? "維護社課、重要例會、期中考週與社團日程"
                  : mode === "batch"
                  ? "依學期批量排定社課與活動，支援智慧延續週次與日期 +7 天"
                  : "新增單一活動日程至社團行事曆資料庫"}
              </DialogDescription>
            </div>

            {/* 新增模式切換 Tab (僅非編輯模式顯示) */}
            {!event && (
              <div className="inline-flex items-center p-1 bg-slate-200/70 dark:bg-white/10 rounded-xl shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode("single");
                    setError(null);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer select-none",
                    mode === "single"
                      ? "bg-white dark:bg-slate-800 text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>單筆新增</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("batch");
                    setError(null);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer select-none",
                    mode === "batch"
                      ? "bg-white dark:bg-slate-800 text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>批次新增多個活動</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 錯誤提示橫條 */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 模式一：單筆新增 / 編輯表單 */}
        {mode === "single" ? (
          <form onSubmit={handleSingleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* 學年學期 與 週次 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="event-semester" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    學年學期 (例如 115-1)
                  </Label>
                  <Input
                    id="event-semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="115-1"
                    className="h-9 text-sm rounded-lg font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="event-week" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    學期週次 (選填，1~22)
                  </Label>
                  <Input
                    id="event-week"
                    type="number"
                    min={1}
                    max={22}
                    value={week}
                    onChange={(e) => setWeek(e.target.value)}
                    placeholder="例如 3"
                    className="h-9 text-sm rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* 事件名稱 */}
              <div className="space-y-1.5">
                <Label htmlFor="event-title" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  事件名稱 *
                </Label>
                <Input
                  id="event-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：期初社員大會 / ROS2 機器人教學"
                  className="h-9 text-sm rounded-lg font-medium"
                  required
                />
              </div>

              {/* 活動類別 與 狀態 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="event-category" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    活動類別
                  </Label>
                  <div className="relative">
                    <select
                      id="event-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CalendarCategory)}
                      className="h-9 w-full appearance-none rounded-lg border border-input bg-background dark:bg-input/20 px-3 py-1.5 text-sm text-foreground shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-ring outline-none"
                    >
                      {STANDARD_CALENDAR_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="event-status" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    日程狀態
                  </Label>
                  <div className="relative">
                    <select
                      id="event-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as CalendarStatus)}
                      className="h-9 w-full appearance-none rounded-lg border border-input bg-background dark:bg-input/20 px-3 py-1.5 text-sm text-foreground shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-ring outline-none"
                    >
                      <option value="confirmed">已確定 (正式公告)</option>
                      <option value="tentative">暫定 (規劃中)</option>
                      <option value="cancelled">已取消</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 連接課程選取區 (僅在社課/工作坊類別時顯示) */}
              {category === "course" && (
                <div className="space-y-1.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 dark:bg-amber-950/20 dark:border-amber-800/30">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="event-course-select"
                      className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#ffc000]" />
                      <span>關聯課程資源 (供社員查閱講義與教材)</span>
                    </Label>
                    {courseId && (
                      <button
                        type="button"
                        onClick={() => setCourseId("")}
                        className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                      >
                        清除關聯
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      id="event-course-select"
                      value={courseId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setCourseId(selectedId);
                        // 若事件名稱仍為空，自動帶入選定課程標題與日期
                        if (selectedId && !title.trim()) {
                          const matched = courses.find((c) => c.id === selectedId);
                          if (matched) {
                            setTitle(matched.title);
                            if (matched.courseDate && !startDate) {
                              const dateOnly = matched.courseDate.split(" ")[0];
                              setStartDate(dateOnly);
                              setEndDate(dateOnly);
                            }
                          }
                        }
                      }}
                      className="h-9 w-full appearance-none rounded-lg border border-amber-300/70 dark:border-amber-700/50 bg-background px-3 py-1.5 text-xs text-foreground shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-500 outline-none pr-8 font-medium"
                    >
                      <option value="">— 不連接任何課程 (無) —</option>
                      {sortedCourses.map((c) => {
                        const dateStr = c.courseDate ? ` (${c.courseDate.split(" ")[0]})` : "";
                        return (
                          <option key={c.id} value={c.id}>
                            [{c.semester}] {c.title}{dateStr}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {courseId ? (
                    <div className="text-[11px] text-amber-800 dark:text-amber-400 flex items-center justify-between gap-1 pt-0.5">
                      <div className="flex items-center gap-1 truncate">
                        <Sparkles className="w-3 h-3 text-[#ffc000] shrink-0" />
                        <span className="truncate">
                          已連接：{selectedCourseItem ? `${selectedCourseItem.title}` : `課程 ID: ${courseId}`}
                        </span>
                      </div>
                      {selectedCourseItem && (
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                          {selectedCourseItem.handouts?.length || 0} 份教材
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      可從清單中選取社課進行連接，社員在日曆與詳情中可直接查閱課堂講義與實作檔案。
                    </p>
                  )}
                </div>
              )}

              {/* 開始日期 與 結束日期 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="event-start-date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    開始日期 *
                  </Label>
                  <Input
                    id="event-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (!endDate || endDate < e.target.value) {
                        setEndDate(e.target.value);
                      }
                    }}
                    className="h-9 text-sm rounded-lg font-mono cursor-pointer"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="event-end-date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    結束日期 (單日活動同開始日)
                  </Label>
                  <Input
                    id="event-end-date"
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 text-sm rounded-lg font-mono cursor-pointer"
                  />
                </div>
              </div>

              {/* 地點 與 會議時間 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="event-location" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    地點 / 備註
                  </Label>
                  <Input
                    id="event-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="例如：研揚大樓 TR-516"
                    className="h-9 text-sm rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="event-meeting-date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    會議時間
                  </Label>
                  <Input
                    id="event-meeting-date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    placeholder="例如：115.08.13"
                    className="h-9 text-sm rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 單筆底部按鈕 */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-[#1a1822] flex items-center justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRequestClose(false)}
                className="rounded-lg text-xs cursor-pointer"
              >
                取消
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold rounded-lg text-xs gap-1.5 cursor-pointer shadow-xs"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>{event ? "儲存變更" : "立即新增"}</span>
              </Button>
            </div>
          </form>
        ) : (
          /* 模式二：批次新增多個活動表單 */
          <form onSubmit={handleBatchSubmit} className="flex-1 flex flex-col min-h-0">
            {/* 批次全域設定列（學期、會議更新時間、統計指示器） */}
            <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* 欄位輸入區 */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="batch-semester" className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                      學年學期：
                    </Label>
                    <Input
                      id="batch-semester"
                      value={batchSemester}
                      onChange={(e) => setBatchSemester(e.target.value)}
                      placeholder="例如 115-1"
                      className="h-8 w-24 sm:w-28 text-xs font-mono rounded-lg bg-background"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="batch-meeting-date" className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                      會議時間：
                    </Label>
                    <Input
                      id="batch-meeting-date"
                      value={batchMeetingDate}
                      onChange={(e) => setBatchMeetingDate(e.target.value)}
                      placeholder="115.08.13"
                      className="h-8 w-28 sm:w-32 text-xs font-mono rounded-lg bg-background"
                    />
                  </div>
                </div>

                {/* 右側有效筆數指示徽章 */}
                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                      validBatchCount > 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        validBatchCount > 0 ? "bg-emerald-500" : "bg-amber-500"
                      )}
                    />
                    <span>
                      已建立 {batchRows.length} 列 (有效 {validBatchCount} 筆)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* 批次活動列表主體容器（支援手機、平板、電腦三端自適應） */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3">
              {/* === 電腦版表格視圖 (>= 1024px lg:block) === */}
              <div className="hidden lg:block border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xs">
                {/* 黏性表頭 */}
                <div className="grid grid-cols-12 gap-2 px-3.5 py-2.5 bg-slate-100 dark:bg-white/10 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/10 sticky top-0 z-10 select-none">
                  <div className="col-span-1 text-center">週次</div>
                  <div className="col-span-2">開始日期 *</div>
                  <div className="col-span-2">結束日期</div>
                  <div className="col-span-2">活動類別</div>
                  <div className="col-span-3">事件名稱 *</div>
                  <div className="col-span-2 text-center">地點 / 操作</div>
                </div>

                {/* 表格內容列 */}
                <div className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-[#16141e]">
                  {batchRows.map((row, idx) => {
                    const hasValidData = !!(row.title.trim() && row.startDate);
                    return (
                      <div
                        key={row.id}
                        className={cn(
                          "grid grid-cols-12 gap-2 items-center px-3.5 py-2 transition-colors",
                          hasValidData
                            ? "hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"
                            : "bg-amber-50/20 dark:bg-amber-500/[0.01] hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"
                        )}
                      >
                        {/* 週次 */}
                        <div className="col-span-1">
                          <Input
                            type="number"
                            min={1}
                            max={25}
                            value={row.week}
                            onChange={(e) => handleUpdateBatchRow(row.id, "week", e.target.value)}
                            placeholder={String(idx + 1)}
                            className="h-8 text-xs text-center px-1 font-mono rounded-lg"
                            aria-label={`第 ${idx + 1} 列週次`}
                          />
                        </div>

                        {/* 開始日期 */}
                        <div className="col-span-2">
                          <Input
                            type="date"
                            value={row.startDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateBatchRow(row.id, "startDate", val);
                              if (!row.endDate || row.endDate < val) {
                                handleUpdateBatchRow(row.id, "endDate", val);
                              }
                            }}
                            className="h-8 text-xs px-2 rounded-lg cursor-pointer font-mono"
                            aria-label={`第 ${idx + 1} 列開始日期`}
                            required
                          />
                        </div>

                        {/* 結束日期 */}
                        <div className="col-span-2">
                          <Input
                            type="date"
                            value={row.endDate}
                            min={row.startDate}
                            onChange={(e) => handleUpdateBatchRow(row.id, "endDate", e.target.value)}
                            className="h-8 text-xs px-2 rounded-lg cursor-pointer font-mono"
                            aria-label={`第 ${idx + 1} 列結束日期`}
                          />
                        </div>

                        {/* 活動類別 */}
                        <div className="col-span-2 relative">
                          <select
                            value={row.category}
                            onChange={(e) =>
                              handleUpdateBatchRow(row.id, "category", e.target.value as CalendarCategory)
                            }
                            className="h-8 w-full appearance-none text-xs bg-background dark:bg-white/5 border border-input dark:border-white/10 rounded-lg pl-2 pr-6 py-1 text-foreground cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#ffc000]"
                            aria-label={`第 ${idx + 1} 列活動類別`}
                          >
                            {STANDARD_CALENDAR_CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* 事件名稱 */}
                        <div className="col-span-3">
                          <Input
                            value={row.title}
                            onChange={(e) => handleUpdateBatchRow(row.id, "title", e.target.value)}
                            placeholder="例如：ROS2 機器人社課"
                            className="h-8 text-xs rounded-lg font-medium"
                            aria-label={`第 ${idx + 1} 列事件名稱`}
                            required
                          />
                        </div>

                        {/* 地點與操作快捷鈕 */}
                        <div className="col-span-2 flex items-center gap-1.5">
                          <Input
                            value={row.location}
                            onChange={(e) => handleUpdateBatchRow(row.id, "location", e.target.value)}
                            placeholder="TR-516"
                            className="h-8 text-xs rounded-lg flex-1 min-w-0"
                            aria-label={`第 ${idx + 1} 列地點`}
                          />

                          {/* 複製並新增下週 (+7天) */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateNextWeek(row.id)}
                            title="複製此列建立下週日程 (+7天)"
                            aria-label={`複製第 ${idx + 1} 列建立下週`}
                            className="p-1.5 text-slate-400 hover:text-[#ffc000] hover:bg-[#ffc000]/10 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* 刪除此列 */}
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchRow(row.id)}
                            disabled={batchRows.length <= 1}
                            title="刪除此列"
                            aria-label={`刪除第 ${idx + 1} 列`}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 disabled:opacity-20 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* === 平板版雙層卡片視圖 (640px ~ 1023px hidden sm:block lg:hidden) === */}
              <div className="hidden sm:block lg:hidden space-y-3">
                {batchRows.map((row, idx) => {
                  const hasValidData = !!(row.title.trim() && row.startDate);
                  return (
                    <div
                      key={row.id}
                      className={cn(
                        "p-3.5 rounded-xl border transition-colors space-y-2.5",
                        hasValidData
                          ? "bg-white dark:bg-[#181622] border-slate-200 dark:border-white/10"
                          : "bg-amber-50/15 dark:bg-white/[0.02] border-amber-500/20 dark:border-white/10"
                      )}
                    >
                      {/* 第一層：週次、類別、事件名稱、操作鈕 */}
                      <div className="flex items-center gap-2">
                        {/* 週次 */}
                        <div className="w-18 shrink-0">
                          <Input
                            type="number"
                            min={1}
                            max={25}
                            value={row.week}
                            onChange={(e) => handleUpdateBatchRow(row.id, "week", e.target.value)}
                            placeholder={`W${idx + 1}`}
                            className="h-8 text-xs text-center font-mono rounded-lg"
                            aria-label={`第 ${idx + 1} 筆週次`}
                          />
                        </div>

                        {/* 類別 */}
                        <div className="w-32 shrink-0 relative">
                          <select
                            value={row.category}
                            onChange={(e) =>
                              handleUpdateBatchRow(row.id, "category", e.target.value as CalendarCategory)
                            }
                            className="h-8 w-full appearance-none text-xs bg-background dark:bg-white/5 border border-input dark:border-white/10 rounded-lg pl-2 pr-6 py-1 text-foreground cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#ffc000]"
                            aria-label={`第 ${idx + 1} 筆活動類別`}
                          >
                            {STANDARD_CALENDAR_CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* 事件名稱 */}
                        <div className="flex-1 min-w-0">
                          <Input
                            value={row.title}
                            onChange={(e) => handleUpdateBatchRow(row.id, "title", e.target.value)}
                            placeholder="活動名稱 (例：期初大會 / ROS2 社課) *"
                            className="h-8 text-xs rounded-lg font-medium"
                            aria-label={`第 ${idx + 1} 筆事件名稱`}
                            required
                          />
                        </div>

                        {/* 複製與刪除 */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDuplicateNextWeek(row.id)}
                            title="複製此列為下週 (+7天)"
                            className="p-1.5 text-slate-400 hover:text-[#ffc000] hover:bg-[#ffc000]/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchRow(row.id)}
                            disabled={batchRows.length <= 1}
                            title="刪除此列"
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 disabled:opacity-20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 第二層：開始日期、結束日期、地點/備註 */}
                      <div className="grid grid-cols-12 gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                        <div className="col-span-4 flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">開始:</span>
                          <Input
                            type="date"
                            value={row.startDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateBatchRow(row.id, "startDate", val);
                              if (!row.endDate || row.endDate < val) {
                                handleUpdateBatchRow(row.id, "endDate", val);
                              }
                            }}
                            className="h-8 text-xs rounded-lg font-mono cursor-pointer"
                            required
                          />
                        </div>

                        <div className="col-span-4 flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">結束:</span>
                          <Input
                            type="date"
                            value={row.endDate}
                            min={row.startDate}
                            onChange={(e) => handleUpdateBatchRow(row.id, "endDate", e.target.value)}
                            className="h-8 text-xs rounded-lg font-mono cursor-pointer"
                          />
                        </div>

                        <div className="col-span-4 flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">地點:</span>
                          <Input
                            value={row.location}
                            onChange={(e) => handleUpdateBatchRow(row.id, "location", e.target.value)}
                            placeholder="研揚大樓 TR-516"
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* === 手機版響應式卡片視圖 (< 640px sm:hidden) === */}
              <div className="sm:hidden space-y-3">
                {batchRows.map((row, idx) => {
                  const hasValidData = !!(row.title.trim() && row.startDate);
                  const theme = CALENDAR_CATEGORY_CONFIG[row.category] || CALENDAR_CATEGORY_CONFIG.activity;

                  return (
                    <div
                      key={row.id}
                      className={cn(
                        "rounded-xl border p-3 space-y-2.5 transition-all",
                        hasValidData
                          ? "bg-white dark:bg-[#181622] border-slate-200 dark:border-white/10 shadow-2xs"
                          : "bg-amber-50/15 dark:bg-white/[0.02] border-amber-500/20 dark:border-white/10"
                      )}
                    >
                      {/* 卡片標題橫條（活動編號、類別標籤、複製下週、刪除） */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                            #{String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            {row.week ? `第 ${row.week} 週活動` : `日程 ${idx + 1}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* 複製並新增下週 */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateNextWeek(row.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#ffc000] px-2 py-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>+7天</span>
                          </button>

                          {/* 刪除列 */}
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchRow(row.id)}
                            disabled={batchRows.length <= 1}
                            className="text-[11px] text-rose-500 hover:text-rose-600 disabled:opacity-20 px-1.5 py-1 rounded-md cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 週次與類別 (雙欄) */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            學期週次
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            max={25}
                            value={row.week}
                            onChange={(e) => handleUpdateBatchRow(row.id, "week", e.target.value)}
                            placeholder={`例：${idx + 1}`}
                            className="h-8 text-xs font-mono rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            活動類別
                          </Label>
                          <div className="relative">
                            <select
                              value={row.category}
                              onChange={(e) =>
                                handleUpdateBatchRow(row.id, "category", e.target.value as CalendarCategory)
                              }
                              className="h-8 w-full appearance-none text-xs bg-background dark:bg-white/5 border border-input dark:border-white/10 rounded-lg pl-2 pr-6 py-1 text-foreground cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#ffc000]"
                            >
                              {STANDARD_CALENDAR_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* 開始日期與結束日期 (雙欄) */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            開始日期 *
                          </Label>
                          <Input
                            type="date"
                            value={row.startDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateBatchRow(row.id, "startDate", val);
                              if (!row.endDate || row.endDate < val) {
                                handleUpdateBatchRow(row.id, "endDate", val);
                              }
                            }}
                            className="h-8 text-xs font-mono rounded-lg cursor-pointer"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            結束日期
                          </Label>
                          <Input
                            type="date"
                            value={row.endDate}
                            min={row.startDate}
                            onChange={(e) => handleUpdateBatchRow(row.id, "endDate", e.target.value)}
                            className="h-8 text-xs font-mono rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* 活動名稱 */}
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">
                          活動名稱 *
                        </Label>
                        <Input
                          value={row.title}
                          onChange={(e) => handleUpdateBatchRow(row.id, "title", e.target.value)}
                          placeholder="例：期初社員大會 / ROS2 基礎社課"
                          className="h-8 text-xs rounded-lg font-medium"
                          required
                        />
                      </div>

                      {/* 地點 */}
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">
                          地點 / 備註
                        </Label>
                        <Input
                          value={row.location}
                          onChange={(e) => handleUpdateBatchRow(row.id, "location", e.target.value)}
                          placeholder="例如：研揚大樓 TR-516"
                          className="h-8 text-xs rounded-lg"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 列表底部快捷工具列（多裝置自適應） */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddBatchRow}
                    className="text-xs h-8 gap-1.5 rounded-lg border-dashed border-slate-300 dark:border-white/20 hover:border-[#ffc000] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新增一列</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAppendNextWeek}
                    className="text-xs h-8 gap-1.5 rounded-lg border-slate-200 dark:border-white/10 hover:border-[#ffc000] cursor-pointer"
                    title="延續最後一列週次並將日期 +7 天"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#ffc000]" />
                    <span>接續下週 (+7天)</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddFiveWeeks}
                    className="text-xs h-8 gap-1.5 rounded-lg border-slate-200 dark:border-white/10 cursor-pointer hidden md:inline-flex"
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>快速加 5 週</span>
                  </Button>

                  {batchRows.length > 3 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCleanEmptyRows}
                      className="text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <span>清除空白列</span>
                    </Button>
                  )}
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3 text-[#ffc000] shrink-0" />
                  <span>每列必填「開始日期」與「名稱」</span>
                </div>
              </div>
            </div>

            {/* 批次表單底部固定操作列 (Sticky Footer) */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-[#1a1822] flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-muted-foreground hidden sm:block">
                <span>
                  填寫完成後點擊右方按鈕即可一鍵寫入系統資料庫
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRequestClose(false)}
                  className="w-full sm:w-auto rounded-lg text-xs cursor-pointer"
                >
                  取消
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={saving || validBatchCount === 0}
                  className="w-full sm:w-auto bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold rounded-lg text-xs gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>批次建立 ({validBatchCount} 筆日程)</span>
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
