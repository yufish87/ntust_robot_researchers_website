"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CalendarEvent, CalendarCategory } from "@/types/calendar";
import { getCurrentSemester } from "@/config/calendar";
import { CalendarHeader, CalendarViewMode } from "./calendar-header";
import { ModernCalendarView } from "./modern-calendar-view";
import { AgendaListView } from "./agenda-list-view";
import { OfficialTableView } from "./official-table-view";
import { EventDetailModal } from "./event-detail-modal";
import { CourseDetailModal } from "@/components/course/CourseDetailModal";
import { Course } from "@/lib/types/course";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function CalendarClientPage() {
  // 自動偵測當前學期 (用於 PDF 列印與 ICS 匯出)
  const currentSem = useMemo(() => getCurrentSemester(), []);

  // 狀態管理：首頁固定顯示所有活動日程，僅供切換月曆/即將到來與類別
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [selectedCategory, setSelectedCategory] = useState<CalendarCategory | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 取得行事曆所有活動日程資料
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      const res = await axios.get("/api/calendar");
      return res.data?.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 分鐘快取
  });

  // 取得公開社課資料（用於活動詳情中直接開啟社課 Modal）
  const { data: publicCourses = [] } = useQuery<Course[]>({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const res = await axios.get("/api/courses/public");
      return res.data?.data || [];
    },
    staleTime: 1000 * 60,
  });

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  // 依類別進行客戶端篩選
  const filteredEvents = useMemo(() => {
    if (selectedCategory === "all") return events;
    return events.filter(
      (e) =>
        e.category === selectedCategory ||
        (selectedCategory === "holiday" && e.category === "exam")
    );
  }, [events, selectedCategory]);

  // 開啟活動詳情
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // 匯出本學年 ICS (自動帶入偵測到的當前學期/學年)
  const handleExportIcs = () => {
    window.open(`/api/calendar/ics?semester=${encodeURIComponent(currentSem)}`, "_blank");
  };

  // 匯出本學年 PDF / 列印公版 (觸發瀏覽器列印對齊 A4 規格，預設 PDF 檔名為「臺科大機器人研究社_社團行事曆_${currentSem}.pdf」)
  const handlePrintPdf = () => {
    if (isLoading) {
      toast({
        title: "行事曆日程載入中",
        description: "系統正在同步活動日程，請稍候載入完成再進行列印。",
      });
      return;
    }

    const originalTitle = document.title;
    const printTitle = `臺科大機器人研究社_社團行事曆_${currentSem}`;
    document.title = printTitle;

    const cleanup = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);

    // 緩衝 100ms 確保 DOM 與標題最新狀態已更新
    setTimeout(() => {
      try {
        window.print();
      } finally {
        // 列印視窗關閉後恢復原本網頁標題
        setTimeout(cleanup, 500);
      }
    }, 100);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 print:max-w-none print:p-0 print:space-y-0">
      {/* 網頁端互動區域 (瀏覽模式，包含月曆與即將到來，列印時隱藏) */}
      <div className="space-y-6 w-full print:hidden">
        {/* 頂部控制列 */}
        <CalendarHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onExportIcs={handleExportIcs}
          onPrintPdf={handlePrintPdf}
          totalEvents={events.length}
          isLoading={isLoading}
        />

        {/* 載入中骨架 */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#ffc000]" />
            <p className="text-xs font-mono tracking-wider">載入社團行事曆中…</p>
          </div>
        ) : (
          <div className="w-full">
            {viewMode === "month" && (
              <ModernCalendarView
                events={filteredEvents}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {viewMode === "agenda" && (
              <AgendaListView
                events={filteredEvents}
                onSelectEvent={handleSelectEvent}
              />
            )}
          </div>
        )}
      </div>

      {/* 公版 A4 列印 / 轉存 PDF 專用區塊 (網頁瀏覽時隱藏，觸發列印時顯現，自動套用偵測當前學期) */}
      <div className="hidden print:block w-full">
        <OfficialTableView
          events={events}
          selectedSemester={currentSem}
        />
      </div>

      {/* 詳細資料彈窗 */}
      <EventDetailModal
        event={selectedEvent}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        publicCourses={publicCourses}
        onOpenCourseModal={(course) => {
          setSelectedCourse(course);
          setIsCourseModalOpen(true);
        }}
      />

      {/* 社課詳情彈窗 (行事曆中點擊公開社課直接開啟) */}
      <CourseDetailModal
        course={selectedCourse}
        open={isCourseModalOpen}
        onOpenChange={setIsCourseModalOpen}
      />
    </div>
  );
}
