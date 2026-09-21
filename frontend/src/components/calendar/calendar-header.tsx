"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarCategory } from "@/types/calendar";
import {
  CALENDAR_CATEGORY_CONFIG,
  STANDARD_CALENDAR_CATEGORIES,
} from "@/config/calendar";
import {
  Calendar as CalendarIcon,
  ListFilter,
  Download,
  Printer,
  Loader2,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { cn } from "@/lib/utils";

export type CalendarViewMode = "month" | "agenda";

interface CalendarHeaderProps {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  selectedCategory: CalendarCategory | "all";
  onCategoryChange: (category: CalendarCategory | "all") => void;
  onExportIcs: () => void;
  onPrintPdf: () => void;
  totalEvents?: number;
  isLoading?: boolean;
}

export function CalendarHeader({
  viewMode,
  onViewModeChange,
  selectedCategory,
  onCategoryChange,
  onExportIcs,
  onPrintPdf,
  totalEvents,
  isLoading = false,
}: CalendarHeaderProps) {
  return (
    <div className="space-y-6">
      {/* 頂部標題與主操作卡片 (對齊使用指南之 AdminPageHeader 版面與位置) */}
      <AdminPageHeader
        title="社團行事曆"
        description="掌握全學期社課、工作坊、創客競賽與學校重大日程"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* 匯出本學年 ICS */}
          <Button
            variant="outline"
            onClick={onExportIcs}
            className="border-white/15 hover:border-white/30 text-slate-200 hover:text-white hover:bg-white/10 bg-black/40 h-10 px-3.5 text-xs sm:text-sm gap-2 cursor-pointer rounded-lg transition-colors shadow-xs"
            title="下載本學年日曆設定檔(.ics)"
            aria-label="下載本學年日曆設定檔(.ics)"
          >
            <Download className="w-4 h-4 text-sky-400 shrink-0" />
            匯出本學年.ics
          </Button>

          {/* 匯出本學年 PDF (A4 官方公版規格) */}
          <Button
            variant="outline"
            onClick={onPrintPdf}
            disabled={isLoading}
            className="border-white/15 hover:border-white/30 text-slate-200 hover:text-white hover:bg-white/10 bg-black/40 h-10 px-3.5 text-xs sm:text-sm gap-2 cursor-pointer rounded-lg transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            title={isLoading ? "資料載入中…" : "列印或匯出本學年行事曆PDF"}
            aria-label="列印或匯出本學年行事曆PDF"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-[#ffc000] animate-spin shrink-0" />
            ) : (
              <Printer className="w-4 h-4 text-[#ffc000] shrink-0" />
            )}
            {isLoading ? "載入中…" : "匯出本學年PDF"}
          </Button>
        </div>
      </AdminPageHeader>

      {/* 次級導覽與篩選工具列 (深色背景與質感邊框，徹底移除淺灰色) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 sm:p-2 bg-[#201d27] rounded-xl border border-white/10 shadow-sm">
        {/* 視圖切換 (月曆 / 即將到來) */}
        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => onViewModeChange("month")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer select-none",
              viewMode === "month"
                ? "bg-[#ffc000] text-[#15131b] font-bold shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>月曆檢視</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("agenda")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer select-none",
              viewMode === "agenda"
                ? "bg-[#ffc000] text-[#15131b] font-bold shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <ListFilter className="w-4 h-4" />
            <span>即將到來</span>
          </button>
        </div>

        {/* 類別篩選標籤 (移除點點，在深色背景呈現高質感) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => onCategoryChange("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 border",
              selectedCategory === "all"
                ? "bg-[#ffc000]/20 text-[#ffc000] border-[#ffc000]/40 font-semibold shadow-xs"
                : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10"
            )}
          >
            全部日程
          </button>

          {STANDARD_CALENDAR_CATEGORIES.map((item) => {
            const conf = CALENDAR_CATEGORY_CONFIG[item.value];
            const isSelected = selectedCategory === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onCategoryChange(item.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 border",
                  isSelected
                    ? `${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder} font-semibold ring-1 ring-white/15 shadow-xs`
                    : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
