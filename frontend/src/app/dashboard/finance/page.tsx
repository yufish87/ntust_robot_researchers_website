"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, FileText, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// Types
interface FinanceApplication {
  id: string;
  category: string;
  description: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  // Extended fields for details
  items: any[]; 
  invoiceType: string;
  invoiceNumber?: string;
  invoiceDate: string;
  fileId?: string;
  fileLink?: string;
  rejectReason?: string;
}

export default function FinanceDashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<FinanceApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [selectedApp, setSelectedApp] = useState<FinanceApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Cancel Modal State
  const [cancelAppId, setCancelAppId] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Wait a bit to ensure GAS propagation/lock release if called after action
      // await new Promise(r => setTimeout(r, 1000)); 
      
      const res = await FinanceAPI.getMyApplications();
      
      // Force refresh data in case of stale state
      setData([...res]); 
    } catch (error) {
      console.error("Failed to fetch applications", error);
    } finally {
      setLoading(false);
    }
  };

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
      
      // Delay fetch to allow backend propagation
      setTimeout(() => fetchData(), 500);
      
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

  const activeApplications = data.filter(app => app.status === "pending");
  const historyApplications = data.filter(app => app.status !== "pending");

  const currentList = activeTab === "active" ? activeApplications : historyApplications;

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">審核中</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">已通過</Badge>;
      case "rejected":
        return <Badge variant="destructive">已拒絕</Badge>;
      case "cancelled":
        return <Badge variant="secondary">已取消</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
      <div className="container p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">財務報帳</h1>
            <p className="text-muted-foreground">
              管理您的所有報帳申請與歷史紀錄。
            </p>
          </div>
          <Link href="/dashboard/finance/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新增申請
            </Button>
          </Link>
        </div>

        {/* Custom Tabs */}
        <div className="flex space-x-1 rounded-lg bg-slate-100 p-1 w-fit">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "active" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            進行中 ({activeApplications.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "history" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            歷史紀錄 ({historyApplications.length})
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{activeTab === "active" ? "進行中" : "歷史紀錄"}</CardTitle>
            <CardDescription>
              {activeTab === "active" 
                ? "目前正在進行報帳流程的項目。" 
                : "已經結束報帳流程的項目。"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">載入中...</div>
            ) : currentList.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">目前沒有資料</p>
                {activeTab === "active" && (
                  <Link href="/dashboard/finance/new" className="mt-4 inline-block">
                    <Button variant="link">立即申請</Button>
                  </Link>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
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
                      <TableCell className="font-mono text-xs">{app.id}</TableCell>
                      <TableCell>{getCategoryName(app.category)}</TableCell>
                      <TableCell className="truncate max-w-[300px]" title={app.description}>
                        {app.description}
                      </TableCell>
                      <TableCell>
                        {app.createdAt ? format(new Date(app.createdAt), "yyyy/MM/dd") : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        NT$ {Number(app.totalAmount).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(app)}>
                              查看詳情
                            </DropdownMenuItem>
                            {app.status === 'pending' && (
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
            )}
          </CardContent>
        </Card>

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
