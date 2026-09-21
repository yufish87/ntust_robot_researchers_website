"use client";

import React, { useState, useMemo } from "react";
import { CalendarEvent, CalendarCategory } from "@/types/calendar";
import { ChevronLeft, ChevronRight, Sparkles, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminCalendarViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEventAtDate: (dateStr: string) => void;
}

const ADMIN_CATEGORY_BADGE: Record<
  CalendarCategory,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  course: {
    label: "社課/工作坊",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200/80 dark:border-amber-800/40",
    dot: "bg-amber-500",
  },
  activity: {
    label: "活動/社員大會",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    text: "text-sky-800 dark:text-sky-300",
    border: "border-sky-200/80 dark:border-sky-800/40",
    dot: "bg-sky-500",
  },
  holiday: {
    label: "考試/國定假日",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-800 dark:text-rose-300",
    border: "border-rose-200/80 dark:border-rose-800/40",
    dot: "bg-rose-500",
  },
  exam: {
    label: "考試/國定假日",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-800 dark:text-rose-300",
    border: "border-rose-200/80 dark:border-rose-800/40",
    dot: "bg-rose-500",
  },
  custom: {
    label: "其他日程",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-800 dark:text-purple-300",
    border: "border-purple-200/80 dark:border-purple-800/40",
    dot: "bg-purple-500",
  },
};

export function AdminCalendarView({
  events,
  onSelectEvent,
  onAddEventAtDate,
}: AdminCalendarViewProps) {
  // 當前瀏覽年份與月份
  const [currentDate, setCurrentDate] = useState(() => {
    if (events.length > 0 && events[0].startDate) {
      const d = new Date(events[0].startDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 切換月份
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 整理事件映射表: "YYYY-MM-DD" -> CalendarEvent[]
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of events) {
      if (!evt.startDate) continue;
      const start = new Date(evt.startDate);
      const end = evt.endDate ? new Date(evt.endDate) : new Date(evt.startDate);

      const cur = new Date(start);
      let count = 0;
      while (cur <= end && count < 60) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, "0");
        const d = String(cur.getDate()).padStart(2, "0");
        const key = `${y}-${m}-${d}`;

        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(evt);

        cur.setDate(cur.getDate() + 1);
        count++;
      }
    }
    return map;
  }, [events]);

  // 計算月曆網格
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0(日)~6(六)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // 1. 上月補齊
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // 2. 當月天數
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // 3. 下月補齊至 7 的倍數 (35 或 42 格)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 1 : month + 2;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [year, month]);

  const monthNames = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
  ];

  return (
    <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-xs p-4 sm:p-5 space-y-4">
      {/* 頂部導覽列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {year} 年 {monthNames[month]}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-7 text-xs px-2.5 rounded-lg border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer gap-1"
          >
            <Sparkles className="w-3 h-3 text-[#ffc000]" />
            回到今天
          </Button>
          <span className="hidden md:inline-block text-xs text-slate-400 font-normal">
            點擊任一日期格即可直接在該日新增活動
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8 rounded-lg border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            aria-label="上個月"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8 rounded-lg border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            aria-label="下個月"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 星期標頭 (週日 ~ 週六) */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-semibold py-1.5 border-b border-slate-100 dark:border-white/5">
        <span className="text-rose-500">週日</span>
        <span className="text-slate-600 dark:text-slate-400">週一</span>
        <span className="text-slate-600 dark:text-slate-400">週二</span>
        <span className="text-slate-600 dark:text-slate-400">週三</span>
        <span className="text-slate-600 dark:text-slate-400">週四</span>
        <span className="text-slate-600 dark:text-slate-400">週五</span>
        <span className="text-sky-600">週六</span>
      </div>

      {/* 日期網格 */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarCells.map((cell) => {
          const dayEvents = eventsByDate.get(cell.dateStr) || [];
          const weekdayIdx = new Date(cell.dateStr).getDay();
          const isSunday = weekdayIdx === 0;
          const isSaturday = weekdayIdx === 6;

          return (
            <div
              key={cell.dateStr}
              onClick={() => onAddEventAtDate(cell.dateStr)}
              className={`group min-h-[95px] sm:min-h-[120px] p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                cell.isToday
                  ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50 shadow-xs"
                  : cell.isCurrentMonth
                  ? "bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10 hover:bg-slate-100/70 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/20"
                  : "bg-slate-50/20 dark:bg-transparent border-transparent opacity-35"
              }`}
              title="點擊以在此日期新增日程事件"
            >
              {/* 日期標籤與快速新增按鈕 */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-mono tabular-nums leading-none ${
                    cell.isToday
                      ? "text-black bg-[#ffc000] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-xs"
                      : isSunday
                      ? "text-rose-600 font-bold"
                      : isSaturday
                      ? "text-sky-600 font-bold"
                      : cell.isCurrentMonth
                      ? "text-slate-800 dark:text-slate-200 font-semibold"
                      : "text-slate-400 dark:text-slate-600"
                  }`}
                >
                  {cell.dayNum}
                </span>

                {/* 懸停新增按鈕 (+) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddEventAtDate(cell.dateStr);
                  }}
                  className="w-5 h-5 rounded-md text-slate-400 hover:text-black hover:bg-[#ffc000] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-xs"
                  title="在此日期新增日程事件"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 活動卡片列表 (點擊直接進入編輯) */}
              <div className="space-y-1 flex-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((evt) => {
                  const conf = ADMIN_CATEGORY_BADGE[evt.category] || ADMIN_CATEGORY_BADGE.custom;

                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium truncate flex items-center gap-1 cursor-pointer transition-all hover:shadow-xs border ${conf.bg} ${conf.text} ${conf.border} hover:brightness-95 dark:hover:brightness-125`}
                      title={`${evt.title}${evt.location ? ` (${evt.location})` : ""} - 點擊編輯`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dot}`} />
                      <span className="truncate">{evt.title}</span>
                    </div>
                  );
                })}

                {dayEvents.length > 3 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(dayEvents[0]);
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-white px-1 font-mono tabular-nums cursor-pointer"
                  >
                    +{dayEvents.length - 3} 更多日程…
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
