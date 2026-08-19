"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FinanceAPI, FinanceAdminAPI } from "@/lib/api/finance";
import type {
  FinanceApplication,
  FinanceStatusFilter,
} from "@/lib/types/finance";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, XCircle, Banknote, Eye, FileCheck, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { FinanceDetailModal } from "@/components/finance/FinanceDetailModal";
import { format } from "date-fns";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type TabKey = "pending" | "invoice" | "disburse" | "history";

const TABS: { key: TabKey; label: string; filter: FinanceStatusFilter }[] = [
  { key: "pending", label: "待審核", filter: "pending" },
  { key: "invoice", label: "待交發票", filter: "invoice" },
  { key: "disburse", label: "待撥款", filter: "disburse" },
  { key: "history", label: "歷史紀錄", filter: "history" },
];

export default function AdminFinancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [actionLoading, setActionLoading] = useState(false);

  // Detail modal
  const [detailApp, setDetailApp] = useState<FinanceApplication | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Reject dialog
  const [rejectApp, setRejectApp] = useState<FinanceApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Disburse confirm dialog
  const [disburseApp, setDisburseApp] = useState<FinanceApplication | null>(
    null,
  );

  // Receive invoice confirm dialog
  const [receiveInvoiceApp, setReceiveInvoiceApp] =
    useState<FinanceApplication | null>(null);

  /* ---------- 資料載入（useQuery 快取）---------- */
  const {
    data: allData = [],
    isLoading: loading,
    isFetching: refreshing,
    refetch,
  } = useQuery<FinanceApplication[]>({
    queryKey: ["admin-finance"],
    queryFn: async () => {
      const res = await FinanceAdminAPI.list("all");
      if (res.success) return res.data ?? [];
      throw new Error("載入失敗");
    },
  });

  /* ---------- 前端依 activeTab 篩選 ---------- */
  const data = useMemo(() => {
    return allData.filter((app) => {
      switch (activeTab) {
        case "pending":
          return app.status === "審核中";
        case "invoice":
          return (
            app.status === "已通過" && app.invoiceSubmitStatus === "未提交"
          );
        case "disburse":
          return (
            app.status === "已通過" &&
            app.invoiceSubmitStatus === "已提交" &&
            app.disbursementStatus === "待撥款"
          );
        case "history":
          return (
            app.disbursementStatus === "已撥款" ||
            app.status === "不予通過" ||
            app.status === "已取消"
          );
        default:
          return true;
      }
    });
  }, [allData, activeTab]);

  // ── Actions ────────────────────────
  const handleApprove = async (app: FinanceApplication) => {
    setActionLoading(true);
    try {
      const res = await FinanceAdminAPI.approve(app.id);
      if (res.success) {
        toast({ title: "已通過", description: `申請 ${app.id} 已核准。` });
        queryClient.invalidateQueries({ queryKey: ["admin-finance"] });
      } else {
        toast({
          variant: "destructive",
          title: "操作失敗",
          description: res.message,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "系統錯誤",
        description: "無法連線至伺服器",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectApp || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await FinanceAdminAPI.reject(
        rejectApp.id,
        rejectReason.trim(),
      );
      if (res.success) {
        toast({
          title: "已駁回",
          description: `申請 ${rejectApp.id} 已駁回。`,
        });
        setRejectApp(null);
        setRejectReason("");
        queryClient.invalidateQueries({ queryKey: ["admin-finance"] });
      } else {
        toast({
          variant: "destructive",
          title: "操作失敗",
          description: res.message,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "系統錯誤",
        description: "無法連線至伺服器",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisburse = async () => {
    if (!disburseApp) return;
    setActionLoading(true);
    try {
      const res = await FinanceAdminAPI.disburse(disburseApp.id);
      if (res.success) {
        toast({
          title: "已撥款",
          description: `申請 ${disburseApp.id} 已完成撥款。`,
        });
        setDisburseApp(null);
        queryClient.invalidateQueries({ queryKey: ["admin-finance"] });
      } else {
        toast({
          variant: "destructive",
          title: "操作失敗",
          description: res.message,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "系統錯誤",
        description: "無法連線至伺服器",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceiveInvoice = async () => {
    if (!receiveInvoiceApp) return;
    setActionLoading(true);
    try {
      const res = await FinanceAPI.submitInvoice(receiveInvoiceApp.id);
      if (res.success) {
        toast({
          title: "已確認收到發票",
          description: `申請 ${receiveInvoiceApp.id} 已標記收到發票，並轉入待撥款清單。`,
        });
        setReceiveInvoiceApp(null);
        queryClient.invalidateQueries({ queryKey: ["admin-finance"] });
      } else {
        toast({
          variant: "destructive",
          title: "操作失敗",
          description: res.message || "無法更新發票投遞狀態",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "系統錯誤",
        description: "無法連線至伺服器",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Helpers ────────────────────────
  function getStatusBadge(app: FinanceApplication) {
    switch (app.status) {
      case "審核中":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            審核中
          </Badge>
        );
      case "已通過": {
        if (app.disbursementStatus === "已撥款")
          return (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
              已完成
            </Badge>
          );
        if (app.invoiceSubmitStatus === "已確認")
          return (
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
              待撥款
            </Badge>
          );
        if (app.invoiceSubmitStatus === "已提交")
          return (
            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
              發票已提交
            </Badge>
          );
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
            已通過
          </Badge>
        );
      }
      case "不予通過":
        return <Badge variant="destructive">不予通過</Badge>;
      case "已取消":
        return <Badge variant="secondary">已取消</Badge>;
      default:
        return <Badge variant="secondary">{app.status}</Badge>;
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <AdminPageHeader
        title="財務報帳審核與核銷"
        description="審核社員經費報帳申請、核對發票抬頭統編與發放撥款作業。"
      >
        <Button
          variant="outline"
          onClick={() => void refetch()}
          disabled={loading || refreshing}
          aria-busy={refreshing}
          className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
        >
          <RefreshCw
            className={`mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          重新整理
        </Button>
      </AdminPageHeader>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="bg-slate-100 dark:bg-[#1a1820] border border-slate-200/80 dark:border-white/10 p-1 rounded-xl h-auto flex flex-wrap gap-1">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#201e26] data-[state=active]:text-slate-900 dark:data-[state=active]:text-[#ffc000] data-[state=active]:shadow-xs rounded-lg px-3.5 py-2 text-sm font-semibold cursor-pointer"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <Table className={data.length > 0 ? "min-w-[62.5rem] table-fixed" : "w-full table-fixed"}>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[10rem]">單號</TableHead>
              <TableHead className="w-[5.625rem]">申請人</TableHead>
              <TableHead className="w-[5.625rem]">類別</TableHead>
              <TableHead>說明</TableHead>
              <TableHead className="w-[6.875rem]">金額</TableHead>
              <TableHead className="w-[6.25rem]">申請日期</TableHead>
              <TableHead className="w-[6.875rem]">狀態</TableHead>
              <TableHead className="w-[8.75rem] text-center">操作</TableHead>
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
                  此分類目前沒有資料。
                </TableCell>
              </TableRow>
            ) : (
              data.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {app.id}
                  </TableCell>
                  <TableCell>{app.applicantName || app.applicantId}</TableCell>
                  <TableCell>{app.category}</TableCell>
                  <TableCell
                    className="truncate max-w-[200px]"
                    title={app.description}
                  >
                    {app.description}
                  </TableCell>
                  <TableCell className="font-medium">
                    NT$ {Number(app.totalAmount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {app.createdAt
                      ? format(new Date(app.createdAt), "yyyy/MM/dd")
                      : "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(app)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setDetailApp(app);
                          setIsDetailOpen(true);
                        }}
                        title="查看詳情"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {activeTab === "pending" && app.status === "審核中" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(app)}
                            disabled={actionLoading}
                            title="通過"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setRejectApp(app);
                              setRejectReason("");
                            }}
                            disabled={actionLoading}
                            title="駁回"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {activeTab === "invoice" &&
                        app.status === "已通過" &&
                        app.invoiceSubmitStatus === "未提交" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                            onClick={() => setReceiveInvoiceApp(app)}
                            disabled={actionLoading}
                            title="收到發票 (進入待撥款)"
                          >
                            <FileCheck className="h-4 w-4" />
                          </Button>
                        )}

                      {activeTab === "disburse" &&
                        app.invoiceSubmitStatus === "已提交" &&
                        app.disbursementStatus === "待撥款" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => setDisburseApp(app)}
                            disabled={actionLoading}
                            title="確認撥款"
                          >
                            <Banknote className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <FinanceDetailModal
        application={detailApp}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectApp}
        onOpenChange={(open) => {
          if (!open) setRejectApp(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>駁回申請</DialogTitle>
            <DialogDescription>
              確定要駁回 <span className="font-mono">{rejectApp?.id}</span>{" "}
              嗎？請填寫駁回原因。
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="請輸入駁回原因..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectApp(null)}
              disabled={actionLoading}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              確認駁回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disburse Confirm Dialog */}
      <AlertDialog
        open={!!disburseApp}
        onOpenChange={(open) => {
          if (!open) setDisburseApp(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認撥款</AlertDialogTitle>
            <AlertDialogDescription>
              確定要將 <span className="font-mono">{disburseApp?.id}</span>{" "}
              標記為已撥款嗎？ 金額：
              <strong>
                NT$ {Number(disburseApp?.totalAmount || 0).toLocaleString()}
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisburse}
              disabled={actionLoading}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              確認撥款
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receive Invoice Confirm Dialog */}
      <AlertDialog
        open={!!receiveInvoiceApp}
        onOpenChange={(open) => {
          if (!open) setReceiveInvoiceApp(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認收到實體發票？</AlertDialogTitle>
            <AlertDialogDescription>
              確定已收到申請人「
              <span className="font-semibold text-slate-800 dark:text-white">
                {receiveInvoiceApp?.applicantName || receiveInvoiceApp?.applicantId}
              </span>
              」的實體紙本發票？
              <br />
              確認後單據（單號：<span className="font-mono">{receiveInvoiceApp?.id}</span>）將直接轉入「待撥款」階段。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReceiveInvoice}
              disabled={actionLoading}
              className="bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold cursor-pointer"
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              確認收到發票
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
