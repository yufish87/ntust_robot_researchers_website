"use client";

import React from "react";
import { CalendarEvent } from "@/types/calendar";
import {
  CALENDAR_CATEGORY_CONFIG,
  getWeekdayName,
  generateGoogleCalendarUrl,
} from "@/config/calendar";
import {
  CalendarDays,
  MapPin,
  CalendarPlus,
  BookOpen,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgendaListViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export function AgendaListView({
  events,
  onSelectEvent,
}: AgendaListViewProps) {
  if (events.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
        <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">目前無符合條件之日程</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          可嘗試更換學期或重設類別篩選標籤查閱其他社團日程。
        </p>
      </div>
    );
  }

  // 依月份或週次進行分組（若有週次依週次排序）
  return (
    <div className="space-y-3">
      {events.map((evt) => {
        const conf = CALENDAR_CATEGORY_CONFIG[evt.category] || CALENDAR_CATEGORY_CONFIG.custom;
        const weekday = getWeekdayName(evt.startDate);
        const googleCalUrl = generateGoogleCalendarUrl(evt);

        return (
          <div
            key={evt.id}
            onClick={() => onSelectEvent(evt)}
            className={`group p-4 sm:p-5 rounded-xl bg-[#201e26] border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 ${conf.accentBorder} ${conf.cardBg}`}
          >
            {/* 左側：日期方塊與活動主要內容 */}
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              {/* 日期小徽章 */}
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-slate-400">
                  週{weekday}
                </span>
                <span className="text-lg sm:text-xl font-extrabold font-mono text-white tabular-nums">
                  {evt.startDate.slice(8)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {evt.startDate.slice(5, 7)}月
                </span>
              </div>

              {/* 活動資訊 */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center justify-center shrink-0 w-[88px] py-0.5 rounded-full text-[11px] font-semibold border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}
                  >
                    {conf.label}
                  </span>

                  {evt.week ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10 tabular-nums">
                      第 {evt.week} 週
                    </span>
                  ) : null}

                  {evt.status === "tentative" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      暫定
                    </span>
                  ) : null}

                  {evt.courseId ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#ffc000] font-medium bg-[#ffc000]/10 px-1.5 py-0.5 rounded">
                      <BookOpen className="w-3 h-3" />
                      附教材
                    </span>
                  ) : null}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#ffc000] transition-colors truncate">
                  {evt.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                  <span className="text-[#ffc000]/90 font-mono">
                    {evt.category === "course" ? "19:00 - 21:00" : "08:00 - 17:00"}
                  </span>
                  {evt.location ? (
                    <>
                      <span>•</span>
                      <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{evt.location}</span>
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {/* 右側：操作按鈕群 */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex"
                title="加入 Google 日曆"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 text-xs gap-1.5 cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">加入日曆</span>
                </Button>
              </a>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg text-slate-400 group-hover:text-white group-hover:bg-white/10 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
