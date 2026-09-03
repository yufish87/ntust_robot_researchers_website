"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Plus,
  MoreHorizontal,
  FileText,
  Calendar,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { FinanceDetailModal } from "@/components/finance/FinanceDetailModal";
import { CancelConfirmModal } from "@/components/finance/CancelConfirmModal";

import { FinanceAPI } from "@/lib/api/finance";
import type { FinanceApplication } from "@/lib/types/finance";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function FinanceDashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [selectedApp, setSelectedApp] = useState<FinanceApplication | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cancel Modal State
  const [cancelAppId, setCancelAppId] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  /* ---------- 資料載入（useQuery 快取）---------- */
  const {
    data = [],
    isLoading: loading,
    isFetching: refreshing,
    refetch,
  } = useQuery<FinanceApplication[]>({
    queryKey: ["my-finance-apps"],
    queryFn: async () => {
      const res = await FinanceAPI.getMyApplications();
      return res;
    },
  });

  const handleViewDetails = (app: FinanceApplication) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  // Trigger from Dropdown
  const confirmCancel = (appId: string) => {
    setCancelAppId(appId);
    setIsCancelModalOpen(true);
  };

  // Action from Modal
  const handleCancelExecute = async () => {
    if (!cancelAppId) return;

    try {
      setIsCancelling(true);
      await FinanceAPI.cancel(cancelAppId);

      toast({
        title: "申請已取消",
        description: `單號 ${cancelAppId} 已成功取消。`,
      });

      setIsCancelModalOpen(false);
      setCancelAppId(null);

      // invalidate 快取讓資料重新載入
      queryClient.invalidateQueries({ queryKey: ["my-finance-apps"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "取消失敗",
        description: error.message || "發生未知錯誤",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // 進行中：審核中 or 已通過 (尚未完成撥款)
  const activeApplications = data.filter(
    (app) =>
      app.status === "審核中" ||
      (app.status === "已通過" && app.disbursementStatus !== "已撥款"),
  );
  const historyApplications = data.filter(
    (app) =>
      app.status === "不予通過" ||
      app.status === "已取消" ||
      (app.status === "已通過" && app.disbursementStatus === "已撥款"),
  );

  const currentList =
    activeTab === "active" ? activeApplications : historyApplications;

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

  function getCategoryName(cat: string) {
    const map: Record<string, string> = {
      activity: "活動費",
      equipment: "器材費",
      course: "講師費",
      food: "誤餐費",
      transport: "交通費",
      other: "其他",
    };
    return map[cat] || cat;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <AdminPageHeader
        title="財務報帳"
        description="管理個人社團支出報帳申請、追蹤審核進度、發票繳交與撥款紀錄。"
      >
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
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

          <Link href="/dashboard/finance/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold shadow-xs cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4">
              <Plus className="mr-1.5 h-4 w-4" />
              新增申請
            </Button>
          </Link>
        </div>
      </AdminPageHeader>

      {/* Custom Track Tabs */}
      <div className="flex space-x-1.5 rounded-xl bg-slate-100 dark:bg-[#1a1820] border border-slate-200/80 dark:border-white/10 p-1 w-fit">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "active"
              ? "bg-white dark:bg-[#201e26] text-slate-900 dark:text-[#ffc000] shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          進行中 ({activeApplications.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-white dark:bg-[#201e26] text-slate-900 dark:text-[#ffc000] shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          歷史紀錄 ({historyApplications.length})
        </button>
      </div>

      <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {activeTab === "active" ? "進行中報帳項目" : "歷史報帳紀錄"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {activeTab === "active"
                ? "目前正在進行幹部審核、發票點收或撥款流程的單據。"
                : "已經結束報帳流程或不予通過之項目。"}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              載入中...
            </div>
          ) : currentList.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">目前沒有資料</p>
              {activeTab === "active" && (
                <Link
                  href="/dashboard/finance/new"
                  className="mt-4 inline-block"
                >
                  <Button variant="link" className="text-amber-600 dark:text-[#ffc000]">立即申請</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* 行動端卡片清單 (sm:hidden) */}
              <div className="sm:hidden divide-y divide-slate-100 dark:divide-white/5">
                {currentList.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 space-y-2.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {app.id}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          {getCategoryName(app.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusBadge(app)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(app)}
                            >
                              查看詳情
                            </DropdownMenuItem>
                            {app.status === "已通過" &&
                              app.invoiceSubmitStatus === "未提交" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      try {
                                        await FinanceAPI.submitInvoice(app.id);
                                        toast({
                                          title: "回報成功",
                                          description:
                                            "已回報發票投遞，請等待管理員確認。",
                                        });
                                        queryClient.invalidateQueries({
                                          queryKey: ["my-finance-apps"],
                                        });
                                      } catch (err: any) {
                                        toast({
                                          variant: "destructive",
                                          title: "操作失敗",
                                          description: err.message || "未知錯誤",
                                        });
                                      }
                                    }}
                                  >
                                    回報已投遞發票
                                  </DropdownMenuItem>
                                </>
                              )}
                            {app.status === "審核中" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => confirmCancel(app.id)}
                                >
                                  取消申請
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div
                      className="cursor-pointer"
                      onClick={() => handleViewDetails(app)}
                    >
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {app.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 text-xs text-muted-foreground border-t border-slate-100 dark:border-white/5">
                      <span>
                        申請日期：
                        {app.createdAt
                          ? format(new Date(app.createdAt), "yyyy/MM/dd")
                          : "-"}
                      </span>
                      <span className="font-bold text-sm text-amber-600 dark:text-[#ffc000]">
                        NT$ {Number(app.totalAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 桌面端表格 (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto">
                <Table className="min-w-[750px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>單號</TableHead>
                      <TableHead>類別</TableHead>
                      <TableHead className="w-[300px]">說明</TableHead>
                      <TableHead>申請日期</TableHead>
                      <TableHead className="w-[120px]">金額</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentList.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-mono text-xs">
                          {app.id}
                        </TableCell>
                        <TableCell>{getCategoryName(app.category)}</TableCell>
                        <TableCell
                          className="truncate max-w-[300px]"
                          title={app.description}
                        >
                          {app.description}
                        </TableCell>
                        <TableCell>
                          {app.createdAt
                            ? format(new Date(app.createdAt), "yyyy/MM/dd")
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          NT$ {Number(app.totalAmount).toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(app)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(app)}
                              >
                                查看詳情
                              </DropdownMenuItem>
                              {app.status === "已通過" &&
                                app.invoiceSubmitStatus === "未提交" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        try {
                                          await FinanceAPI.submitInvoice(app.id);
                                          toast({
                                            title: "回報成功",
                                            description:
                                              "已回報發票投遞，請等待管理員確認。",
                                          });
                                          queryClient.invalidateQueries({
                                            queryKey: ["my-finance-apps"],
                                          });
                                        } catch (err: any) {
                                          toast({
                                            variant: "destructive",
                                            title: "操作失敗",
                                            description:
                                              err.message || "未知錯誤",
                                          });
                                        }
                                      }}
                                    >
                                      回報已投遞發票
                                    </DropdownMenuItem>
                                  </>
                                )}
                              {app.status === "審核中" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => confirmCancel(app.id)}
                                  >
                                    取消申請
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>

      <FinanceDetailModal
        application={selectedApp}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <CancelConfirmModal
        appId={cancelAppId}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelExecute}
        isLoading={isCancelling}
      />
    </div>
  );
}
