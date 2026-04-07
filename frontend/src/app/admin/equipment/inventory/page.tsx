"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InventoryAPI } from "@/lib/api/inventory";
import type {
  InventoryItem,
  InventoryTabFilter,
  InventoryResult,
} from "@/lib/types/inventory";
import { useToast } from "@/hooks/use-toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  RefreshCw,
  ClipboardCheck,
  Search,
  RotateCcw,
  Check,
  AlertTriangle,
  WrenchIcon,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------ */
/*  使用情形 Badge                                                      */
/* ------------------------------------------------------------------ */
function UsageBadge({ usage }: { usage: string }) {
  const colorMap: Record<string, string> = {
    可借用: "bg-green-500 hover:bg-green-600",
    審核中: "bg-yellow-500 hover:bg-yellow-600",
    已借出: "bg-blue-500 hover:bg-blue-600",
    維修中: "bg-orange-500 hover:bg-orange-600",
    已報廢: "bg-red-500 hover:bg-red-600",
    遺失: "bg-red-700 hover:bg-red-800",
  };
  return (
    <Badge className={colorMap[usage] ?? "bg-gray-400"}>{usage || "—"}</Badge>
  );
}

function InventoryBadge({ checked }: { checked: boolean }) {
  return checked ? (
    <Badge className="bg-green-600 hover:bg-green-700">
      <Check className="h-3 w-3 mr-1" />已盤點
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      未盤點
    </Badge>
  );
}

/* ================================================================== */
/*  主頁面元件                                                         */
/* ================================================================== */
export default function InventoryPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<InventoryTabFilter>("all");
  const [allData, setAllData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 盤點 Dialog
  const [checkTarget, setCheckTarget] = useState<InventoryItem | null>(null);
  const [checkResult, setCheckResult] = useState<InventoryResult | null>(null);
  const [checkCondition, setCheckCondition] = useState("");

  // 恢復 Dialog
  const [resolveTarget, setResolveTarget] = useState<InventoryItem | null>(
    null,
  );
  const [resolveCondition, setResolveCondition] = useState("");

  // 重置確認 Dialog
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  /* ---------- 資料載入 ---------- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await InventoryAPI.list();
      if (res.success) {
        setAllData(res.data ?? []);
      } else {
        toast({ variant: "destructive", title: "取得資料失敗" });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "取得資料失敗",
        description: "請稍後再試",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------- 篩選 + 搜尋 ---------- */
  const ABNORMAL_STATUSES = ["維修中", "已報廢", "遺失"];

  const data = useMemo(() => {
    let filtered = allData;

    // Tab 篩選
    switch (tab) {
      case "unchecked":
        filtered = filtered.filter((item) => !item.inventoryStatus);
        break;
      case "checked":
        filtered = filtered.filter((item) => !!item.inventoryStatus);
        break;
      case "abnormal":
        filtered = filtered.filter((item) =>
          ABNORMAL_STATUSES.includes(item.usage),
        );
        break;
    }

    // 搜尋
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [allData, tab, searchQuery]);

  // 統計
  const stats = useMemo(() => {
    const total = allData.length;
    const checked = allData.filter((i) => !!i.inventoryStatus).length;
    const abnormal = allData.filter((i) =>
      ABNORMAL_STATUSES.includes(i.usage),
    ).length;
    return { total, checked, unchecked: total - checked, abnormal };
  }, [allData]);

  /* ---------- 盤點操作 ---------- */
  const handleCheck = async () => {
    if (!checkTarget || !checkResult) return;
    setActionLoading(checkTarget.id);
    try {
      const res = await InventoryAPI.update({
        equipmentId: checkTarget.id,
        result: checkResult,
        condition: checkResult !== "good" ? checkCondition : undefined,
      });
      if (res.success) {
        toast({
          title: "盤點完成",
          description: `${checkTarget.id} 已更新`,
        });
        setCheckTarget(null);
        setCheckResult(null);
        setCheckCondition("");
        fetchData();
      } else {
        toast({
          variant: "destructive",
          title: "操作失敗",
          description: res.message,
        });
      }
    } catch {
      toast({ variant: "destructive", title: "操作失敗" });
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------- 恢復操作 ---------- */
  const handleResolve = async () => {
    if (!resolveTarget) return;
    setActionLoading(resolveTarget.id);
    try {
      const res = await InventoryAPI.resolve({
        equipmentId: resolveTarget.id,
        newUsage: "可借用",
        newCondition: resolveCondition || "良好",
      });
      if (res.success) {
        toast({
          title: "已恢復",
          description: `${resolveTarget.id} 已恢復為可借用`,
        });
        setResolveTarget(null);
        setResolveCondition("");
        fetchData();
      } else {
        toast({
          variant: "destructive",
          title: "操作失敗",
          description: res.message,
        });
      }
    } catch {
      toast({ variant: "destructive", title: "操作失敗" });
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------- 重置操作 ---------- */
  const handleReset = async () => {
    setActionLoading("reset");
    try {
      const res = await InventoryAPI.reset();
      if (res.success) {
        toast({
          title: "重置完成",
          description: "所有盤點標記已清除",
        });
        setShowResetConfirm(false);
        fetchData();
      } else {
        toast({
          variant: "destructive",
          title: "操作失敗",
          description: res.message,
        });
      }
    } catch {
      toast({ variant: "destructive", title: "操作失敗" });
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="container p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">器材盤點</h1>
          <p className="text-muted-foreground">
            盤點社團器材狀態，管理異常器材。
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowResetConfirm(true)}
            disabled={loading || stats.checked === 0}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            重置盤點
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchData()}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            重新整理
          </Button>
        </div>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">總器材數</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.checked}</p>
          <p className="text-sm text-muted-foreground">已盤點</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {stats.unchecked}
          </p>
          <p className="text-sm text-muted-foreground">未盤點</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.abnormal}</p>
          <p className="text-sm text-muted-foreground">異常</p>
        </div>
      </div>

      {/* 搜尋列 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋器材編號、名稱或代碼..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as InventoryTabFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">全部 ({stats.total})</TabsTrigger>
          <TabsTrigger value="unchecked">
            未盤點 ({stats.unchecked})
          </TabsTrigger>
          <TabsTrigger value="checked">已盤點 ({stats.checked})</TabsTrigger>
          <TabsTrigger value="abnormal">異常 ({stats.abnormal})</TabsTrigger>
        </TabsList>

        {(
          ["all", "unchecked", "checked", "abnormal"] as InventoryTabFilter[]
        ).map((t) => (
          <TabsContent key={t} value={t} className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <Table style={{ tableLayout: "fixed" }}>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[90px]">器材編號</TableHead>
                    <TableHead className="w-[80px]">器材代碼</TableHead>
                    <TableHead>器材名稱</TableHead>
                    <TableHead>器材狀態</TableHead>
                    <TableHead className="w-[80px]">使用情形</TableHead>
                    <TableHead className="w-[80px]">盤點</TableHead>
                    <TableHead className="w-[130px]">盤點時間</TableHead>
                    <TableHead className="w-[80px] text-right">
                      操作
                    </TableHead>
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
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center h-32 text-muted-foreground"
                      >
                        {searchQuery
                          ? `找不到符合「${searchQuery}」的器材`
                          : "目前沒有資料"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => {
                      const isChecked = !!item.inventoryStatus;
                      const isAbnormal = ABNORMAL_STATUSES.includes(
                        item.usage,
                      );
                      return (
                        <TableRow
                          key={item.id}
                          className={
                            isAbnormal
                              ? "bg-red-50/50"
                              : isChecked
                                ? "bg-green-50/30"
                                : ""
                          }
                        >
                          <TableCell className="font-mono text-xs truncate" title={item.id}>
                            {item.id}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate" title={item.code}>
                            {item.code}
                          </TableCell>
                          <TableCell className="font-medium text-sm truncate" title={item.name}>
                            {item.name}
                          </TableCell>
                          <TableCell className="text-sm truncate" title={item.status || "—"}>
                            {item.status || "—"}
                          </TableCell>
                          <TableCell>
                            <UsageBadge usage={item.usage} />
                          </TableCell>
                          <TableCell>
                            <InventoryBadge checked={isChecked} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.inventoryTime || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              {/* 盤點按鈕 */}
                              {!isAbnormal && (
                                <Button
                                  size="sm"
                                  variant={isChecked ? "outline" : "default"}
                                  className={
                                    isChecked
                                      ? ""
                                      : "bg-green-600 hover:bg-green-700"
                                  }
                                  onClick={() => {
                                    setCheckTarget(item);
                                    setCheckResult(null);
                                    setCheckCondition("");
                                  }}
                                >
                                  <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                                  盤點
                                </Button>
                              )}
                              {/* 恢復按鈕（異常器材）*/}
                              {isAbnormal && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                  onClick={() => {
                                    setResolveTarget(item);
                                    setResolveCondition("");
                                  }}
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                  恢復
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* ---- 盤點 Dialog ---- */}
      <Dialog
        open={checkTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCheckTarget(null);
            setCheckResult(null);
            setCheckCondition("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>器材盤點</DialogTitle>
            <DialogDescription>
              器材編號：{checkTarget?.id}（{checkTarget?.name}）
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm font-medium">選擇盤點結果：</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  value: "good" as InventoryResult,
                  label: "✅ 良好",
                  desc: "狀態良好，可正常使用",
                  icon: Check,
                },
                {
                  value: "usable" as InventoryResult,
                  label: "⚠️ 不佳但可用",
                  desc: "有瑕疵但仍可使用",
                  icon: AlertTriangle,
                },
                {
                  value: "repair" as InventoryResult,
                  label: "🔧 需維修",
                  desc: "無法使用，需送修",
                  icon: WrenchIcon,
                },
                {
                  value: "scrap" as InventoryResult,
                  label: "🗑️ 報廢",
                  desc: "無法修復，標記報廢",
                  icon: Trash2,
                },
                {
                  value: "lost" as InventoryResult,
                  label: "❌ 遺失",
                  desc: "找不到器材",
                  icon: HelpCircle,
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    checkResult === opt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => setCheckResult(opt.value)}
                >
                  <opt.icon className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* 狀態描述（非良好時） */}
            {checkResult && checkResult !== "good" && (
              <div className="pt-2">
                <label className="text-sm font-medium">
                  器材狀態描述
                  {checkResult === "usable" && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <Textarea
                  placeholder="請描述器材狀態..."
                  value={checkCondition}
                  onChange={(e) => setCheckCondition(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCheckTarget(null);
                setCheckResult(null);
                setCheckCondition("");
              }}
            >
              取消
            </Button>
            <Button
              disabled={
                !checkResult ||
                (checkResult === "usable" && !checkCondition.trim()) ||
                actionLoading !== null
              }
              onClick={handleCheck}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              確認盤點
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- 恢復 Dialog ---- */}
      <Dialog
        open={resolveTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResolveTarget(null);
            setResolveCondition("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>恢復器材</DialogTitle>
            <DialogDescription>
              將 {resolveTarget?.id}（{resolveTarget?.name}）的使用情形從「
              {resolveTarget?.usage}」恢復為「可借用」。
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="text-sm font-medium">
              新器材狀態描述（選填）
            </label>
            <Textarea
              placeholder="如：已修復、已找回..."
              value={resolveCondition}
              onChange={(e) => setResolveCondition(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolveTarget(null);
                setResolveCondition("");
              }}
            >
              取消
            </Button>
            <Button
              disabled={actionLoading !== null}
              onClick={handleResolve}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              確認恢復
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- 重置確認 Dialog ---- */}
      <Dialog
        open={showResetConfirm}
        onOpenChange={(open) => {
          if (!open) setShowResetConfirm(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置所有盤點</DialogTitle>
            <DialogDescription>
              確定要清空所有器材的盤點標記嗎？此操作將清除 {stats.checked}{" "}
              筆盤點紀錄，開始新一輪盤點。此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading !== null}
              onClick={handleReset}
            >
              {actionLoading === "reset" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              確認重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
