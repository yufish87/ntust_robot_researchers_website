"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import {
  Printer,
  Zap,
  Loader2,
  FileText,
  CalendarClock,
  Check,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { MachineAPI } from "@/lib/api/machine";
import { useToast } from "@/hooks/use-toast";

// Types matching MachineRepository output
interface MachineApplication {
  id: string;
  type: string; // '3d-printer' | 'laser-cutter'
  applicantId: string;
  name: string;
  purpose: string;
  needAssist: string;
  quantity: number;
  status: string;
  createdAt: string;
  rejectReason?: string;
  proposedTime?: string;
  // 3DP specific
  infill?: string;
  estimateMaterial?: string;
  screenshotLink?: string;
  // LSC specific
  materialSource?: string;
  materialType?: string;
  thickness?: string;
  // Common
  estimateTime: string;
  fileLink: string;
  useTime: string;
  note: string;
}

export default function MachineReservationPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // 確認 Dialog 狀態
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    accept: boolean;
    proposedTime?: string;
  } | null>(null);

  /* ---------- 資料載入（useQuery 快取）---------- */
  const { data = [], isLoading: loading } = useQuery<MachineApplication[]>({
    queryKey: ["my-machine-apps"],
    queryFn: async () => {
      const res = await MachineAPI.getMyApplications();
      return res;
    },
  });

  const activeApplications = data.filter((app) =>
    ["審核中", "待確認", "已預約", "使用中"].includes(app.status),
  );
  const historyApplications = data.filter((app) =>
    ["已完成", "不予通過"].includes(app.status),
  );

  const currentList =
    activeTab === "active" ? activeApplications : historyApplications;

  /* ---------- 回覆排程建議 ---------- */
  const handleReplyConfirm = async () => {
    if (!confirmTarget) return;
    setActionLoading(confirmTarget.id);
    try {
      const res = await MachineAPI.replyProposal(
        confirmTarget.id,
        confirmTarget.accept,
      );
      if (res.success) {
        toast({
          title: confirmTarget.accept ? "已接受排程" : "已拒絕排程",
          description: confirmTarget.accept
            ? "排程已確認，請於指定時間前往使用。"
            : "已拒絕此排程，管理員將重新安排。",
        });
        setConfirmTarget(null);
        queryClient.invalidateQueries({ queryKey: ["my-machine-apps"] });
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
        title: "操作失敗",
        description: "請稍後再試",
      });
    } finally {
      setActionLoading(null);
    }
  };

  function getStatusBadge(status: string) {
    switch (status) {
      case "審核中":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            審核中
          </Badge>
        );
      case "待確認":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            待確認
          </Badge>
        );
      case "已預約":
        return (
          <Badge
            variant="outline"
            className="bg-indigo-50 text-indigo-700 border-indigo-200"
          >
            已預約
          </Badge>
        );
      case "使用中":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
            使用中
          </Badge>
        );
      case "已完成":
        return <Badge variant="secondary">已完成</Badge>;
      case "不予通過":
        return <Badge variant="destructive">不予通過</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  function formatDateTime(raw?: string) {
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
        hour12: true,
      });
    } catch {
      return raw;
    }
  }

  function getTypeBadge(type: string) {
    if (type === "3d-printer") {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          3D 列印
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          雷射切割
        </Badge>
      );
    }
  }

  return (
    <div className="container p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header & Selection */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">機器設備借用</h1>
          <p className="text-muted-foreground">
            請選擇您要借用的設備類型，或查看下方的申請紀錄。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 3D Printer Card */}
          <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50 cursor-pointer group">
            <Link href="/dashboard/machine/3d-printer" className="block h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Printer className="h-6 w-6" />
                  </div>
                  3D 列印機
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base mt-2">
                  提供借用Creality Ender 3 S1 Pro。需上傳gcode檔案與切片預覽圖。
                </CardDescription>
                <div className="mt-6">
                  <Button className="w-full group-hover:bg-blue-600">
                    立即申請
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Laser Cutter Card */}
          <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50 cursor-pointer group">
            <Link
              href="/dashboard/machine/laser-cutter"
              className="block h-full"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <Zap className="h-6 w-6" />
                  </div>
                  雷射切割機
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base mt-2">
                  提供借用FLUX Ador。需上傳向量圖檔 (.ai, .dxf, .svg 等)。
                </CardDescription>
                <div className="mt-6">
                  <Button className="w-full group-hover:bg-orange-600">
                    立即申請
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>

      {/* Application List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">我的申請</h2>
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
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {activeTab === "active" ? "進行中列表" : "歷史紀錄列表"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground flex justify-center items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                載入中...
              </div>
            ) : currentList.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">目前沒有資料</p>
              </div>
            ) : (
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[170px]">單號</TableHead>
                    <TableHead className="w-[80px]">設備</TableHead>
                    <TableHead className="w-auto">用途</TableHead>
                    <TableHead className="w-[100px]">申請日期</TableHead>
                    <TableHead className="w-[90px]">預估時間</TableHead>
                    <TableHead className="w-[160px]">建議時間</TableHead>
                    <TableHead className="w-[80px]">狀態</TableHead>
                    <TableHead className="w-[180px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentList.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-xs">
                        {app.id}
                      </TableCell>
                      <TableCell>{getTypeBadge(app.type)}</TableCell>
                      <TableCell
                        className="truncate max-w-[300px]"
                        title={app.purpose}
                      >
                        {app.purpose}
                      </TableCell>
                      <TableCell>
                        {app.createdAt
                          ? format(new Date(app.createdAt), "yyyy/MM/dd")
                          : "-"}
                      </TableCell>
                      <TableCell>{app.estimateTime}</TableCell>
                      <TableCell className="text-sm">
                        {app.proposedTime ? (
                          <span className="text-blue-600 font-medium">
                            {formatDateTime(app.proposedTime)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.fileLink && (
                            <a
                              href={app.fileLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                title="下載檔案"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                          {/* 待確認 → 接受 / 拒絕排程 */}
                          {app.status === "待確認" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={actionLoading === app.id}
                                onClick={() =>
                                  setConfirmTarget({
                                    id: app.id,
                                    accept: true,
                                    proposedTime: app.proposedTime,
                                  })
                                }
                              >
                                {actionLoading === app.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                )}
                                接受
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={actionLoading === app.id}
                                onClick={() =>
                                  setConfirmTarget({
                                    id: app.id,
                                    accept: false,
                                    proposedTime: app.proposedTime,
                                  })
                                }
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                拒絕
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- 排程回覆確認 Dialog ---- */}
      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.accept ? "確認接受排程" : "確認拒絕排程"}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.accept ? (
                <>
                  管理員建議的使用時間為：
                  <span className="block mt-2 text-base font-semibold text-blue-700">
                    <CalendarClock className="inline h-4 w-4 mr-1 -mt-0.5" />
                    {formatDateTime(confirmTarget?.proposedTime)}
                  </span>
                  <span className="block mt-2">
                    接受後將確認預約，請於指定時間前往使用。
                  </span>
                </>
              ) : (
                <>
                  管理員建議的使用時間為：
                  <span className="block mt-2 text-base font-semibold text-blue-700">
                    <CalendarClock className="inline h-4 w-4 mr-1 -mt-0.5" />
                    {formatDateTime(confirmTarget?.proposedTime)}
                  </span>
                  <span className="block mt-2">
                    拒絕後管理員將重新安排時間，您的申請會回到「審核中」。
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              取消
            </Button>
            {confirmTarget?.accept ? (
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={actionLoading !== null}
                onClick={handleReplyConfirm}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                確認接受
              </Button>
            ) : (
              <Button
                variant="destructive"
                disabled={actionLoading !== null}
                onClick={handleReplyConfirm}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                確認拒絕
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
