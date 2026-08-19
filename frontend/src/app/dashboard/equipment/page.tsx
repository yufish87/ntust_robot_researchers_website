"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getGoogleDriveImageUrl } from "@/lib/utils";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EquipmentDetailModal } from "@/components/equipment/EquipmentDetailModal";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { History } from "lucide-react";
interface EquipmentIndex {
  code: string;
  name: string;
  category: string;
  description: string;
  total: number;
  available: number;
  borrowed: number;
  image: string;
  items?: any[];
}

export default function EquipmentCatalogPage() {
  const { isAuthenticated } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Modal State
  const [selectedItem, setSelectedItem] = useState<EquipmentIndex | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ---------- 資料載入（useQuery 快取）---------- */
  const { data: catalog = [], isLoading: loading } = useQuery({
    queryKey: ["equipment-catalog"],
    queryFn: async () => {
      let retries = 3;
      while (retries > 0) {
        const res = await api.get("/equipment/catalog");
        if (res.data.success) {
          return res.data.data as EquipmentIndex[];
        }
        if (res.data.message?.includes("Server is busy")) {
          await new Promise((r) => setTimeout(r, 1500));
          retries--;
          continue;
        }
        throw new Error(res.data.message || "Failed to fetch catalog");
      }
      throw new Error("Server is busy");
    },
  });

  const categories = useMemo(() => {
    const uniqueCats = Array.from(
      new Set(catalog.map((item) => item.category)),
    ).filter(Boolean);
    const preferredOrder = [
      "單晶片",
      "資訊元件",
      "傳感器",
      "電子零件",
      "馬達",
      "氣壓元件",
      "傳輸線",
      "耗材",
    ];

    const sortedCats = [...uniqueCats].sort((a, b) => {
      const aIdx = preferredOrder.indexOf(a);
      const bIdx = preferredOrder.indexOf(b);
      if (a === "其它") return 1;
      if (b === "其它") return -1;
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b, "zh-Hant");
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });

    return ["All", ...sortedCats];
  }, [catalog]);

  const filteredCatalog =
    selectedCategory === "All"
      ? catalog
      : catalog.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <AdminPageHeader
        title="器材列表"
        description="瀏覽社團各項硬體模組、感測器與工具庫存，加入借用清單並送出借用申請。"
      >
        <Link
          href="/dashboard/equipment/applications"
          className="w-full sm:w-auto"
        >
          <Button
            variant="outline"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
          >
            <History className="mr-1.5 h-4 w-4" />
            我的申請紀錄
          </Button>
        </Link>
      </AdminPageHeader>

      {/* Category Filter */}
      <div className="space-y-4">
        {/* Mobile Dropdown */}
        <div className="block md:hidden">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full bg-white dark:bg-[#201e26] border-slate-200 dark:border-white/10 h-10 text-sm">
              <SelectValue placeholder="選擇分類..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "All" ? "全部分類" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Desktop / Tablet Buttons */}
        <div className="hidden md:flex space-x-1.5 rounded-xl bg-slate-100 dark:bg-[#1a1820] border border-slate-200/80 dark:border-white/10 p-1 overflow-x-auto max-w-full w-fit">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? "bg-white dark:bg-[#201e26] text-slate-900 dark:text-[#ffc000] shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat === "All" ? "全部分類" : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-12 text-center text-muted-foreground text-sm">
          載入器材目錄中...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCatalog.map((item) => {
            const isConsumable = item.category === "耗材";
            return (
              <Card
                key={item.code}
                className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm hover:border-[#ffc000] dark:hover:border-[#ffc000] transition-all cursor-pointer overflow-hidden p-0 gap-0 flex flex-col justify-between group"
                onClick={() => {
                  setSelectedItem(item);
                  setIsModalOpen(true);
                }}
              >
                <CardHeader className="p-0">
                  <div className="aspect-video w-full bg-slate-100 dark:bg-white/5 relative overflow-hidden">
                    {item.image ? (
                      <img
                        src={getGoogleDriveImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/600x400?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                        無預覽圖
                      </div>
                    )}
                    <Badge
                      className={`absolute top-2 right-2 text-xs font-semibold ${
                        item.available > 0 ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                      }`}
                    >
                      {item.available > 0
                        ? `剩餘: ${item.available}`
                        : "已借完"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow p-4 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {item.code}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-[#ffc000] transition-colors">
                    {item.name}
                  </CardTitle>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    className={`w-full text-xs sm:text-sm h-9 ${
                      isConsumable || item.available > 0
                        ? "bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold"
                        : "bg-slate-100 dark:bg-white/10 text-slate-400 cursor-not-allowed"
                    }`}
                    disabled={!isConsumable && item.available <= 0}
                  >
                    {isConsumable ? "可直接取用" : "檢視詳情"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <EquipmentDetailModal
        data={
          selectedItem
            ? { info: selectedItem, items: selectedItem.items || [] }
            : null
        }
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
