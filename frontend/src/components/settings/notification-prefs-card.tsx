"use client";

import { useState, useEffect, useCallback, useId, useMemo } from "react";
import { UserAPI } from "@/lib/api/user";
import type { NotificationPreferences } from "@/lib/types/user";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  Mail,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Unlink,
  ShieldCheck,
  Calendar,
  Package,
  Printer,
  Receipt,
  AlertCircle,
  Sparkles,
  Save,
  RotateCcw,
  Info,
} from "lucide-react";

// ─── 預設偏好常數與計算函式 ──────────────────────────────────────────────

export const getDefaultPreferences = (isLineBound: boolean): NotificationPreferences => ({
  email: {
    equipment: !isLineBound,
    machine: !isLineBound,
    finance: true,
    announcements: !isLineBound,
  },
  line: {
    equipment: true,
    machine: true,
    finance: true,
    announcements: true,
  },
});

// ─── 事件項目配置 ──────────────────────────────────────────────

interface EventItemConfig {
  key: keyof NotificationPreferences["email"];
  title: string;
  description: string;
  icon: typeof Bell;
  emailLocked?: boolean;
}

const EVENT_ITEMS: EventItemConfig[] = [
  {
    key: "announcements",
    title: "社課與重要公告",
    description: "新社課發布、課程講義上架、重大社務通知",
    icon: Calendar,
  },
  {
    key: "equipment",
    title: "社團器材借用",
    description: "借用申請回執、審核通過/退回通知、領取提醒",
    icon: Package,
  },
  {
    key: "machine",
    title: "機臺設備預約",
    description: "3D 列印 / 雷切審核結果、上機時段確認與完工提醒",
    icon: Printer,
  },
  {
    key: "finance",
    title: "財務報帳與請款",
    description: "初審通過提醒投遞發票、款項已撥付入帳通知",
    icon: Receipt,
  },
];

// ─── 輕量無障礙 Switch 元件 (高對比黑金工藝風格) ─────────────────

interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}

function CustomSwitch({ checked, onCheckedChange, disabled, label }: CustomSwitchProps) {
  const switchId = useId();
  return (
    <button
      id={switchId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc000] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1c24] ${
        disabled
          ? "opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800"
          : checked
          ? "bg-[#ffc000] shadow-[0_0_10px_rgba(255,192,0,0.25)]"
          : "bg-slate-200 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 transform rounded-full shadow-md transition duration-200 ease-in-out ${
          checked
            ? "translate-x-5 bg-[#121118]"
            : "translate-x-0 bg-white dark:bg-slate-200"
        }`}
      />
    </button>
  );
}

// ─── 主卡片元件 ────────────────────────────────────────────────

export function NotificationPrefsCard() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 本地編輯中偏好與伺服器已儲存偏好
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => getDefaultPreferences(false));
  const [initialPreferences, setInitialPreferences] = useState<NotificationPreferences>(() => getDefaultPreferences(false));

  const [isLineBound, setIsLineBound] = useState(false);
  const [lineUserId, setLineUserId] = useState<string>("");

  // LINE 綁定 Modal 狀態
  const [bindModalOpen, setBindModalOpen] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [bindCode, setBindCode] = useState<string>("");
  const [bindCountdown, setBindCountdown] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [unbinding, setUnbinding] = useState(false);

  // ─── 檢查是否有未儲存的變更 ───
  const hasChanges = useMemo(() => {
    return JSON.stringify(preferences) !== JSON.stringify(initialPreferences);
  }, [preferences, initialPreferences]);

  // ─── 載入偏好與綁定狀態 ───
  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const data = await UserAPI.getNotificationPrefs();
      const bound = Boolean(
        data.lineBindStatus?.bound ||
        data.lineBindStatus?.lineUserId ||
        (data as any).isLineBound
      );
      setIsLineBound(bound);
      setLineUserId(data.lineBindStatus?.lineUserId || (data as any).lineUserId || "");

      const defaults = getDefaultPreferences(bound);
      if (data.preferences) {
        const loaded: NotificationPreferences = {
          email: { ...defaults.email, ...(data.preferences.email || {}) },
          line: { ...defaults.line, ...(data.preferences.line || {}) },
        };
        setPreferences(loaded);
        setInitialPreferences(loaded);
      } else {
        setPreferences(defaults);
        setInitialPreferences(defaults);
      }
    } catch (err: unknown) {
      console.warn("無法取得通知偏好，使用預設值:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // ─── 純本地切換開關 (不發起網路請求，不刷新) ───
  const handleToggle = (
    channel: "email" | "line",
    key: keyof NotificationPreferences["email"],
    value: boolean
  ) => {
    setSaveSuccess(false);
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: value,
      },
    }));
  };

  // ─── 重設回已儲存狀態 ───
  const handleReset = () => {
    setPreferences(initialPreferences);
    setSaveSuccess(false);
  };

  // ─── 恢復系統預設值 ───
  const handleRestoreDefaults = () => {
    const defaults = getDefaultPreferences(isLineBound);
    setPreferences(defaults);
    setSaveSuccess(false);
    toast({
      title: "已套用系統建議預設值",
      description: isLineBound
        ? "LINE 通知全數開啟，Email 預設僅保留「財務報帳與請款」。請點擊「儲存通知設定」以生效。"
        : "LINE 尚未綁定，為防漏接重要訊息，Email 與 LINE 預設全數開啟。請點擊「儲存通知設定」以生效。",
    });
  };

  // ─── 手動儲存設定 ───
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      await UserAPI.updateNotificationPrefs(preferences);
      setInitialPreferences(preferences);
      setSaveSuccess(true);
      toast({
        title: "通知偏好設定已儲存",
        description: "您的自訂通知開關設定已成功更新。",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "儲存失敗";
      toast({
        title: "儲存失敗",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── 產生 LINE 綁定碼 ───
  const handleRequestBindCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await UserAPI.requestLineBindCode();
      setBindCode(res.bindCode);
      setBindCountdown(res.ttlSeconds || 900);
      setBindModalOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "產生驗證碼失敗";
      toast({
        title: "操作失敗",
        description: message,
        variant: "destructive",
      });
    } finally {
      setGeneratingCode(false);
    }
  };

  // ─── 倒數計時器 ───
  useEffect(() => {
    if (bindCountdown <= 0) return;
    const timer = setInterval(() => {
      setBindCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [bindCountdown]);

  // ─── 複製綁定碼 ───
  const handleCopyCode = () => {
    if (!bindCode) return;
    navigator.clipboard.writeText(bindCode);
    setCopied(true);
    toast({ title: "已複製綁定碼", description: `已複製「${bindCode}」至剪貼簿` });
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── 解除 LINE 綁定 ───
  const handleUnbindLine = async () => {
    if (!confirm("確定要解除 LINE 官方帳號綁定嗎？解除後將無法接收 LINE 即時推播。")) return;
    setUnbinding(true);
    try {
      await UserAPI.unbindLine();
      setIsLineBound(false);
      setLineUserId("");
      toast({ title: "已解除綁定", description: "您的帳號已與 LINE 官方帳號取消連結" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "解除綁定失敗";
      toast({ title: "操作失敗", description: message, variant: "destructive" });
    } finally {
      setUnbinding(false);
    }
  };

  // 格式化倒數分秒
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ─── 關閉綁定彈窗確認防呆 ───
  const handleBindModalOpenChange = (open: boolean) => {
    if (!open && !isLineBound && bindCountdown > 0) {
      const confirmClose = window.confirm(
        "確定要中斷 LINE 綁定流程嗎？\n若尚未在官方 LINE 聊天室發送驗證碼，關閉後需重新取得綁定碼。\n\nAre you sure you want to cancel the LINE binding process?\nIf you have not sent the verification code in LINE yet, you will need to request a new code next time."
      );
      if (!confirmClose) return;
    }
    setBindModalOpen(open);
    if (!open) {
      fetchPreferences();
    }
  };

  return (
    <>
      <Card className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
        {/* 卡片標題區 */}
        <CardHeader className="p-4 sm:p-6 pb-4 sm:pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#ffc000]" />
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  自訂通知偏好訂閱中心
                </CardTitle>
                {hasChanges && (
                  <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/40 bg-amber-500/10">
                    有未儲存的變更
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                自由配置學校信箱與 LINE 官方帳號的即時事件接收通知。
              </CardDescription>
            </div>

            {/* LINE 綁定狀態 Badge / 按鈕 */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isLineBound ? (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-lg">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    LINE 官方帳號已綁定
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnbindLine}
                    disabled={unbinding}
                    className="h-6 px-1.5 text-xs text-slate-400 hover:text-red-500"
                    title="解除綁定"
                  >
                    {unbinding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestBindCode}
                  disabled={generatingCode}
                  className="border-slate-300 dark:border-[#ffc000]/40 text-slate-800 dark:text-[#ffc000] bg-slate-50/80 dark:bg-[#ffc000]/10 hover:bg-slate-100 dark:hover:bg-[#ffc000]/20 text-xs font-semibold h-8 shadow-xs cursor-pointer"
                >
                  {generatingCode ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-[#06c755]" />
                  )}
                  綁定 LINE 官方帳號
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#ffc000]" />
              <span className="ml-2 text-sm text-slate-400">載入偏好設定中…</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* LINE 未綁定提示橫幅 */}
              {!isLineBound && (
                <div className="rounded-xl bg-slate-900/90 dark:bg-[#15141c] border border-slate-700/60 dark:border-white/10 p-3.5 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#06c755]/15 border border-[#06c755]/25 text-[#06c755] shrink-0 mt-0.5 sm:mt-0">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">尚未綁定社團 LINE 官方帳號</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        完成綁定後即可在 LINE 收到社課推播、器材審核、機臺進度與財務撥款即時訊息。
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleRequestBindCode}
                    disabled={generatingCode}
                    className="bg-[#06c755] hover:bg-[#05b34c] text-white font-medium text-xs shrink-0 cursor-pointer shadow-sm w-full sm:w-auto"
                  >
                    立即取得綁定碼
                  </Button>
                </div>
              )}

              {/* 通知欄位標題 */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 px-1 sm:px-2 text-xs font-semibold text-slate-400">
                <div className="min-w-0 flex-1">事件通知類別</div>
                <div className="flex items-center gap-2 sm:gap-6 shrink-0">
                  <div className="w-14 sm:w-20 flex items-center justify-center gap-1 whitespace-nowrap">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Email</span>
                    <span className="hidden sm:inline">通知</span>
                  </div>
                  <div className="w-14 sm:w-20 flex items-center justify-center gap-1 whitespace-nowrap">
                    <MessageSquare className="h-3.5 w-3.5 text-[#06c755] shrink-0" />
                    <span>LINE</span>
                    <span className="hidden sm:inline">通知</span>
                  </div>
                </div>
              </div>

              {/* 事件細項列表 */}
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {EVENT_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const emailChecked = preferences.email[item.key];
                  const lineChecked = preferences.line[item.key];

                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-3.5 px-1 sm:px-2 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] rounded-lg transition-colors gap-2"
                    >
                      {/* 事件資訊 */}
                      <div className="flex items-center sm:items-start gap-2.5 sm:gap-3 min-w-0 flex-1 pr-1 sm:pr-2">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-[#ffc000] shrink-0 mt-0 sm:mt-0.5">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate sm:whitespace-normal">
                            {item.title}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate sm:line-clamp-none leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* 開關控制項 */}
                      <div className="flex items-center gap-2 sm:gap-6 shrink-0">
                        {/* Email 開關 */}
                        <div className="w-14 sm:w-20 flex justify-center items-center">
                          <CustomSwitch
                            checked={emailChecked}
                            disabled={item.emailLocked}
                            onCheckedChange={(val) => handleToggle("email", item.key, val)}
                            label={`${item.title} Email 通知開關`}
                          />
                        </div>

                        {/* LINE 開關 */}
                        <div className="w-14 sm:w-20 flex justify-center items-center">
                          <CustomSwitch
                            checked={isLineBound ? lineChecked : false}
                            disabled={!isLineBound}
                            onCheckedChange={(val) => handleToggle("line", item.key, val)}
                            label={`${item.title} LINE 通知開關`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* 底部儲存與重設按鈕區 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs text-muted-foreground min-h-5 flex items-center">
                  {saveSuccess && (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="h-4 w-4" />
                      通知偏好設定已成功儲存
                    </span>
                  )}
                  {!saveSuccess && hasChanges && (
                    <span className="text-amber-500 font-medium">
                      您有尚未儲存的開關變更
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRestoreDefaults}
                    disabled={saving}
                    className="border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 text-xs h-9 px-3 rounded-lg cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    恢復預設值
                  </Button>
                  {hasChanges && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      disabled={saving}
                      className="hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs h-9 px-3 rounded-lg cursor-pointer"
                    >
                      放棄變更
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="min-w-[120px] bg-[#ffc000] hover:bg-[#e6ad00] text-black font-semibold text-xs h-9 px-4 rounded-lg shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        儲存通知設定
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── LINE 官方帳號 6 碼動態綁定 Dialog ─── */}
      <Dialog open={bindModalOpen} onOpenChange={handleBindModalOpenChange}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1e1c26] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <MessageSquare className="h-5 w-5 text-[#06c755]" />
              綁定 臺科大機器人研究社 官方 LINE 帳號
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              請依照以下兩步驟完成學號與 LINE 官方帳號之安全綁定。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* 步驟 1: 加入好友 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ffc000] text-black text-[11px] font-bold shrink-0">
                  1
                </span>
                <span>掃描 QR Code 或搜尋 ID 加入社團官方帳號</span>
              </div>
              <div className="flex flex-col items-center gap-2.5">
                <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl w-fit mx-auto shadow-xs">
                  <div className="p-2 bg-white rounded-lg shadow-xs">
                    <QRCodeSVG
                      value={process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL || "https://line.me/R/ti/p/@ntust_rrc"}
                      size={140}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>
                <a
                  href={process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL || "https://line.me/R/ti/p/@ntust_rrc"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  手機版點此直接開啟 LINE 加入好友
                </a>
              </div>
            </div>

            {/* 步驟 2: 發送動態驗證碼 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ffc000] text-black text-[11px] font-bold shrink-0">
                    2
                  </span>
                  <span>在 LINE 聊天室直接發送此綁定碼</span>
                </div>
                {bindCountdown > 0 && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-medium">
                    有效剩餘: {formatCountdown(bindCountdown)}
                  </span>
                )}
              </div>

              {/* 綁定碼展示與複製按鈕 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700">
                <span className="font-mono text-xl font-bold tracking-widest text-slate-900 dark:text-[#ffc000] pl-2">
                  {bindCode || "BIND-XXXX"}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs h-8 cursor-pointer shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500 mr-1" />
                      已複製
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      複製
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 說明與確認 (無 Emoji) */}
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-slate-200 dark:border-white/10 leading-relaxed flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>機器人收到綁定碼後會自動回覆確認訊息。完成後回到此頁面點擊「檢查綁定狀態」即可啟用。</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBindModalOpenChange(false)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              完成並關閉
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                await fetchPreferences();
                toast({ title: "已重新檢查綁定狀態" });
              }}
              className="bg-[#ffc000] hover:bg-[#e6ad00] text-black font-semibold text-xs cursor-pointer shadow-sm active:scale-[0.98] transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              檢查綁定狀態
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
