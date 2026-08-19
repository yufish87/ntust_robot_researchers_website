"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { UserAPI } from "@/lib/api/user";
import api from "@/lib/api";
import type { UserProfile, UserRole, VerifyCode } from "@/lib/types/user";
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
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  Dices,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
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
  const queryClient = useQueryClient();

  // Main tab
  const [mainTab, setMainTab] = useState<"users" | "codes">("users");

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
  const [codeValue, setCodeValue] = useState("");
  const [codeDesc, setCodeDesc] = useState("");
  const [codeValidFrom, setCodeValidFrom] = useState("");
  const [codeValidUntil, setCodeValidUntil] = useState("");
  const [codeUsageLimit, setCodeUsageLimit] = useState(0);
  const [codeTargetYear, setCodeTargetYear] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  // Add User Dialog
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addStudentId, setAddStudentId] = useState("");
  const [addName, setAddName] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Positions Dialog
  const PRESET_POSITIONS = ["社長", "副社長", "財務", "教學", "活動", "美宣"];
  const [posTarget, setPosTarget] = useState<UserProfile | null>(null);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [customPosition, setCustomPosition] = useState("");
  const [posLoading, setPosLoading] = useState(false);

  // Member Year Dialog
  const [yearTarget, setYearTarget] = useState<UserProfile | null>(null);
  const [yearInput, setYearInput] = useState("");
  const [yearLoading, setYearLoading] = useState(false);

  // Reset Password AlertDialog
  const [resetPwdTarget, setResetPwdTarget] = useState<UserProfile | null>(null);
  const [resetPwdLoading, setResetPwdLoading] = useState(false);

  /* ---------- 使用者資料（useQuery）---------- */
  const {
    data: usersData,
    isLoading: loading,
    isFetching: usersRefreshing,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const result = await UserAPI.listUsers();
      return result.users;
    },
  });
  const users = usersData ?? [];

  /* ---------- 驗證碼資料（useQuery）---------- */
  const {
    data: codesData,
    isLoading: codesLoading,
    isFetching: codesRefreshing,
    refetch: refetchCodes,
  } = useQuery({
    queryKey: ["admin-codes"],
    queryFn: async () => {
      const result = await UserAPI.listCodes();
      return result.codes;
    },
    enabled: mainTab === "codes",
  });
  const codes = codesData ?? [];

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
            (u.role === "admin" || u.role === "owner") && u.status === "active"
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
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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
        code: codeValue.trim(),
        description: codeDesc,
        validFrom: codeValidFrom,
        validUntil: codeValidUntil,
        usageLimit: codeUsageLimit,
        targetYear: codeTargetYear.trim(),
      });
      setCodeDialogOpen(false);
      setCodeValue("");
      setCodeDesc("");
      setCodeValidFrom("");
      setCodeValidUntil("");
      setCodeUsageLimit(0);
      setCodeTargetYear("");
      toast({ title: "驗證碼已產生", description: `驗證碼: ${result.code}` });
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
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCodeValue(code);
  };

  // Verify code actions
  const [editCodeTarget, setEditCodeTarget] = useState<VerifyCode | null>(null);
  const [editUsageLimit, setEditUsageLimit] = useState(0);
  const [editCodeLoading, setEditCodeLoading] = useState(false);

  const handleToggleActive = async (vc: VerifyCode) => {
    try {
      await UserAPI.updateCode({
        code: vc.code,
        isActive: !vc.isActive,
      });
      toast({
        title: vc.isActive ? "已停用" : "已啟用",
        description: `驗證碼 ${vc.code} 已${vc.isActive ? "停用" : "啟用"}。`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-codes"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "操作失敗";
      toast({
        variant: "destructive",
        title: "操作失敗",
        description: message,
      });
    }
  };

  const handleUpdateUsageLimit = async () => {
    if (!editCodeTarget) return;
    setEditCodeLoading(true);
    try {
      await UserAPI.updateCode({
        code: editCodeTarget.code,
        usageLimit: editUsageLimit,
      });
      toast({
        title: "已更新",
        description: `驗證碼 ${editCodeTarget.code} 的使用次數限制已更新。`,
      });
      setEditCodeTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-codes"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "更新失敗";
      toast({
        variant: "destructive",
        title: "更新失敗",
        description: message,
      });
    } finally {
      setEditCodeLoading(false);
    }
  };

  const isSelf = (u: UserProfile) => currentUser?.studentId === u.studentId;

  const handleUpdatePositions = async () => {
    if (!posTarget) return;
    setPosLoading(true);
    try {
      // 合並預設和自訂職位
      const customArr = customPosition.split(",").map(s => s.trim()).filter(Boolean);
      const allPositions = [...selectedPositions, ...customArr];
      await UserAPI.updatePositions({
        targetStudentId: posTarget.studentId,
        positions: allPositions,
      });
      toast({ title: "職位已更新", description: `${posTarget.name} 的職位已更新。` });
      setPosTarget(null);
      setCustomPosition("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "更新失敗";
      toast({ variant: "destructive", title: "職位更新失敗", description: message });
    } finally {
      setPosLoading(false);
    }
  };

  const handleSetMemberYear = async () => {
    if (!yearTarget) return;
    setYearLoading(true);
    try {
      await UserAPI.adminSetMemberYear({
        targetStudentId: yearTarget.studentId,
        activeUntilYear: yearInput.trim(),
      });
      const msg = yearInput.trim() ? `已設定為 ${yearInput.trim()} 學年度` : "已清除社費記錄";
      toast({ title: "社費學年已更新", description: `${yearTarget.name} ${msg}。` });
      setYearTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "更新失敗";
      toast({ variant: "destructive", title: "社費學年更新失敗", description: message });
    } finally {
      setYearLoading(false);
    }
  };

  const handleAdminResetPassword = async () => {
    if (!resetPwdTarget) return;
    setResetPwdLoading(true);
    try {
      const res = await api.post("/admin/users/reset-password", {
        targetStudentId: resetPwdTarget.studentId,
      });
      if (!res.data.success) throw new Error(res.data.message || "重設失敗");
      toast({
        title: "密碼已重設",
        description: `${resetPwdTarget.name} 的密碼已重設為學號。`,
      });
      setResetPwdTarget(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "重設失敗";
      toast({ variant: "destructive", title: "重設密碼失敗", description: message });
    } finally {
      setResetPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <AdminPageHeader
        title="人員與權限管理"
        description="管理社團成員資料、分配幹部職位與權限組，並派發新成員註冊驗證碼。"
      >
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Main Tab Capsule in Header */}
          <div className="flex space-x-1 rounded-lg bg-black/40 border border-white/15 p-1 h-9 sm:h-10 items-center">
            <button
              type="button"
              onClick={() => setMainTab("users")}
              className={`px-3 py-1 sm:py-1.5 h-full flex items-center justify-center text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap min-w-[72px] sm:min-w-[80px] text-center ${
                mainTab === "users"
                  ? "bg-[#ffc000] text-black shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              社員名冊
            </button>
            <button
              type="button"
              onClick={() => setMainTab("codes")}
              className={`px-3 py-1 sm:py-1.5 h-full flex items-center justify-center text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap min-w-[72px] sm:min-w-[80px] text-center ${
                mainTab === "codes"
                  ? "bg-[#ffc000] text-black shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              社團註冊碼
            </button>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              void (mainTab === "users" ? refetchUsers() : refetchCodes())
            }
            disabled={
              mainTab === "users"
                ? loading || usersRefreshing
                : codesLoading || codesRefreshing
            }
            aria-busy={mainTab === "users" ? usersRefreshing : codesRefreshing}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                (mainTab === "users" ? usersRefreshing : codesRefreshing)
                  ? "animate-spin"
                  : ""
              }`}
            />
            重新整理
          </Button>

          <Button
            variant="outline"
            onClick={() => setCodeDialogOpen(true)}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
          >
            <KeyRound className="h-4 w-4 mr-1.5" />
            產生註冊碼
          </Button>

          <Button
            onClick={() => setAddUserOpen(true)}
            className="w-full sm:w-auto bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold shadow-xs cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            新增人員
          </Button>
        </div>
      </AdminPageHeader>
      {mainTab === "users" && (
        <div className="space-y-4">
          {/* Sub filter + Search */}
          <Tabs
            value={tabFilter}
            onValueChange={(v) => setTabFilter(v as TabFilter)}
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <TabsList className="bg-slate-100 dark:bg-[#1a1820] border border-slate-200/80 dark:border-white/10 p-1 rounded-xl h-auto flex flex-wrap gap-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#201e26] data-[state=active]:text-slate-900 dark:data-[state=active]:text-[#ffc000] data-[state=active]:shadow-xs rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer">
                  全部
                </TabsTrigger>
                <TabsTrigger value="member" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#201e26] data-[state=active]:text-slate-900 dark:data-[state=active]:text-[#ffc000] data-[state=active]:shadow-xs rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer">
                  社員
                </TabsTrigger>
                <TabsTrigger value="admin" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#201e26] data-[state=active]:text-slate-900 dark:data-[state=active]:text-[#ffc000] data-[state=active]:shadow-xs rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer">
                  管理員
                </TabsTrigger>
                <TabsTrigger value="disabled" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#201e26] data-[state=active]:text-slate-900 dark:data-[state=active]:text-[#ffc000] data-[state=active]:shadow-xs rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer">
                  已停用
                </TabsTrigger>
              </TabsList>
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋學號或姓名..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </Tabs>

          {/* Users Table */}
          <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
            <Table className="min-w-[850px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px]">學號</TableHead>
                  <TableHead className="w-[100px]">姓名</TableHead>
                  <TableHead className="w-[120px]">系所</TableHead>
                  <TableHead className="w-[80px]">年級</TableHead>
                  <TableHead className="w-[90px]">身份</TableHead>
                  <TableHead className="w-[120px]">職位</TableHead>
                  <TableHead className="w-[80px]">社費</TableHead>
                  <TableHead className="w-[80px]">狀態</TableHead>
                  <TableHead className="w-[140px]">最近登入</TableHead>
                  <TableHead className="w-[60px] text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center h-32">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        載入中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
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
                      <TableCell className="text-sm">
                        {u.grade || "—"}
                      </TableCell>
                      <TableCell>{roleBadge(u.role)}</TableCell>
                      <TableCell className="text-xs">
                        {(() => {
                          const latestOffRec = [...(u.membershipHistory ?? [])].reverse()
                            .find(h => h.type === "admin" || h.type === "owner");
                          if ((u.role === "admin" || u.role === "owner") && latestOffRec?.positions) {
                            return latestOffRec.positions.split(",").filter(Boolean).map((p: string) => (
                              <Badge key={p} variant="outline" className="text-xs mr-0.5">{p}</Badge>
                            ));
                          }
                          if (u.role === "admin" || u.role === "owner") {
                            return <Badge variant="outline" className="text-xs">幹部</Badge>;
                          }
                          return <span className="text-muted-foreground">—</span>;
                        })()}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        {u.activeUntilYear || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{statusBadge(u.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLoginTime(u.lastLoginTime)}
                      </TableCell>
                      <TableCell className="text-center">
                        {u.role === "owner" ? (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
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
                              <DropdownMenuItem
                                onClick={() => {
                                  const latestPosRec = [...(u.membershipHistory ?? [])].reverse()
                                    .find(h => h.type === "admin" || h.type === "owner");
                                  const existingPos = latestPosRec?.positions
                                    ? latestPosRec.positions.split(",").filter(Boolean)
                                    : [];
                                  setSelectedPositions(existingPos.filter((p: string) => PRESET_POSITIONS.includes(p)));
                                  setCustomPosition(existingPos.filter((p: string) => !PRESET_POSITIONS.includes(p)).join(","));
                                  setPosTarget(u);
                                }}
                              >
                                設定職位
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setYearTarget(u);
                                  setYearInput(u.activeUntilYear || "");
                                }}
                              >
                                設定社費學年
                              </DropdownMenuItem>
                              {!isSelf(u) && (
                <DropdownMenuItem
                  onClick={() => setResetPwdTarget(u)}
                >
                  重設密碼為學號
                </DropdownMenuItem>
              )}
              {!isSelf(u) && u.status === "active" && (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => setDeleteTarget(u)}
                                >
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
        </div>
      )}

      {/* ===== 驗證碼 Tab ===== */}
      {mainTab === "codes" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
            <Table className="min-w-[850px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px]">驗證碼</TableHead>
                  <TableHead className="w-[140px]">說明</TableHead>
                  <TableHead className="w-[60px] text-center">目標學年</TableHead>
                  <TableHead className="w-[140px]">生效時間</TableHead>
                  <TableHead className="w-[140px]">失效時間</TableHead>
                  <TableHead className="w-[80px] text-center">狀態</TableHead>
                  <TableHead className="w-[60px] text-center">已使用</TableHead>
                  <TableHead className="w-[80px] text-center">
                    使用限制
                  </TableHead>
                  <TableHead className="w-[100px]">建立者</TableHead>
                  <TableHead className="w-[140px]">建立時間</TableHead>
                  <TableHead className="w-[80px] text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codesLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center h-32">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        載入中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : codes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center h-32 text-muted-foreground"
                    >
                      尚無驗證碼資料。
                    </TableCell>
                  </TableRow>
                ) : (
                  codes.map((vc) => (
                    <TableRow key={vc.code}>
                      <TableCell className="font-mono text-xs font-medium">
                        {vc.code}
                      </TableCell>
                      <TableCell className="text-sm">
                        {vc.description || "—"}
                      </TableCell>
                      <TableCell className="text-center text-sm font-mono">
                        {vc.targetYear || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLoginTime(vc.validFrom)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLoginTime(vc.validUntil)}
                      </TableCell>
                      <TableCell className="text-center">
                        {vc.isActive ? (
                          <Badge
                            variant="default"
                            className="text-xs cursor-pointer"
                            onClick={() => handleToggleActive(vc)}
                          >
                            啟用
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-xs cursor-pointer"
                            onClick={() => handleToggleActive(vc)}
                          >
                            停用
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {vc.usedCount}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs font-mono"
                          onClick={() => {
                            setEditCodeTarget(vc);
                            setEditUsageLimit(vc.usageLimit);
                          }}
                        >
                          {vc.usageLimit === 0 ? "無限制" : vc.usageLimit}
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm">
                        {vc.createdBy || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLoginTime(vc.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
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
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(vc)}
                            >
                              {vc.isActive ? "停用此驗證碼" : "啟用此驗證碼"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditCodeTarget(vc);
                                setEditUsageLimit(vc.usageLimit);
                              }}
                            >
                              修改使用限制
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

          {/* Footer count */}
          {!codesLoading && (
            <p className="text-sm text-muted-foreground text-center">
              共 {codes.length} 筆
            </p>
          )}
        </div>
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
              <Label htmlFor="code-value">
                驗證碼<span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="code-value"
                  placeholder="請輸入驗證碼"
                  value={codeValue}
                  onChange={(e) => setCodeValue(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={generateRandomCode}
                  title="隨機產生"
                >
                  <Dices className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code-desc">說明</Label>
              <Input
                id="code-desc"
                placeholder="例：113-2 新進社員"
                value={codeDesc}
                onChange={(e) => setCodeDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code-valid-from">
                生效時間<span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="code-valid-from"
                type="datetime-local"
                value={codeValidFrom}
                onChange={(e) => setCodeValidFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code-valid-until">
                失效時間<span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="code-valid-until"
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
            <div className="space-y-2">
              <Label htmlFor="code-target-year">目標學年（選填）</Label>
              <Input
                id="code-target-year"
                placeholder="例：114"
                maxLength={3}
                value={codeTargetYear}
                onChange={(e) => setCodeTargetYear(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCodeDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleGenerateCode}
              disabled={
                codeLoading ||
                !codeValue.trim() ||
                !codeValidFrom ||
                !codeValidUntil
              }
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

      {/* Edit Usage Limit Dialog */}
      <Dialog
        open={!!editCodeTarget}
        onOpenChange={(open) => {
          if (!open) setEditCodeTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>修改使用限制</DialogTitle>
            <DialogDescription className="sr-only">
              修改驗證碼使用限制
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">驗證碼</span>
              <span className="font-mono font-medium">
                {editCodeTarget?.code}
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-usage-limit">限制使用次數</Label>
              <Input
                id="edit-usage-limit"
                type="number"
                min={0}
                value={editUsageLimit}
                onChange={(e) => setEditUsageLimit(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                設為 0 表示不限制使用次數。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCodeTarget(null)}>
              取消
            </Button>
            <Button
              onClick={handleUpdateUsageLimit}
              disabled={editCodeLoading}
              className="min-w-[100px]"
            >
              {editCodeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "儲存"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Positions Dialog */}
      <Dialog open={!!posTarget} onOpenChange={(open) => !open && setPosTarget(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>設定職位</DialogTitle>
            <DialogDescription>
              設定 <span className="font-semibold">{posTarget?.name}</span> 的幹部職位。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 w-full overflow-hidden">
            {PRESET_POSITIONS.map((pos) => (
              <div key={pos} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`pos-${pos}`}
                  className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                  checked={selectedPositions.includes(pos)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedPositions(prev =>
                      checked ? [...prev, pos] : prev.filter(p => p !== pos)
                    );
                  }}
                />
                <Label htmlFor={`pos-${pos}`} className="cursor-pointer">{pos}</Label>
              </div>
            ))}
            {/* 其他—自訂輸入 */}
            <div className="flex items-center gap-2 w-full min-w-0">
              <input
                type="checkbox"
                id="pos-custom"
                className="h-4 w-4 rounded border-gray-300 cursor-pointer shrink-0"
                checked={customPosition.trim().length > 0}
                onChange={(e) => { if (!e.target.checked) setCustomPosition(""); }}
                readOnly
              />
              <Label htmlFor="pos-custom-input" className="cursor-pointer shrink-0">其他</Label>
              <input
                id="pos-custom-input"
                type="text"
                placeholder="自訂職位，多個用逗號分隔"
                value={customPosition}
                onChange={(e) => setCustomPosition(e.target.value)}
                className="flex-1 min-w-0 h-5 text-sm border-0 border-b border-gray-300 focus:border-gray-600 outline-none bg-transparent px-0 placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPosTarget(null)}>取消</Button>
            <Button onClick={handleUpdatePositions} disabled={posLoading} className="min-w-[100px]">
              {posLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Year Dialog */}
      <Dialog open={!!yearTarget} onOpenChange={(open) => !open && setYearTarget(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>設定社費學年</DialogTitle>
            <DialogDescription>
              手動設定 <span className="font-semibold">{yearTarget?.name}</span> 的社費有效學年。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="year-input">學年度</Label>
              <Input
                id="year-input"
                placeholder="例：114（留空代表清除）"
                maxLength={3}
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value.replace(/\D/g, ""))}
              />
              <p className="text-xs text-muted-foreground">輸入 3 位民國年，留空代表清除社費記錄。</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setYearTarget(null)}>取消</Button>
            <Button onClick={handleSetMemberYear} disabled={yearLoading} className="min-w-[100px]">
              {yearLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password AlertDialog */}
      <AlertDialog
        open={!!resetPwdTarget}
        onOpenChange={(open) => !open && setResetPwdTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認重設密碼</AlertDialogTitle>
            <AlertDialogDescription>
              確定要將{" "}
              <span className="font-semibold">{resetPwdTarget?.name}</span>{" "}
              ({resetPwdTarget?.studentId}) 的密碼重設為其學號嗎？
              <br />
              <span className="text-orange-600 font-medium">
                操作後使用者必須用學號登入，建議請他們盡快修改密碼。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdminResetPassword}
              disabled={resetPwdLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {resetPwdLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "確認重設"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
