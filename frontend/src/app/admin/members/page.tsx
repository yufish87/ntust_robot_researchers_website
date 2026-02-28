"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { UserAPI } from "@/lib/api/user";
import type { UserProfile, UserRole } from "@/lib/types/user";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  MoreHorizontal,
  Search,
  ShieldCheck,
  ShieldMinus,
  UserX,
} from "lucide-react";

/** Badge variant 依身份 */
function roleBadge(role: UserRole) {
  switch (role) {
    case "owner":
      return (
        <Badge variant="destructive" className="text-xs">
          owner
        </Badge>
      );
    case "admin":
      return (
        <Badge variant="default" className="text-xs">
          admin
        </Badge>
      );
    case "member":
      return (
        <Badge variant="secondary" className="text-xs">
          member
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {role}
        </Badge>
      );
  }
}

/** 狀態顯示 */
function statusBadge(status: string) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
        啟用
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600">
      已停用
    </span>
  );
}

export default function AdminMembersPage() {
  const { user: currentUser } = useAuthStore();
  const { toast } = useToast();

  // Data
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Role change Dialog
  const [roleTarget, setRoleTarget] = useState<UserProfile | null>(null);
  const [roleNewRole, setRoleNewRole] = useState<"member" | "admin">("member");
  const [roleLoading, setRoleLoading] = useState(false);

  // Delete AlertDialog
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await UserAPI.listUsers();
      setUsers(result.users);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "載入失敗",
        description: error.message || "無法取得使用者列表",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (
          !u.studentId.toLowerCase().includes(q) &&
          !u.name.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      // Role filter
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      // Status filter
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Handlers
  const handleRoleChange = async () => {
    if (!roleTarget) return;
    setRoleLoading(true);
    try {
      await UserAPI.updateRole({
        targetStudentId: roleTarget.studentId,
        newRole: roleNewRole,
      });
      toast({
        title: "身份變更成功",
        description: `${roleTarget.name} 已設為${roleNewRole === "admin" ? "管理員" : "社員"}。`,
      });
      setRoleTarget(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "變更失敗",
        description: error.message,
      });
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await UserAPI.adminDelete({
        targetStudentId: deleteTarget.studentId,
      });
      toast({
        title: "帳號已停用",
        description: `${deleteTarget.name} (${deleteTarget.studentId}) 的帳號已停用。`,
      });
      setDeleteTarget(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "停用失敗",
        description: error.message,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const isSelf = (u: UserProfile) =>
    currentUser?.studentId === u.studentId;

  return (
    <div className="container p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">人員管理</h1>
        <p className="text-muted-foreground">
          管理社團成員的身份與帳號狀態。
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋學號或姓名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="身份" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部身份</SelectItem>
            <SelectItem value="owner">owner</SelectItem>
            <SelectItem value="admin">admin</SelectItem>
            <SelectItem value="member">member</SelectItem>
            <SelectItem value="visitor">visitor</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="active">啟用</SelectItem>
            <SelectItem value="deleted">已停用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[120px]">學號</TableHead>
              <TableHead className="w-[100px]">姓名</TableHead>
              <TableHead className="w-[120px]">系所</TableHead>
              <TableHead className="w-[80px]">年級</TableHead>
              <TableHead className="w-[90px]">身份</TableHead>
              <TableHead className="w-[80px]">狀態</TableHead>
              <TableHead className="w-[140px]">最近登入</TableHead>
              <TableHead className="w-[60px] text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    載入中...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center h-32 text-muted-foreground"
                >
                  {users.length === 0
                    ? "尚無使用者資料。"
                    : "沒有符合篩選條件的使用者。"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.studentId}>
                  <TableCell className="font-mono text-xs">
                    {u.studentId}
                  </TableCell>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-sm">
                    {u.department || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{u.grade || "—"}</TableCell>
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell>{statusBadge(u.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.lastLoginTime || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {u.role === "owner" ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* 設為管理員 */}
                          {u.role === "member" && (
                            <DropdownMenuItem
                              onClick={() => {
                                setRoleTarget(u);
                                setRoleNewRole("admin");
                              }}
                            >
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              設為管理員
                            </DropdownMenuItem>
                          )}
                          {/* 設為社員 */}
                          {u.role === "admin" && !isSelf(u) && (
                            <DropdownMenuItem
                              onClick={() => {
                                setRoleTarget(u);
                                setRoleNewRole("member");
                              }}
                            >
                              <ShieldMinus className="h-4 w-4 mr-2" />
                              設為社員
                            </DropdownMenuItem>
                          )}
                          {/* 停用帳號 */}
                          {!isSelf(u) && u.status === "active" && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeleteTarget(u)}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              停用帳號
                            </DropdownMenuItem>
                          )}
                          {/* 自己的 admin 行：只能停用自己以外的 */}
                          {isSelf(u) && (
                            <DropdownMenuItem disabled>
                              <span className="text-xs text-muted-foreground">
                                無法對自己操作
                              </span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer count */}
      {!loading && (
        <p className="text-sm text-muted-foreground text-center">
          共 {filteredUsers.length} 筆
          {filteredUsers.length !== users.length &&
            `（全部 ${users.length} 筆）`}
        </p>
      )}

      {/* Role Change Dialog */}
      <Dialog
        open={!!roleTarget}
        onOpenChange={(open) => !open && setRoleTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認變更身份</DialogTitle>
            <DialogDescription>
              確定要將{" "}
              <span className="font-semibold">
                {roleTarget?.name} ({roleTarget?.studentId})
              </span>{" "}
              的身份變更為
              <span className="font-semibold">
                {roleNewRole === "admin" ? " 管理員" : " 社員"}
              </span>
              嗎？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleTarget(null)}>
              取消
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={roleLoading}
              className="min-w-[100px]"
            >
              {roleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "確認變更"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要停用此帳號嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              即將停用{" "}
              <span className="font-semibold">
                {deleteTarget?.name} ({deleteTarget?.studentId})
              </span>{" "}
              的帳號。停用後該使用者將無法登入系統。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 min-w-[100px]"
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "確認停用"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
