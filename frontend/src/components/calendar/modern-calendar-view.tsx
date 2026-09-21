"use client";

import React, { useState, useMemo } from "react";
import { CalendarEvent } from "@/types/calendar";
import { CALENDAR_CATEGORY_CONFIG } from "@/config/calendar";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModernCalendarViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export function ModernCalendarView({
  events,
  onSelectEvent,
}: ModernCalendarViewProps) {
  // 當前瀏覽的年份與月份（0-indexed）
  const [currentDate, setCurrentDate] = useState(() => {
    // 若有事件，預設為第一筆事件的月份或當前月
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
      // 處理多天事件跨越的每一天
      const start = new Date(evt.startDate);
      const end = evt.endDate ? new Date(evt.endDate) : new Date(evt.startDate);

      const cur = new Date(start);
      // 防止無窮迴圈上限 60 天
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

  // 計算月曆網格（包含前置上個月補齊天數與後置下個月天數，固定每週日開始）
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

    // 1. 上個月補齊
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

    // 3. 下個月補齊至 35 或 42 格 (7 的倍數)
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
    <div className="rounded-xl bg-[#201e26] border border-white/10 p-4 sm:p-6 shadow-sm space-y-4">
      {/* 月曆頂部導覽 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {year} 年 {monthNames[month]}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 h-7 text-xs px-2.5 rounded-md cursor-pointer gap-1"
          >
            <Sparkles className="w-3 h-3 text-[#ffc000]" />
            回到今天
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
            aria-label="上個月"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
            aria-label="下個月"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 星期標頭 (週日 ~ 週六) */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-semibold text-slate-400 py-1.5 border-b border-white/5">
        <span className="text-rose-400">週日</span>
        <span>週一</span>
        <span>週二</span>
        <span>週三</span>
        <span>週四</span>
        <span>週五</span>
        <span className="text-sky-400">週六</span>
      </div>

      {/* 日期網格 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarCells.map((cell) => {
          const dayEvents = eventsByDate.get(cell.dateStr) || [];

          return (
            <div
              key={cell.dateStr}
              className={`min-h-[85px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col justify-between ${
                cell.isToday
                  ? "bg-white/[0.06] border-[#ffc000]/60 shadow-[0_0_15px_rgba(255,192,0,0.12)]"
                  : cell.isCurrentMonth
                  ? "bg-white/[0.02] border-white/5 hover:border-white/20"
                  : "bg-transparent border-transparent opacity-35"
              }`}
            >
              {/* 日期數字 */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold font-mono tabular-nums leading-none ${
                    cell.isToday
                      ? "text-[#1e1c24] bg-[#ffc000] w-5 h-5 rounded-full flex items-center justify-center font-black"
                      : cell.isCurrentMonth
                      ? "text-slate-200"
                      : "text-slate-600"
                  }`}
                >
                  {cell.dayNum}
                </span>

                {dayEvents.length > 0 && (
                  <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#ffc000]/80" />
                )}
              </div>

              {/* 活動徽章列表 (最多顯示 2 個，多出顯示數字) */}
              <div className="space-y-1 flex-1 overflow-hidden">
                {dayEvents.slice(0, 2).map((evt) => {
                  const conf = CALENDAR_CATEGORY_CONFIG[evt.category] || CALENDAR_CATEGORY_CONFIG.custom;

                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => onSelectEvent(evt)}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate block cursor-pointer transition-all hover:brightness-125 hover:border-white/30 border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}
                    >
                      <span className="truncate">{evt.title}</span>
                    </button>
                  );
                })}

                {dayEvents.length > 2 && (
                  <button
                    type="button"
                    onClick={() => onSelectEvent(dayEvents[0])}
                    className="w-full text-left text-[10px] text-slate-400 hover:text-white px-1 font-mono tabular-nums cursor-pointer"
                  >
                    +{dayEvents.length - 2} 更多
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
