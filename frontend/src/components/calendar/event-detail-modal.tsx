"use client";

import React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/types/calendar";
import {
  CALENDAR_CATEGORY_CONFIG,
  getWeekdayName,
  generateGoogleCalendarUrl,
} from "@/config/calendar";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ExternalLink,
  BookOpen,
  CalendarPlus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { LoginModal } from "@/components/auth/login-modal";

interface EventDetailModalProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailModal({
  event,
  open,
  onOpenChange,
}: EventDetailModalProps) {
  const { user } = useAuthStore();
  if (!event) return null;

  const config = CALENDAR_CATEGORY_CONFIG[event.category] || CALENDAR_CATEGORY_CONFIG.custom;
  const weekday = getWeekdayName(event.startDate);
  const isMultiDay = event.endDate && event.endDate !== event.startDate;
  const googleCalUrl = generateGoogleCalendarUrl(event);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#1e1c24] border-white/10 text-white p-6 shadow-2xl overflow-hidden rounded-2xl">
        <DialogHeader className="space-y-3 text-left">
          {/* 分類與狀態標籤 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
            >
              {config.label}
            </span>

            {event.week ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-white/5 text-slate-300 border border-white/10 tabular-nums">
                第 {event.week} 週
              </span>
            ) : null}

            {event.status === "tentative" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <AlertCircle className="w-3 h-3" />
                暫定排程
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                已確認
              </span>
            )}
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
            {event.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {event.title} 活動詳細資訊
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 text-sm text-slate-300">
          {/* 日期與時間 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <CalendarIcon className="w-5 h-5 text-[#ffc000] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-medium text-white flex items-center gap-2 flex-wrap">
                <span className="font-mono tabular-nums">{event.startDate}</span>
                {weekday ? <span>(週{weekday})</span> : null}
                {isMultiDay ? (
                  <>
                    <span className="text-slate-500">至</span>
                    <span className="font-mono tabular-nums">{event.endDate}</span>
                    <span>(週{getWeekdayName(event.endDate)})</span>
                  </>
                ) : null}
              </div>
              <p className="text-xs text-slate-400">
                學期：{event.semester || "未指定"}
              </p>
            </div>
          </div>

          {/* 地點與備註 */}
          {event.location ? (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <MapPin className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400 font-medium">地點 / 備註說明</p>
                <p className="text-white mt-0.5 whitespace-pre-wrap">{event.location}</p>
              </div>
            </div>
          ) : null}

          {/* 社課關聯卡片 */}
          {event.courseId ? (
            <div className="p-3 rounded-xl bg-[#ffc000]/10 border border-[#ffc000]/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[#ffc000] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#ffc000]">本課程已上架教學教材</p>
                  <p className="text-xs text-slate-300">可前往社課專區下載簡報、程式碼與影音</p>
                </div>
              </div>
              {user ? (
                <Link href="/dashboard/courses" className="shrink-0">
                  <Button size="sm" className="bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] font-bold text-xs h-8 gap-1 cursor-pointer">
                    前往社課
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              ) : (
                <LoginModal>
                  <Button size="sm" className="bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] font-bold text-xs h-8 gap-1 cursor-pointer shrink-0">
                    前往社課
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </LoginModal>
              )}
            </div>
          ) : null}
        </div>

        {/* 底部操作欄 */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 cursor-pointer rounded-lg text-xs h-8 px-4 transition-colors font-medium shadow-none"
          >
            關閉
          </Button>

          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button
              size="sm"
              className="bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] font-bold cursor-pointer rounded-lg text-xs gap-1.5 shadow-sm transition-all"
            >
              <CalendarPlus className="w-4 h-4" />
              加入 Google 日曆
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
