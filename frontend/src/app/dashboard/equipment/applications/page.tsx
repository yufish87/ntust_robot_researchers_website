"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

interface ApplicationItem {
  id: string;
  studentId: string;
  name: string;
  reason: string;
  items: Array<{ code: string; name: string; qty: number } | string>; // Handle legacy or string
  allocated?: Array<{ code: string; items: string[] }>;
  summary: string;
  pickupDate: string;
  returnDate: string;
  status: string;
  createdAt: string;
  rejectReason?: string;
}

export default function ApplicationsPage() {
  const [error, setError] = useState("");

  const { data: applications = [], isLoading: loading } = useQuery({
    queryKey: ["my-equipment-apps"],
    queryFn: async () => {
      const res = await api.get("/equipment/applications");
      if (res.data.success) return res.data.data as ApplicationItem[];
      throw new Error(res.data.message || "Failed to fetch applications");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "待審核":
        return "bg-yellow-500";
      case "已核准":
        return "bg-green-500"; // Or 'Approved'
      case "已借出":
        return "bg-blue-500";
      case "已歸還":
        return "bg-gray-500";
      case "不予通過":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getAllocatedIdText = (app: ApplicationItem, code?: string) => {
    if (!code || !Array.isArray(app.allocated)) return "";
    const matched = app.allocated.find((alloc) => alloc.code === code);
    if (!matched || !Array.isArray(matched.items) || matched.items.length === 0)
      return "";
    return matched.items.join(", ");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <AdminPageHeader
        title="器材借用申請紀錄"
        description="追蹤個人器材借用申請進度、點收歸還狀況與歷史紀錄。"
      >
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Link href="/dashboard/equipment" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              器材目錄
            </Button>
          </Link>
          <Link href="/dashboard/equipment" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold shadow-xs cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4">
              <Plus className="mr-1.5 h-4 w-4" />
              新增申請
            </Button>
          </Link>
        </div>
      </AdminPageHeader>

      {loading ? (
        <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-12 text-center text-muted-foreground text-sm">
          載入申請紀錄中...
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-[#201e26] rounded-xl border border-red-200 dark:border-red-900/40 p-8 text-center text-red-500 text-sm">
          錯誤: {error}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-12 text-center">
          <p className="text-muted-foreground mb-4 text-sm">目前沒有任何申請紀錄</p>
          <Link href="/dashboard/equipment">
            <Button className="bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold">前往借用器材</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Sort by Date Descending */}
          {applications
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((app) => (
              <Card key={app.id} className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden gap-0">
                <CardHeader className="bg-slate-50/70 dark:bg-white/5 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base font-bold">{app.id}</CardTitle>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        申請日期: {app.createdAt}
                      </CardDescription>
                    </div>
                    <div className="text-right text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      <div>
                        預計歸還:{" "}
                        {new Date(app.returnDate).toLocaleDateString("zh-TW", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-2">
                    <span className="font-semibold text-gray-700">
                      借用原因:
                    </span>{" "}
                    {app.reason}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      器材清單:
                    </span>
                    <ul className="list-disc list-inside mt-1 text-gray-600 bg-gray-50 p-3 rounded-md">
                      {Array.isArray(app.items) ? (
                        app.items.map((item, idx) => {
                          if (typeof item === "string")
                            return <li key={idx}>{item}</li>;
                          const allocatedIds = getAllocatedIdText(
                            app,
                            item.code,
                          );
                          return (
                            <li key={idx}>
                              {item.name} x{item.qty}
                              {allocatedIds ? (
                                <span className="text-gray-500 text-xs">
                                  {" "}
                                  ({allocatedIds})
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">
                                  {" "}
                                  ({item.code})
                                </span>
                              )}
                            </li>
                          );
                        })
                      ) : (
                        <li>{app.summary}</li>
                      )}
                    </ul>
                  </div>
                  {app.rejectReason && (
                    <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md border border-red-100">
                      <span className="font-semibold">拒絕原因:</span>{" "}
                      {app.rejectReason}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
