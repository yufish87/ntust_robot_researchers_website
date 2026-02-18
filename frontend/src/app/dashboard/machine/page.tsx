"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Printer, Zap, Loader2, MoreHorizontal, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MachineAPI } from "@/lib/api/machine";

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
  const [data, setData] = useState<MachineApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await MachineAPI.getMyApplications();
      setData(res);
    } catch (error) {
      console.error("Failed to fetch machine applications", error);
    } finally {
      setLoading(false);
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

  function getTypeBadge(type: string) {
    if (type === '3d-printer') {
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">3D 列印</Badge>;
    } else {
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">雷射切割</Badge>;
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
            <Link href="/dashboard/machine/laser-cutter" className="block h-full">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>單號</TableHead>
                    <TableHead>設備</TableHead>
                    <TableHead className="w-[300px]">用途</TableHead>
                    <TableHead>申請日期</TableHead>
                    <TableHead>預估時間</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentList.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-xs">{app.id}</TableCell>
                      <TableCell>{getTypeBadge(app.type)}</TableCell>
                      <TableCell className="truncate max-w-[300px]" title={app.purpose}>
                        {app.purpose}
                      </TableCell>
                      <TableCell>
                        {app.createdAt ? format(new Date(app.createdAt), "yyyy/MM/dd") : "-"}
                      </TableCell>
                      <TableCell>{app.estimateTime}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right">
                        {app.fileLink && (
                            <a href={app.fileLink} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" title="下載檔案">
                                    <FileText className="h-4 w-4" />
                                </Button>
                            </a>
                        )}
                        {/* More actions can be added here */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
