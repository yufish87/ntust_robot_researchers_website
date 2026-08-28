"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Flame,
  Clock,
  UserCheck,
  Search,
  RefreshCw,
  Loader2,
  LayoutGrid,
  Package,
  Layers,
  Inbox,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KuaikuaiInteractiveBag } from "@/components/wishlist/kuaikuai-interactive-bag";
import { WishlistItemCard } from "@/components/wishlist/wishlist-item-card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  WISHLIST_CATEGORIES,
  type WishlistFeedData,
  type WishlistItem,
} from "@/lib/types/wishlist";

type SortTab = "hot" | "latest" | "mine";
type ViewMode = "clean" | "bag";

export default function WishlistPage() {
  const [activeTab, setActiveTab] = useState<SortTab>("hot");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("clean");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /* ---------- 讀取許願池資料 ---------- */
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<WishlistFeedData>({
    queryKey: ["wishlist-feed"],
    queryFn: async () => {
      const res = await fetch("/api/wishlist/list");
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as WishlistFeedData;
      }
      return { items: [], canSubmitToday: true };
    },
    staleTime: 1000 * 30, // 30 秒快取
  });

  const rawItems = data?.items || [];
  const canSubmitToday = data?.canSubmitToday ?? true;

  /* ---------- 重新整理處理 ---------- */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({ title: "許願池看板已更新" });
    } catch {
      toast({ title: "更新失敗", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  /* ---------- 搜尋與排序過濾 ---------- */
  const filteredItems = useMemo(() => {
    let result = [...rawItems];

    // 分類篩選（比對前綴與關鍵字）
    if (selectedCategoryId !== "all") {
      const targetCat = WISHLIST_CATEGORIES.find((c) => c.id === selectedCategoryId);
      if (targetCat) {
        result = result.filter(
          (item) =>
            item.content.includes(targetCat.prefix) ||
            item.content.includes(targetCat.keyword),
        );
      }
    }

    // 關鍵字搜尋
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.content.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query),
      );
    }

    // 分頁/排序條件
    if (activeTab === "mine") {
      result = result.filter((item) => item.isOwn);
    } else if (activeTab === "hot") {
      result.sort(
        (a, b) =>
          b.upvotes - a.upvotes ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (activeTab === "latest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return result;
  }, [rawItems, activeTab, selectedCategoryId, searchQuery]);

  // 總集氣數統計
  const totalUpvotes = useMemo(() => {
    return rawItems.reduce((acc, curr) => acc + (curr.upvotes || 0), 0);
  }, [rawItems]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* 頁面頂部標題 */}
      <AdminPageHeader
        title="社團許願池"
        description="提出器材採購與社課主題建議，獲得最多集氣的願望將優先排入幹部會議評估。"
      >
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing || isFetching}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 active:scale-[0.98]"
        >
          <RefreshCw
            className={cn(
              "mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4",
              (isRefreshing || isFetching) && "animate-spin",
            )}
          />
          重新整理
        </Button>
      </AdminPageHeader>

      {/* 1. 電子乖乖擬真打字投遞區 */}
      <KuaikuaiInteractiveBag
        canSubmitToday={canSubmitToday}
        todayWish={data?.todayWish}
        onWishSubmitted={() => {
          queryClient.invalidateQueries({ queryKey: ["wishlist-feed"] });
        }}
      />

      {/* 2. 全社願望看板區 */}
      <div className="space-y-5">
        {/* 看板標題與指標 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 dark:bg-[#ffc000]/10 dark:border-[#ffc000]/20 dark:text-[#ffc000]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                全社願望看板
                <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 dark:bg-white/5 dark:text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/10">
                  {rawItems.length}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400 font-sans">總集氣數：</span>
              <span className="font-extrabold text-amber-600 dark:text-[#ffc000] text-sm tabular-nums">
                {totalUpvotes}
              </span>
              <span className="text-slate-400 font-sans">次</span>
            </div>

            {/* 視圖切換按鈕 (簡約清單 vs 擬真包裝) */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setViewMode("clean")}
                title="簡約清單卡片"
                aria-label="簡約清單卡片"
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "clean"
                    ? "bg-white text-slate-900 dark:bg-white/20 dark:text-white shadow-xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("bag")}
                title="擬真乖乖包裝"
                aria-label="擬真乖乖包裝"
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "bag"
                    ? "bg-white text-slate-900 dark:bg-white/20 dark:text-white shadow-xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                )}
              >
                <Package className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 篩選與搜尋列 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 排序 Tab */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("hot")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                activeTab === "hot"
                  ? "bg-[#ffc000] text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5",
              )}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>最多集氣</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("latest")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                activeTab === "latest"
                  ? "bg-[#ffc000] text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5",
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>最新許願</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("mine")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                activeTab === "mine"
                  ? "bg-[#ffc000] text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5",
              )}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>我的願望</span>
            </button>
          </div>

          {/* 分類快速篩選與搜尋 */}
          <div className="flex items-center gap-2 flex-1 md:justify-end">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
              {[
                { id: "all", label: "全部" },
                ...WISHLIST_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border text-xs whitespace-nowrap font-medium",
                    selectedCategoryId === c.id
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white/20 dark:text-white dark:border-white/30 font-bold shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50 dark:bg-transparent dark:text-slate-400 dark:border-transparent dark:hover:text-white dark:hover:bg-white/5",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋願望內容..."
                className="pl-9 h-9 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus-visible:ring-1 focus-visible:ring-amber-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* 3. 願望卡片網格 */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin text-amber-600 dark:text-[#ffc000]" />
            <p className="text-sm font-medium">正在載入願望看板...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 text-center flex flex-col items-center justify-center p-8 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-200">
              {searchQuery
                ? "找不到符合搜尋條件的願望"
                : activeTab === "mine"
                  ? "您尚未投遞過願望"
                  : "目前尚無願望紀錄"}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchQuery
                ? "請嘗試更換搜尋關鍵字或分類標籤。"
                : "快到上方電子乖乖袋寫下您對社團的期許吧！"}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-5",
              viewMode === "clean"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {filteredItems.map((item) => (
              <WishlistItemCard
                key={item.id}
                item={item}
                viewMode={viewMode}
                onUpvoteChange={(wishId, newUpvotes, hasUpvoted) => {
                  queryClient.setQueryData<WishlistFeedData>(["wishlist-feed"], (old) => {
                    if (!old) return old;
                    return {
                      ...old,
                      items: old.items.map((it) =>
                        it.id === wishId
                          ? { ...it, upvotes: newUpvotes, hasUpvoted }
                          : it,
                      ),
                    };
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
