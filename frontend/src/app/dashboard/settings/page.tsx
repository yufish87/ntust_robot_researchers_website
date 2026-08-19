"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/useAuthStore";
import { UserAPI } from "@/lib/api/user";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, User, Lock, AlertTriangle, CheckCircle2, CreditCard } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

// ─── Zod Schemas ───────────────────────────────────────────

const profileSchema = z.object({
  department: z.string().min(1, "系所不可為空"),
  grade: z.string().min(1, "年級不可為空"),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "請輸入目前的密碼"),
    newPassword: z
      .string()
      .min(6, "新密碼至少需要 6 個字元")
      .regex(/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/, "請輸入英數字混合密碼"),
    confirmPassword: z.string().min(1, "請確認新密碼"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "新密碼與確認密碼不一致",
    path: ["confirmPassword"],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "新密碼不可與舊密碼相同",
    path: ["newPassword"],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

// ─── 角色 Badge ────────────────────────────────────────────

function getRoleBadge(role: string) {
  const map: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    owner: { label: "Owner", variant: "destructive" },
    admin: { label: "幹部", variant: "default" },
    member: { label: "社員", variant: "secondary" },
    expired: { label: "已過期", variant: "outline" },
    visitor: { label: "訪客", variant: "outline" },
  };
  const info = map[role] || { label: role, variant: "outline" as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

// ─── 主頁面 ────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, logout, updateUser } = useAuthStore();

  // 各表單 loading 狀態
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // 修改成功提示
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 重新加入社團
  const [membershipCode, setMembershipCode] = useState("");
  const [extendingMembership, setExtendingMembership] = useState(false);
  const [membershipSuccess, setMembershipSuccess] = useState(false);

  // 判斷社費有效狀態
  function getMembershipStatus(activeUntilYear: string): "valid" | "expired" | "none" {
    if (!activeUntilYear) return "none";
    const now = new Date();
    const yr = now.getFullYear() - 1911;
    const month = now.getMonth() + 1;
    const currentAcademicYear = month >= 9 ? yr : yr - 1;
    return Number(activeUntilYear) >= currentAcademicYear ? "valid" : "expired";
  }

  // 刪除帳號 Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // ─── Profile Form ───

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { department: "", grade: "" },
  });

  // 使用已同步到 client 的登入者資料初始化表單
  useEffect(() => {
    if (user) {
      profileForm.reset({
        department: user.department || "",
        grade: String(user.grade || ""),
      });
    }
  }, [user, profileForm]);

  const onSubmitProfile = async (values: ProfileFormValues) => {
    setSavingProfile(true);
    setProfileSuccess(false);
    try {
      await UserAPI.updateProfile(values);
      // 同步更新 Zustand store
      updateUser({ department: values.department, grade: values.grade });
      setProfileSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "更新失敗";
      toast({
        title: "更新失敗",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // ─── Password Form ───

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmitPassword = async (values: PasswordFormValues) => {
    setSavingPassword(true);
    setPasswordSuccess(false);
    try {
      await UserAPI.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      setPasswordSuccess(true);
      passwordForm.reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "密碼修改失敗";
      // 後端回傳舊密碼不正確時，將錯誤設定於舊密碼欄位
      if (
        message.includes("密碼不正確") ||
        message.includes("CHANGE_PASSWORD_FAILED")
      ) {
        passwordForm.setError("oldPassword", { message: "舊密碼不正確" });
      } else {
        toast({
          title: "修改失敗",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  // 重新加入社團
  const onExtendMembership = async () => {
    if (!membershipCode.trim()) {
      toast({ title: "請輸入驗證碼", variant: "destructive" });
      return;
    }
    setExtendingMembership(true);
    setMembershipSuccess(false);
    try {
      const res = await UserAPI.extendMembership({ code: membershipCode.trim() });
      // 從回傳或訊息提取目標學年
      const newYear: string | undefined = res.data?.activeUntilYear ||
        (res.message?.match(/(\d{3})/) ? res.message.match(/(\d{3})/)![1] : undefined);
      if (newYear) {
        // 同時更新 store 中的 activeUntilYear 與 membershipHistory
        updateUser({
          activeUntilYear: newYear,
          role: "member",
          membershipHistory: [
            ...(user?.membershipHistory?.filter(h => h.year !== newYear) || []),
            { year: newYear, type: "member", positions: "" },
          ],
        });
      }
      setMembershipCode("");
      setMembershipSuccess(true);
      toast({ title: "重新加入社團成功", description: res.message });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "重新加入社團失敗";
      toast({ title: "重新加入社團失敗", description: message, variant: "destructive" });
    } finally {
      setExtendingMembership(false);
    }
  };

  // ─── Delete Account ───

  const onConfirmDelete = async () => {
    if (!deletePassword) {
      toast({ title: "請輸入密碼", variant: "destructive" });
      return;
    }
    setDeletingAccount(true);
    try {
      await UserAPI.deleteAccount({ password: deletePassword });
      toast({ title: "帳號已停用", description: "您的帳號已被標記為刪除" });
      setDeleteDialogOpen(false);
      logout();
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "刪除失敗";
      toast({
        title: "操作失敗",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  // ─── Render ───

  if (!user) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <AdminPageHeader
          title="個人帳號設定"
          description="檢視個人基本資料、社團身份組、社費繳納狀態與修改登入密碼。"
        />
        <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 頁面標題 */}
      <AdminPageHeader
        title="個人帳號設定"
        description="檢視個人基本資料、社團身份組、社費繳納狀態與修改登入密碼。"
      />

      {/* ─── 基本資料 Card ─── */}
      <Card className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#ffc000]" />
            <CardTitle className="text-lg font-bold">基本資料</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">查看與修改您的個人資訊。</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form
            onSubmit={profileForm.handleSubmit(onSubmitProfile)}
            className="space-y-4"
          >
            {/* 唯讀欄位 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentId-display">學號</Label>
                <Input
                  id="studentId-display"
                  value={user?.studentId || ""}
                  disabled
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name-display">姓名</Label>
                <Input
                  id="name-display"
                  value={user?.name || ""}
                  disabled
                  autoComplete="off"
                />
              </div>
            </div>

            {/* 可編輯欄位 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center h-5">
                  <Label htmlFor="department">系所</Label>
                  {profileForm.formState.errors.department && (
                    <span className="text-destructive text-xs leading-none">
                      {profileForm.formState.errors.department.message}
                    </span>
                  )}
                </div>
                <Input
                  id="department"
                  placeholder="例：資訊工程系"
                  {...profileForm.register("department")}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center h-5">
                  <Label htmlFor="grade">年級</Label>
                  {profileForm.formState.errors.grade && (
                    <span className="text-destructive text-xs leading-none">
                      {profileForm.formState.errors.grade.message}
                    </span>
                  )}
                </div>
                <Input
                  id="grade"
                  placeholder="例：3"
                  {...profileForm.register("grade")}
                />
              </div>
            </div>

            {/* 職位 Badge — 從最新幹部記錄取得 */}
            {(user?.role === "admin" || user?.role === "owner") && (() => {
              const latestPos = [...(user?.membershipHistory ?? [])].reverse()
                .find(h => h.type === "admin" || h.type === "owner")?.positions;
              if (!latestPos) return null;
              return (
                <div className="space-y-2">
                  <Label>職位</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {latestPos.split(",").filter(Boolean).map((p: string) => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 身份 Badge */}
            <div className="space-y-2">
              <Label>身份</Label>
              <div>{getRoleBadge(user?.role || "visitor")}</div>
            </div>

            <Separator />

            <div className="flex justify-end items-center gap-3">
              {profileSuccess && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  資料已儲存
                </span>
              )}
              <Button
                type="submit"
                disabled={savingProfile}
                className="min-w-[100px]"
              >
                {savingProfile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "儲存變更"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ─── 重新加入社團 Card ─── */}
      <Card className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#ffc000]" />
            <CardTitle className="text-lg font-bold">社團身份與社費狀態</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">查看歷年社籍身份紀錄與輸入驗證碼重新啟用社員資格。</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* 歷年身份組 */}
          {(user?.membershipHistory?.length ?? 0) > 0 && (
            <div className="space-y-1.5">
              <Label>歷年身份紀錄</Label>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 text-sm overflow-hidden">
                {[...(user?.membershipHistory ?? [])].reverse().map((record) => (
                  <div key={record.year} className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50 dark:bg-white/5">
                    <span className="text-muted-foreground">{record.year} 學年度</span>
                    <span className="flex items-center gap-1.5">
                      {record.type === "admin" || record.type === "owner" ? (
                        <Badge variant="default">{record.positions || "幹部"}</Badge>
                      ) : (
                        <Badge variant="secondary">社員</Badge>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 當前有效狀態 */}
          <div className="space-y-1">
            <Label>目前社籍有效狀態</Label>
            {(() => {
              const isOfficer = user?.role === "admin" || user?.role === "owner";
              if (isOfficer) {
                const currentRecord = [...(user?.membershipHistory ?? [])].reverse()
                  .find(h => h.type === "admin" || h.type === "owner");
                return (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      目前為社團幹部（自動啟用）
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentRecord?.positions && `職位：${currentRecord.positions}。`}
                      幹部有效至 {user?.activeUntilYear} 學年度，無須繳交社費。
                    </p>
                  </div>
                );
              }
              const status = getMembershipStatus(user?.activeUntilYear || "");
              if (status === "valid") return (
                <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {user?.activeUntilYear} 學年度（有效）
                </div>
              );
              if (status === "expired") return (
                <div className="flex items-center gap-1.5 text-sm text-amber-600 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {user?.activeUntilYear} 學年度（已到期）
                </div>
              );
              return <p className="text-sm text-muted-foreground">尚未登記社團記錄</p>;
            })()}
          </div>

          {/* 驗證碼輸入：僅 member / expired 顯示 */}
          {(user?.role === "member" || user?.role === "expired") && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between items-center h-5">
                  <Label htmlFor="membership-code">重新啟用驗證碼</Label>
                  {membershipSuccess && (
                    <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" />重新加入成功
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="membership-code"
                    placeholder="請輸入財務發放的驗證碼"
                    value={membershipCode}
                    onChange={(e) => setMembershipCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") onExtendMembership(); }}
                    autoComplete="off"
                  />
                  <Button
                    onClick={onExtendMembership}
                    disabled={extendingMembership || !membershipCode.trim()}
                    className="shrink-0 bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold cursor-pointer"
                  >
                    {extendingMembership ? <Loader2 className="h-4 w-4 animate-spin" /> : "重新加入社團"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── 修改密碼 Card ─── */}
      <Card className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#ffc000]" />
            <CardTitle className="text-lg font-bold">修改登入密碼</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">定期更換密碼以確保個人帳號安全。</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form
            onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center h-5">
                <Label htmlFor="oldPassword">舊密碼</Label>
                {passwordForm.formState.errors.oldPassword && (
                  <span className="text-destructive text-xs leading-none">
                    {passwordForm.formState.errors.oldPassword.message}
                  </span>
                )}
              </div>
              <Input
                id="oldPassword"
                type="password"
                placeholder="請輸入目前的密碼"
                {...passwordForm.register("oldPassword")}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center h-5">
                  <Label htmlFor="newPassword">新密碼</Label>
                  {passwordForm.formState.errors.newPassword && (
                    <span className="text-destructive text-xs leading-none">
                      {passwordForm.formState.errors.newPassword.message}
                    </span>
                  )}
                </div>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="至少 6 個字元"
                  {...passwordForm.register("newPassword")}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center h-5">
                  <Label htmlFor="confirmPassword">確認新密碼</Label>
                  {passwordForm.formState.errors.confirmPassword && (
                    <span className="text-destructive text-xs leading-none">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </span>
                  )}
                </div>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次輸入新密碼"
                  {...passwordForm.register("confirmPassword")}
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end items-center gap-3">
              {passwordSuccess && (
                <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  密碼修改成功
                </span>
              )}
              <Button
                type="submit"
                disabled={savingPassword}
                className="min-w-[100px] bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold cursor-pointer"
              >
                {savingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "更新密碼"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ─── 危險區域 Card ─── */}
      <Card className="bg-white dark:bg-[#201e26] border border-red-200 dark:border-red-900/40 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-red-100 dark:border-red-950/40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg font-bold text-red-600 dark:text-red-400">危險區域</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">以下操作不可逆，請謹慎執行。</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">停用 / 刪除帳號</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                此操作將停用您的帳號，停用後將無法登入社團系統。
              </p>
            </div>
            <Button
              variant="destructive"
              className="min-w-[100px] shrink-0"
              onClick={() => {
                setDeletePassword("");
                setDeleteDialogOpen(true);
              }}
            >
              刪除帳號
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── 刪除帳號確認 Dialog ─── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              確認刪除帳號
            </DialogTitle>
            <DialogDescription>
              此操作將停用您的帳號。停用後您將無法登入系統。請輸入您的密碼以確認。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-password">密碼驗證</Label>
            <Input
              id="delete-password"
              type="password"
              placeholder="請輸入您的密碼"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onConfirmDelete();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingAccount}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              className="min-w-[100px]"
              onClick={onConfirmDelete}
              disabled={deletingAccount || !deletePassword}
            >
              {deletingAccount ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "確認刪除"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
