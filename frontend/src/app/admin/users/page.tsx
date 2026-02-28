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
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Copy,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  ShieldMinus,
  UserX,
} from "lucide-react";

/** 身份中文對照 */
const ROLE_LABEL: Record<string, string> = {
  owner: "最高管理員",
  admin: "管理員",
  member: "社員",
  visitor: "訪客",
};

/** Badge variant 依身份 */
function roleBadge(role: UserRole) {
  const label = ROLE_LABEL[role] || role;
  switch (role) {
    case "owner":
      return (
        <Badge variant="destructive" className="text-xs">
          {label}
        </Badge>
      );
    case "admin":
      return (
        <Badge variant="default" className="text-xs">
          {label}
        </Badge>
      );
    case "member":
      return (
        <Badge variant="secondary" className="text-xs">
          {label}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {label}
        </Badge>
      );
  }
}

/** 格式化登入時間 */
function formatLoginTime(raw: string): string {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return raw;
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

/** Tab 篩選定義 */
type TabFilter = "all" | "member" | "admin" | "disabled";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const { toast } = useToast();

  // Data
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<TabFilter>("all");

  // Role change Dialog
  const [roleTarget, setRoleTarget] = useState<UserProfile | null>(null);
  const [roleNewRole, setRoleNewRole] = useState<"member" | "admin">("member");
  const [roleLoading, setRoleLoading] = useState(false);

  // Delete AlertDialog
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Generate Code Dialog
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeDesc, setCodeDesc] = useState("");
  const [codeValidUntil, setCodeValidUntil] = useState("");
  const [codeUsageLimit, setCodeUsageLimit] = useState(0);
  const [codeLoading, setCodeLoading] = useState(false);

  // Code Result Dialog
  const [codeResult, setCodeResult] = useState<string | null>(null);

  // Add User Dialog
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addStudentId, setAddStudentId] = useState("");
  const [addName, setAddName] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Fetch
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await UserAPI.listUsers();
      setUsers(result.users);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "無法取得使用者列表";
      toast({
        variant: "destructive",
        title: "載入失敗",
        description: message,
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
      // Tab filter
      switch (tabFilter) {
        case "member":
          return u.role === "member" && u.status === "active";
        case "admin":
          return (
            (u.role === "admin" || u.role === "owner") &&
            u.status === "active"
          );
        case "disabled":
          return u.status === "deleted";
        case "all":
        default:
          return true;
      }
    });
  }, [users, search, tabFilter]);

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "變更失敗";
      toast({
        variant: "destructive",
        title: "變更失敗",
        description: message,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "停用失敗";
      toast({
        variant: "destructive",
        title: "停用失敗",
        description: message,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setCodeLoading(true);
    try {
      const result = await UserAPI.generateCode({
        description: codeDesc,
        validUntil: codeValidUntil,
        usageLimit: codeUsageLimit,
      });
      setCodeDialogOpen(false);
      setCodeDesc("");
      setCodeValidUntil("");
      setCodeUsageLimit(0);
      setCodeResult(result.code);
      toast({ title: "驗證碼已產生" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "產生失敗";
      toast({
        variant: "destructive",
        title: "產生驗證碼失敗",
        description: message,
      });
    } finally {
      setCodeLoading(false);
    }
  };

  const handleAddUser = async () => {
    setAddLoading(true);
    try {
      await UserAPI.adminAddUser({
        studentId: addStudentId,
        name: addName,
      });
      toast({
        title: "人員已新增",
        description: `${addName} (${addStudentId}) 已新增，預設密碼為學號。`,
      });
      setAddUserOpen(false);
      setAddStudentId("");
      setAddName("");
      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "新增失敗";
      toast({
        variant: "destructive",
        title: "新增人員失敗",
        description: message,
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "已複製到剪貼簿" });
    } catch {
      toast({ variant: "destructive", title: "複製失敗" });
    }
  };

  const isSelf = (u: UserProfile) => currentUser?.studentId === u.studentId;

  return (
    <div className="container p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">人員管理</h1>
          <p className="text-muted-foreground">
            管理社團成員、權限與驗證碼。
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCodeDialogOpen(true)}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            產生註冊碼
          </Button>
          <Button onClick={() => setAddUserOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增人員
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋學號或姓名..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={tabFilter}
        onValueChange={(v) => setTabFilter(v as TabFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="member">社員</TabsTrigger>
          <TabsTrigger value="admin">管理員</TabsTrigger>
          <TabsTrigger value="disabled">已停用</TabsTrigger>
        </TabsList>
      </Tabs>

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
                    {formatLoginTime(u.lastLoginTime)}
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
                          {!isSelf(u) && u.status === "active" && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeleteTarget(u)}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              停用帳號
                            </DropdownMenuItem>
                          )}
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

      {/* ========== Dialogs ========== */}

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
            <AlertDialogCancel disabled={deleteLoading}>取消</AlertDialogCancel>
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

      {/* Generate Code Dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>產生註冊驗證碼</DialogTitle>
            <DialogDescription>
              產生一組驗證碼供新成員註冊使用。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="code-desc">說明（選填）</Label>
              <Input
                id="code-desc"
                placeholder="例：113-2 新進社員"
                value={codeDesc}
                onChange={(e) => setCodeDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code-valid">失效時間（選填）</Label>
              <Input
                id="code-valid"
                type="datetime-local"
                value={codeValidUntil}
                onChange={(e) => setCodeValidUntil(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code-limit">使用次數限制</Label>
              <Input
                id="code-limit"
                type="number"
                min={0}
                placeholder="0 = 無限制"
                value={codeUsageLimit}
                onChange={(e) => setCodeUsageLimit(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                設為 0 表示不限制使用次數。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCodeDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleGenerateCode}
              disabled={codeLoading}
              className="min-w-[100px]"
            >
              {codeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "產生"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Code Result Dialog */}
      <Dialog
        open={!!codeResult}
        onOpenChange={(open) => !open && setCodeResult(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驗證碼已產生</DialogTitle>
            <DialogDescription>
              請複製以下驗證碼，提供給需要註冊的成員。
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <code className="text-2xl font-mono font-bold tracking-widest flex-1 text-center">
              {codeResult}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => codeResult && handleCopyCode(codeResult)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setCodeResult(null)}>完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>手動新增人員</DialogTitle>
            <DialogDescription>
              新增一位社員帳號，預設密碼為學號。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-sid">學號</Label>
              <Input
                id="add-sid"
                placeholder="例：B11234567"
                value={addStudentId}
                onChange={(e) => setAddStudentId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-name">姓名</Label>
              <Input
                id="add-name"
                placeholder="例：王小明"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={addLoading || !addStudentId || !addName}
              className="min-w-[100px]"
            >
              {addLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "新增"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
