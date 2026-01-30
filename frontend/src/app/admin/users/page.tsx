'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface User {
    studentId: string;
    name: string;
    department: string;
    role: 'admin' | 'member' | 'owner';
    status: 'active' | 'suspended' | 'deleted';
    loginCount: number;
    lastLoginTime: string;
}

export default function AdminUsersPage() {
    const { user, token, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        if (user && user.role !== 'admin' && user.role !== 'owner') {
            alert("No permission");
            router.push('/dashboard');
            return;
        }

        if (token) {
             fetchUsers();
        }
    }, [user, isAuthenticated, router, token]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.post('/user/list', {
                requesterId: user?.studentId,
                token: token
            });
            console.log("User List Response:", res.data); // Debug

            if (res.data.success) {
                const list = res.data.data;
                if (Array.isArray(list)) {
                     setUsers(list);
                } else {
                     console.error("User list expected array, got:", typeof list);
                     setUsers([]);
                }
            } else {
                console.error("Failed to fetch users:", res.data.message);
                alert("無法獲取使用者列表: " + res.data.message);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (targetUser: User) => {
        setEditingUser(targetUser);
        setEditForm({
            role: targetUser.role,
            status: targetUser.status
        });
    };

    const handleSave = async () => {
        if (!editingUser || !user) return;
        setSaveLoading(true);
        try {
            const res = await api.post('/user/update', {
                requesterId: user.studentId,
                targetStudentId: editingUser.studentId,
                role: editForm.role,
                status: editForm.status,
                token: token
            });

            if (res.data.success) {
                // Update local list
                setUsers(users.map(u => 
                    u.studentId === editingUser.studentId 
                        ? { ...u, ...editForm } as User 
                        : u
                ));
                setEditingUser(null);
                alert("更新成功");
            } else {
                alert("更新失敗: " + res.data.message);
            }
        } catch (error: any) {
            alert("更新錯誤: " + (error.response?.data?.message || error.message));
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading users...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">使用者管理</h1>
                <Button onClick={fetchUsers} variant="outline">重新整理</Button>
            </div>

            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>學號</TableHead>
                            <TableHead>姓名</TableHead>
                            <TableHead>科系</TableHead>
                            <TableHead>角色</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead>登入次數</TableHead>
                            <TableHead>操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u) => (
                            <TableRow key={u.studentId}>
                                <TableCell className="font-medium">{u.studentId}</TableCell>
                                <TableCell>{u.name}</TableCell>
                                <TableCell>{u.department}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        u.role === 'admin' ? 'bg-red-100 text-red-800' : 
                                        u.role === 'owner' ? 'bg-purple-100 text-purple-800' : 
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {u.role}
                                    </span>
                                </TableCell>
                                <TableCell>
                                     <span className={`px-2 py-1 rounded text-xs ${
                                        u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {u.status}
                                    </span>
                                </TableCell>
                                <TableCell>{u.loginCount}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(u)}>
                                        編輯
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>編輯使用者: {editingUser?.name}</DialogTitle>
                        <DialogDescription>
                            學號: {editingUser?.studentId}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">角色</Label>
                            <Select 
                                value={editForm.role} 
                                onValueChange={(val: any) => setEditForm({...editForm, role: val})}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="選擇角色" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="owner">Owner</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">狀態</Label>
                             <Select 
                                value={editForm.status} 
                                onValueChange={(val: any) => setEditForm({...editForm, status: val})}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="選擇狀態" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="deleted">Deleted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingUser(null)}>取消</Button>
                        <Button onClick={handleSave} disabled={saveLoading}>
                            {saveLoading ? '儲存中...' : '儲存變更'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
