"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UserAPI } from "@/lib/api/user";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";

interface LineBindDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * LINE 官方帳號綁定 Modal (全系統單一標準元件)
 * 個人設定與首次進入資源管理系統共用
 */
export function LineBindDialog({
  open,
  onOpenChange,
  onSuccess,
}: LineBindDialogProps) {
  const { updateUser } = useAuthStore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [bindCode, setBindCode] = useState<string>("");
  const [bindCountdown, setBindCountdown] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const lineAddFriendUrl =
    process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL ||
    "https://line.me/R/ti/p/@ntust_rrc";

  // 格式化倒數分秒
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 取得綁定碼
  const fetchBindCode = useCallback(async () => {
    setLoading(true);
    try {
      const res = await UserAPI.requestLineBindCode();
      setBindCode(res.bindCode);
      setBindCountdown(res.ttlSeconds || 900);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "產生驗證碼失敗";
      toast({
        title: "操作失敗",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 開啟彈窗時自動產生或更新綁定碼
  useEffect(() => {
    if (open) {
      void fetchBindCode();
    } else {
      setCopied(false);
    }
  }, [open, fetchBindCode]);

  // 倒數計時器
  useEffect(() => {
    if (bindCountdown <= 0) return;
    const timer = setInterval(() => {
      setBindCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [bindCountdown]);

  // 複製綁定碼
  const handleCopyCode = () => {
    if (!bindCode) return;
    navigator.clipboard.writeText(bindCode);
    setCopied(true);
    toast({ title: "已複製綁定碼", description: `已複製「${bindCode}」至剪貼簿` });
    setTimeout(() => setCopied(false), 2000);
  };

  // 檢查綁定狀態
  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const data = await UserAPI.getNotificationPrefs();
      const isBound = Boolean(
        data.lineBindStatus?.bound ||
          data.lineBindStatus?.lineUserId ||
          (data as any).isLineBound
      );

      if (isBound) {
        updateUser({ isLineBound: true });
        toast({
          title: "LINE 帳號綁定成功",
          description: "您的帳號已成功與 LINE 官方帳號連結，可即時接收各項社務推播！",
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "尚未偵測到綁定",
          description: "請確認已在 LINE 官方帳號聊天室發送綁定碼，或稍後再試。",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "檢查失敗";
      toast({
        variant: "destructive",
        title: "檢查失敗",
        description: message,
      });
    } finally {
      setChecking(false);
    }
  };

  // 關閉彈窗
  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen && bindCountdown > 0) {
      const confirmClose = window.confirm(
        "確定要中斷 LINE 綁定流程嗎？\n若尚未在官方 LINE 聊天室發送驗證碼，關閉後需重新取得綁定碼。\n\nAre you sure you want to cancel the LINE binding process?\nIf you have not sent the verification code in LINE yet, you will need to request a new code next time."
      );
      if (!confirmClose) return;
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
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
                    value={lineAddFriendUrl}
                    size={140}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>
              <a
                href={lineAddFriendUrl}
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
              {loading && !bindCode ? (
                <div className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground animate-pulse pl-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ffc000]" />
                  <span>正在產生專屬 6 碼驗證代碼...</span>
                </div>
              ) : (
                <span className="font-mono text-xl font-bold tracking-widest text-slate-900 dark:text-[#ffc000] pl-2">
                  {bindCode || "BIND-XXXX"}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                disabled={loading || !bindCode}
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

          {/* 說明與確認 */}
          <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-slate-200 dark:border-white/10 leading-relaxed flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>機器人收到綁定碼後會自動回覆確認訊息。完成後回到此頁面點擊「檢查綁定狀態」即可啟用。</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDialogChange(false)}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            完成並關閉
          </Button>
          <Button
            size="sm"
            onClick={handleCheckStatus}
            disabled={checking}
            className="bg-[#ffc000] hover:bg-[#e6ad00] text-black font-semibold text-xs cursor-pointer shadow-sm active:scale-[0.98] transition-all"
          >
            {checking ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                檢查中...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                檢查綁定狀態
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 首次進入資源管理系統自動彈窗控制器 (只負責判斷何時開啟同一個 LineBindDialog)
 */
export function FirstLoginLineBindPrompt() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!user || !user.studentId) return;
    if (hasTriggeredRef.current) return;

    const studentIdStr = String(user.studentId);
    const storageKey = `line_bind_prompted_${studentIdStr}`;
    const hasPrompted = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    const justRegistered = typeof window !== "undefined" ? sessionStorage.getItem("just_registered") === "true" : false;

    // 若已知已綁定，直接標記返回，不彈窗
    if (user.isLineBound === true) {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, "true");
        sessionStorage.removeItem("just_registered");
      }
      return;
    }

    // 若剛註冊或從未提示過：秒開彈窗
    if (justRegistered || !hasPrompted) {
      hasTriggeredRef.current = true;
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, "true");
        sessionStorage.removeItem("just_registered");
      }
      setOpen(true);
    }
  }, [user]);

  return <LineBindDialog open={open} onOpenChange={setOpen} />;
}
