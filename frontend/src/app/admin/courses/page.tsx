'use client';

import { useEffect, useState } from 'react';
import { Course } from '@/lib/types/course'; // Use interface
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { CourseForm } from '@/components/admin/courses/CourseForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    
    // Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Alert Dialog State
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/courses'); // Admin can view all courses via normal list or specialized admin list if needed. Assuming /api/courses returns all.
            const json = await res.json();
            if (json.success) {
                setCourses(json.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: any) => {
        setIsSubmitting(true);
        try {
            const url = '/api/admin/courses';
            const method = editingCourse ? 'PUT' : 'POST';
            const body = editingCourse ? { ...values, id: editingCourse.id } : values;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const json = await res.json();

            if (json.success) {
                toast({
                    title: editingCourse ? "更新成功" : "新增成功",
                    description: `課程已${editingCourse ? "更新" : "建立"}。`
                });
                setIsFormOpen(false);
                setEditingCourse(null);
                fetchCourses();
            } else {
                toast({
                    variant: "destructive",
                    title: "操作失敗",
                    description: json.message || "未知錯誤"
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "系統錯誤",
                description: "無法連線至伺服器"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            const res = await fetch('/api/admin/courses', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deletingId })
            });
            const json = await res.json();

            if (json.success) {
                toast({
                    title: "刪除成功",
                    description: "課程已永久刪除。"
                });
                fetchCourses();
            } else {
                toast({
                    variant: "destructive",
                    title: "刪除失敗",
                    description: json.message
                });
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: "系統錯誤",
                description: "無法連線至伺服器"
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="container p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">課程管理</h1>
                <Button onClick={() => { setEditingCourse(null); setIsFormOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> 新增課程
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>學期</TableHead>
                            <TableHead>課程名稱</TableHead>
                            <TableHead>權限</TableHead>
                            <TableHead>資源數 (講義/影片/其他)</TableHead>
                            <TableHead>上傳時間</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">載入中...</TableCell>
                            </TableRow>
                        ) : courses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">無課程資料</TableCell>
                            </TableRow>
                        ) : (
                            courses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell>{course.semester}</TableCell>
                                    <TableCell className="font-medium">{course.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={course.permission === 'visitor' ? 'secondary' : 'outline'}>
                                            {course.permission === 'visitor' ? 'Visitor' : 'Member'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {course.handouts?.length || 0} / {course.videos?.length || 0} / {course.others?.length || 0}
                                    </TableCell>
                                    <TableCell>{course.uploadTime}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => { setEditingCourse(course); setIsFormOpen(true); }}>
                                                    <Pencil className="mr-2 h-4 w-4" /> 編輯
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeletingId(course.id)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> 刪除
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingCourse ? "編輯課程" : "新增課程"}</DialogTitle>
                    </DialogHeader>
                    <CourseForm 
                        defaultValues={editingCourse || {}} 
                        onSubmit={handleSubmit} 
                        isLoading={isSubmitting} 
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確定要刪除此課程嗎？</AlertDialogTitle>
                        <AlertDialogDescription>
                            此動作無法復原。這將會永久刪除該課程及其所有連結資料。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">確任刪除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
