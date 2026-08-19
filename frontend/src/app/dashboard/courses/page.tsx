'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Course } from '@/lib/types/course';
import { CourseDetailModal } from '@/components/course/CourseDetailModal';
import { Video, FileText, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

export default function CoursesPage() {
    const [selectedSemester, setSelectedSemester] = useState<string>('All');
    
    // Modal State
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    /* ---------- 資料載入（useQuery 快取）---------- */
    const { data: courses = [], isLoading: loading } = useQuery({
        queryKey: ['dashboard-courses'],
        queryFn: async () => {
            const res = await fetch('/api/courses');
            const json = await res.json();
            if (json.success) {
                const data: Course[] = json.data;
                data.sort((a, b) => {
                    if (a.semester !== b.semester) return b.semester.localeCompare(a.semester);
                    return b.uploadTime.localeCompare(a.uploadTime);
                });
                return data;
            }
            throw new Error('載入課程失敗');
        },
    });

    const semesters = useMemo(() => {
        const uniqueSemesters = Array.from(new Set(courses.map(c => c.semester))).sort().reverse();
        return ['All', ...uniqueSemesters];
    }, [courses]);

    const filteredCourses = selectedSemester === 'All' 
        ? courses 
        : courses.filter(c => c.semester === selectedSemester);

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <AdminPageHeader
                title="社團課程專區"
                description="瀏覽社課主題、講義教材與錄影回放。（資源僅限社團內部人員查看，請勿外流）"
            />
            
            {/* Semester Filter Track Tabs */}
            <div className="flex space-x-1.5 rounded-xl bg-slate-100 dark:bg-[#1a1820] border border-slate-200/80 dark:border-white/10 p-1 overflow-x-auto max-w-full w-fit">
                {semesters.map(sem => (
                    <button 
                        key={sem} 
                        onClick={() => setSelectedSemester(sem)}
                        className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                            selectedSemester === sem
                                ? "bg-white dark:bg-[#201e26] text-slate-900 dark:text-[#ffc000] shadow-xs"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                        {sem === 'All' ? '全部學期' : `${sem}`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[140px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-12 text-center text-muted-foreground text-sm">
                    目前沒有課程資料
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <Card 
                            key={course.id} 
                            className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm hover:border-[#ffc000] dark:hover:border-[#ffc000] transition-all cursor-pointer group flex flex-col h-full overflow-hidden p-0 gap-0"
                            onClick={() => {
                                setSelectedCourse(course);
                                setIsModalOpen(true);
                            }}
                        >
                            {/* 上半部：學期標籤、標題、上課時間、課程說明（向上對齊） */}
                            <div className="p-5 sm:p-6 pb-4 flex-1 flex flex-col space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <Badge variant="secondary" className="font-mono text-xs">{course.semester}</Badge>
                                    {course.permission === 'visitor' && (
                                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 dark:text-amber-400">公開</Badge>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-base sm:text-lg font-bold line-clamp-2 leading-snug min-h-[2.75rem] flex items-start group-hover:text-amber-600 dark:group-hover:text-[#ffc000] transition-colors">
                                        {course.title}
                                    </h3>
                                    {course.courseDate && (
                                        <p className="text-xs text-muted-foreground mt-1 truncate">
                                            課程時間: {course.courseDate}
                                        </p>
                                    )}
                                </div>

                                {/* 課程說明（向上對齊，固定預留空間，超出以刪節號省略） */}
                                <div className="h-10 overflow-hidden pt-0.5">
                                    <p className="line-clamp-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {course.description || "無課程說明"}
                                    </p>
                                </div>

                                {/* 附件數量與圖示：置於底部按鈕正上方 */}
                                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                                        <span>講義: {course.handouts?.length || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Video className="w-3.5 h-3.5 text-slate-400" />
                                        <span>影片: {course.videos?.length || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 底部灰色操作列：正中間對齊 */}
                            <div className="bg-slate-50 dark:bg-white/5 px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-[#ffc000] transition-colors">
                                <span>查看教材與錄影</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            
            <CourseDetailModal 
                course={selectedCourse}
                open={isModalOpen} 
                onOpenChange={setIsModalOpen} 
            />
        </div>
    );
}
