"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { addDays, format, isToday, startOfDay } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MachineAPI, type MachineOccupiedSlot } from "@/lib/api/machine";
import { cn } from "@/lib/utils";
import type { MachineApplication, MachineType } from "@/lib/types/machine";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

const HOUR_HEIGHT = 42;
const HOURS = Array.from({ length: 25 }, (_, idx) => idx);

const MACHINE_OPTIONS: Array<{
  value: MachineType;
  label: string;
  applyLabel: string;
  href: string;
}> = [
  {
    value: "3d-printer",
    label: "3D 列印",
    applyLabel: "借用3D列印",
    href: "/dashboard/machine/3d-printer",
  },
  {
    value: "laser-cutter",
    label: "雷射切割",
    applyLabel: "借用雷射切割",
    href: "/dashboard/machine/laser-cutter",
  },
];

type TimelineEvent = {
  id: string;
  status: string;
  start: Date;
  end: Date;
  top: number;
  height: number;
  displayStart: string;
  displayEnd: string;
};

function parseDate(raw?: string): Date | null {
  if (!raw) return null;
  const normalized = raw.trim().replace(/\//g, "-").replace(" ", "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDateTime(raw?: string) {
  const d = parseDate(raw);
  if (!d) return raw || "-";
  return d.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatTime(raw?: string) {
  const d = parseDate(raw);
  if (!d) return "--:--";
  return format(d, "HH:mm");
}

function formatTimeRange(start?: string, end?: string) {
  if (!start) return "-";
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "審核中":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          審核中
        </Badge>
      );
    case "已預約":
      return (
        <Badge
          variant="outline"
          className="bg-indigo-50 text-indigo-700 border-indigo-200"
        >
          已預約
        </Badge>
      );
    case "使用中":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
          使用中
        </Badge>
      );
    case "已完成":
      return <Badge variant="secondary">已完成</Badge>;
    case "不予通過":
      return <Badge variant="destructive">不予通過</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getCalendarTagClass(status: string) {
  switch (status) {
    case "審核中":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "已預約":
      return "bg-indigo-100 text-indigo-700 border border-indigo-200";
    case "使用中":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "已完成":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

export default function MachineReservationPage() {
  const [activeType, setActiveType] = useState<MachineType>("3d-printer");
  const [weekOffset, setWeekOffset] = useState(0);

  const {
    data: myApplications = [],
    isLoading: myAppsLoading,
    isFetching: myAppsFetching,
    refetch: refetchMyApps,
  } = useQuery<MachineApplication[]>({
    queryKey: ["my-machine-apps"],
    queryFn: async () => {
      const res = await MachineAPI.getMyApplications();
      return res;
    },
  });

  const {
    data: calendarSlots = [],
    isLoading: calendarLoading,
    isFetching: calendarFetching,
    refetch: refetchCalendar,
  } = useQuery<MachineOccupiedSlot[]>({
    queryKey: ["machine-calendar-slots", activeType],
    queryFn: async () => {
      const res = await MachineAPI.getOccupiedSlots(activeType, "calendar");
      return res;
    },
  });

  const refreshing = myAppsFetching || calendarFetching;

  const handleRefresh = async () => {
    await Promise.all([refetchMyApps(), refetchCalendar()]);
  };

  const typeCounts = useMemo(
    () => ({
      "3d-printer": myApplications.filter((app) => app.type === "3d-printer")
        .length,
      "laser-cutter": myApplications.filter(
        (app) => app.type === "laser-cutter",
      ).length,
    }),
    [myApplications],
  );

  const filteredMyApplications = useMemo(() => {
    const toTs = (raw?: string) => parseDate(raw)?.getTime() ?? -1;
    return [...myApplications]
      .filter((app) => app.type === activeType)
      .sort((a, b) => {
        const byCreatedAt = toTs(b.createdAt) - toTs(a.createdAt);
        if (byCreatedAt !== 0) return byCreatedAt;
        return toTs(b.useTime) - toTs(a.useTime);
      });
  }, [myApplications, activeType]);

  const weekStart = useMemo(
    () => startOfDay(addDays(new Date(), weekOffset * 7)),
    [weekOffset],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, idx) => addDays(weekStart, idx)),
    [weekStart],
  );

  const timelineByDay = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();

    for (const day of weekDays) {
      map.set(format(day, "yyyy-MM-dd"), []);
    }

    for (const slot of calendarSlots) {
      const rawStart = parseDate(slot.useTime);
      const rawEnd = parseDate(slot.expectedEndTime);
      if (!rawStart || !rawEnd || rawEnd.getTime() <= rawStart.getTime()) {
        continue;
      }

      for (const day of weekDays) {
        const dayKey = format(day, "yyyy-MM-dd");
        const dayStart = startOfDay(day);
        const dayEnd = addDays(dayStart, 1);

        if (rawEnd <= dayStart || rawStart >= dayEnd) continue;

        const clippedStart = rawStart > dayStart ? rawStart : dayStart;
        const clippedEnd = rawEnd < dayEnd ? rawEnd : dayEnd;
        const startMinutes =
          (clippedStart.getTime() - dayStart.getTime()) / (60 * 1000);
        const durationMinutes = Math.max(
          20,
          (clippedEnd.getTime() - clippedStart.getTime()) / (60 * 1000),
        );

        const event: TimelineEvent = {
          id: slot.id,
          status: slot.status,
          start: rawStart,
          end: rawEnd,
          top: (startMinutes / 60) * HOUR_HEIGHT,
          height: Math.max(20, (durationMinutes / 60) * HOUR_HEIGHT),
          displayStart: format(rawStart, "MM/dd HH:mm"),
          displayEnd: format(rawEnd, "MM/dd HH:mm"),
        };

        const list = map.get(dayKey) || [];
        list.push(event);
        map.set(dayKey, list);
      }
    }

    for (const [dayKey, list] of map.entries()) {
      list.sort((a, b) => a.start.getTime() - b.start.getTime());
      map.set(dayKey, list);
    }

    return map;
  }, [calendarSlots, weekDays]);

  const timelineHeight = HOUR_HEIGHT * 24;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <AdminPageHeader
        title="機器設備借用"
        description="查看社辦 3D 列印機與雷射切割機可用時段排程，送出切片與圖檔借用申請。"
      >
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* 3D 列印 / 雷射切割 切換膠囊 */}
          <div className="flex space-x-1 rounded-lg bg-black/40 border border-white/15 p-1 h-9 sm:h-10 items-center">
            {MACHINE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setActiveType(option.value)}
                className={`px-3 py-1 sm:py-1.5 h-full flex items-center justify-center text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap min-w-[96px] text-center ${
                  activeType === option.value
                    ? "bg-[#ffc000] text-black shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {option.label} ({typeCounts[option.value]})
              </button>
            ))}
          </div>

          {/* 重新整理按鈕 */}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={myAppsLoading || calendarLoading || refreshing}
            aria-busy={refreshing}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white cursor-pointer text-xs sm:text-sm h-9 sm:h-10"
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            重新整理
          </Button>

          <Link
            href={
              activeType === "3d-printer"
                ? "/dashboard/machine/3d-printer"
                : "/dashboard/machine/laser-cutter"
            }
            className="w-full sm:w-auto"
          >
            <Button className="w-full sm:w-[136px] bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold shadow-xs cursor-pointer text-xs sm:text-sm h-9 sm:h-10 justify-center">
              <Plus className="mr-1.5 h-4 w-4" />
              {activeType === "3d-printer" ? "借用 3D 列印" : "借用雷射切割"}
            </Button>
          </Link>
        </div>
      </AdminPageHeader>

      <Card className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle>機台使用情形</CardTitle>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 sm:h-10 sm:w-10"
                disabled={weekOffset === 0}
                onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="min-w-[168px] sm:min-w-[220px] text-center font-semibold text-xs sm:text-sm whitespace-nowrap">
                {format(weekStart, "yyyy/MM/dd", { locale: zhTW })} -{" "}
                {format(addDays(weekStart, 6), "yyyy/MM/dd", {
                  locale: zhTW,
                })}
              </p>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setWeekOffset((prev) => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {["審核中", "已預約", "使用中", "已完成"].map((status) => (
              <span
                key={status}
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  getCalendarTagClass(status),
                )}
              >
                {status}
              </span>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {calendarLoading ? (
            <div className="py-8 text-center text-muted-foreground flex justify-center items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              載入中...
            </div>
          ) : (
            <div className="h-[560px] border rounded-lg overflow-auto">
              <div className="w-full min-w-[720px]">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: "60px repeat(7, minmax(115px, 1fr))",
                  }}
                >
                  <div className="sticky top-0 left-0 z-30 bg-white border-b border-r p-2 text-xs font-semibold text-slate-500">
                    時間
                  </div>

                  {weekDays.map((day) => {
                    const dayKey = format(day, "yyyy-MM-dd");
                    return (
                      <div
                        key={dayKey}
                        className="sticky top-0 z-20 bg-white border-b border-r last:border-r-0 p-2"
                      >
                        <p className="text-xs text-slate-500">
                          {format(day, "MM/dd (EEE)", { locale: zhTW })}
                        </p>
                        {isToday(day) && (
                          <span className="inline-flex mt-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-black text-white">
                            TODAY
                          </span>
                        )}
                      </div>
                    );
                  })}

                  <div
                    className="relative sticky left-0 z-20 border-r bg-slate-50"
                    style={{ height: timelineHeight }}
                  >
                    {HOURS.map((hour) => (
                      <div
                        key={`hour-${hour}`}
                        className="absolute left-0 right-0 border-t first:border-t-0"
                        style={{
                          top: hour * HOUR_HEIGHT,
                          height: HOUR_HEIGHT,
                        }}
                      >
                        <span className="absolute -top-2.5 right-2 text-[10px] text-slate-500 bg-slate-50 px-1">
                          {String(hour).padStart(2, "0")}:00
                        </span>
                      </div>
                    ))}
                  </div>

                  {weekDays.map((day) => {
                    const dayKey = format(day, "yyyy-MM-dd");
                    const events = timelineByDay.get(dayKey) || [];

                    return (
                      <div
                        key={`${dayKey}-timeline`}
                        className="relative border-r last:border-r-0"
                        style={{ height: timelineHeight }}
                      >
                        {HOURS.map((hour) => (
                          <div
                            key={`${dayKey}-line-${hour}`}
                            className="absolute left-0 right-0 border-t first:border-t-0 border-slate-100"
                            style={{
                              top: hour * HOUR_HEIGHT,
                              height: HOUR_HEIGHT,
                            }}
                          />
                        ))}

                        {events.map((event, idx) => (
                          <div
                            key={`${dayKey}-${event.id}-${idx}-${event.top}`}
                            className={cn(
                              "absolute left-1 right-1 rounded-md px-1.5 py-1 text-[10px] leading-tight shadow-sm",
                              getCalendarTagClass(event.status),
                            )}
                            style={{
                              top: event.top,
                              minHeight: 20,
                              height: event.height,
                            }}
                            title={`${event.id} ${event.status} ${event.displayStart} - ${event.displayEnd}`}
                          >
                            <p className="font-semibold truncate">{event.id}</p>
                            <p className="truncate">
                              {format(event.start, "HH:mm")} -{" "}
                              {format(event.end, "HH:mm")}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/5">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">個人機台申請紀錄</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {myAppsLoading ? (
            <div className="py-12 text-center text-muted-foreground flex justify-center items-center text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              載入中...
            </div>
          ) : filteredMyApplications.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">目前沒有資料</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[920px] table-fixed">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[180px]">單號</TableHead>
                    <TableHead className="w-[120px]">狀態</TableHead>
                    <TableHead className="w-[170px]">申請時間</TableHead>
                    <TableHead className="w-[290px]">借用時段</TableHead>
                    <TableHead>用途</TableHead>
                    <TableHead className="w-[80px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMyApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-xs">
                        {app.id}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>{formatDateTime(app.createdAt)}</TableCell>
                      <TableCell className="text-sm">
                        {formatTimeRange(app.useTime, app.expectedEndTime)}
                      </TableCell>
                      <TableCell
                        className="truncate max-w-[280px]"
                        title={app.purpose}
                      >
                        {app.purpose}
                      </TableCell>
                      <TableCell className="text-right">
                        {app.fileLink && (
                          <a
                            href={app.fileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm" title="下載檔案">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
