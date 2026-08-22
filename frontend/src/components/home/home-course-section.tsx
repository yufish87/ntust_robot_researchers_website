"use client";

import { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  Calendar,
  BookOpen,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Course } from "@/lib/types/course";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CourseDetailModal } from "@/components/course/CourseDetailModal";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";

interface CourseSectionProps {
  className?: string;
  memberView?: boolean;
}

export function CourseSection({
  className,
  memberView = false,
}: CourseSectionProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);
  const { user } = useAuthStore();

  // Modal State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const endpoint = memberView ? "/api/courses" : "/api/courses/public";
        const res = await fetch(endpoint);

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const json = await res.json();
        if (json.success) {
          let data = json.data as Course[];

          if (!memberView) {
            // 公開版: 顯示未來 45 天課程或最近課程
            const now = new Date();
            const future45d = new Date();
            future45d.setDate(now.getDate() + 45);

            const upcoming = data.filter((c) => {
              if (!c.courseDate) return false;
              const dateStr = c.courseDate.replace(" ", "T");
              const cTime = new Date(dateStr);
              return !isNaN(cTime.getTime()) && cTime >= now && cTime <= future45d;
            });

            if (upcoming.length > 0) {
              const sorted = upcoming.sort((a, b) =>
                (a.courseDate || "").localeCompare(b.courseDate || ""),
              );
              setCourses(sorted.slice(0, 6));
            } else {
              // 若近期無課，顯示最近 5 堂課
              const sorted = data.sort((a, b) =>
                (b.courseDate || b.uploadTime || "").localeCompare(
                  a.courseDate || a.uploadTime || "",
                ),
              );
              setCourses(sorted.slice(0, 5));
            }
          } else {
            // 社員版
            const now = Date.now();
            const withDate = data.filter((c) => c.courseDate);
            const sorted = withDate.sort((a, b) => {
              const diffA = Math.abs(
                new Date(a.courseDate!.replace(" ", "T")).getTime() - now,
              );
              const diffB = Math.abs(
                new Date(b.courseDate!.replace(" ", "T")).getTime() - now,
              );
              return diffA - diffB;
            });
            setCourses(sorted.slice(0, 5));
          }
        }
      } catch (error) {
        console.error("Failed to fetch courses", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [memberView]);

  return (
    <section id="courses" className={cn("w-full scroll-mt-24", className)}>
      {/* 標題與說明 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#ffc000] text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>ROBOTICS ACADEMY & WORKSHOPS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            社課資訊與教學資源
          </h2>
        </div>
      </div>

      {/* 課程表格/清單 (Courses Matrix) */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full bg-white/10 rounded-lg" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
            <p>目前尚無排定的公開社課</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {courses.map((course) => {
              const isPast = course.courseDate
                ? new Date(course.courseDate.replace(" ", "T")) < new Date()
                : false;

              return (
                <div
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course);
                    setIsModalOpen(true);
                  }}
                  className={cn(
                    "p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 hover:bg-white/[0.03] transition-all cursor-pointer group",
                    isPast && "opacity-75 hover:opacity-100",
                  )}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCourse(course);
                      setIsModalOpen(true);
                    }
                  }}
                >
                  {/* 左側：學期、名稱、主軸 */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <Badge
                      variant="outline"
                      className="bg-[#ffc000]/10 text-[#ffc000] border-[#ffc000]/30 font-mono text-xs px-2.5 py-1 shrink-0"
                    >
                      {course.semester}
                    </Badge>

                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white group-hover:text-[#ffc000] transition-colors truncate">
                        {course.title}
                      </h4>
                      {course.description && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {course.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 右側：日期、狀態、附件與操作 */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 text-xs">
                    <div className="flex items-center gap-2 text-slate-300 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-[#ffc000]" />
                      <span>{course.courseDate || course.uploadTime.split(" ")[0]}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPast ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0.5 border-slate-700 text-slate-400 bg-black/20"
                        >
                          已結束
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0.5 border-emerald-500/40 text-emerald-300 bg-emerald-500/10 font-bold animate-pulse"
                        >
                          即將舉行
                        </Badge>
                      )}

                      {course.handouts && course.handouts.length > 0 && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-white/5 px-2 py-1 rounded-md">
                          <BookOpen className="w-3 h-3 text-[#ffc000]" />
                          {course.handouts.length} 份講義
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 底部解鎖提示 */}
        <div className="p-4 sm:p-5 bg-white/[0.02] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Lock className="w-4 h-4 text-[#ffc000] shrink-0" />
            <span>
              登入資源管理系統可解鎖歷年完整社課講義、實作程式與錄影檔案。
            </span>
          </div>

          {user ? (
            <Link href="/dashboard/courses">
              <Button
                size="sm"
                className="bg-white/10 hover:bg-[#ffc000] hover:text-[#1e1c24] text-white text-xs font-bold gap-1.5 h-8 cursor-pointer transition-colors"
              >
                前往社員社課專區
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <LoginModal>
              <Button
                size="sm"
                className="bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] text-xs font-bold gap-1.5 h-8 cursor-pointer"
              >
                登入查看完整資源
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </LoginModal>
          )}
        </div>
      </div>

      {/* 課程詳情彈窗 */}
      <CourseDetailModal
        course={selectedCourse}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </section>
  );
}
