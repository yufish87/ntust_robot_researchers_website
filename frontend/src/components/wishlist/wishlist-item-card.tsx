"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, Clock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/lib/types/wishlist";
import { renderBagContent } from "./kuaikuai-interactive-bag";

interface WishlistItemCardProps {
  item: WishlistItem;
  viewMode?: "clean" | "bag";
  onUpvoteChange?: (wishId: string, newUpvotes: number, hasUpvoted: boolean) => void;
  className?: string;
}

export function WishlistItemCard({
  item,
  viewMode = "clean",
  onUpvoteChange,
  className,
}: WishlistItemCardProps) {
  const [upvotes, setUpvotes] = useState(item.upvotes);
  const [hasUpvoted, setHasUpvoted] = useState(item.hasUpvoted);
  const [isLiking, setIsLiking] = useState(false);
  const { toast } = useToast();

  // 解析分類標籤 (例如 【硬體採購】 或 【社課主題】)
  const categoryMatch = item.content.match(/^【([^】]+)】/);
  const categoryName = categoryMatch ? categoryMatch[1] : "社團許願";
  const displayContent = categoryMatch
    ? item.content.replace(/^【[^】]+】\s*/, "")
    : item.content;

  const handleToggleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;

    const previousUpvotes = upvotes;
    const previousHasUpvoted = hasUpvoted;

    // 樂觀更新 (Optimistic UI Update)
    const nextHasUpvoted = !hasUpvoted;
    const nextUpvotes = nextHasUpvoted ? upvotes + 1 : Math.max(0, upvotes - 1);

    setHasUpvoted(nextHasUpvoted);
    setUpvotes(nextUpvotes);
    onUpvoteChange?.(item.id, nextUpvotes, nextHasUpvoted);

    try {
      setIsLiking(true);
      const res = await fetch("/api/wishlist/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishId: item.id }),
      });

      const data = await res.json();
      if (!data.success) {
        // 回滾
        setHasUpvoted(previousHasUpvoted);
        setUpvotes(previousUpvotes);
        onUpvoteChange?.(item.id, previousUpvotes, previousHasUpvoted);
        toast({
          title: "集氣失敗",
          description: data.message || "請先登入後再進行集氣",
          variant: "destructive",
        });
      }
    } catch {
      // 異常回滾
      setHasUpvoted(previousHasUpvoted);
      setUpvotes(previousUpvotes);
      onUpvoteChange?.(item.id, previousUpvotes, previousHasUpvoted);
    } finally {
      setIsLiking(false);
    }
  };

  /* ---------- 1. 簡約清單卡片模式 (Clean Cards View) ---------- */
  if (viewMode === "clean") {
    return (
      <div
        className={cn(
          "group relative rounded-2xl bg-white dark:bg-[#1a1822] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md",
          hasUpvoted && "border-amber-400/60 bg-amber-500/[0.02] dark:bg-[#1e1c28]",
          className,
        )}
      >
        <div className="space-y-3">
          {/* 頂部標籤與狀態 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px] font-bold px-2.5 py-0.5 rounded-lg",
                  categoryName.includes("硬體")
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30"
                    : categoryName.includes("社課")
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
                      : categoryName.includes("環境") || categoryName.includes("社辦")
                        ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30"
                        : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30",
                )}
              >
                {categoryName}
              </Badge>

              {item.isOwn && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold bg-amber-100 text-amber-900 border-amber-300 dark:bg-[#ffc000]/10 dark:text-[#ffc000] dark:border-[#ffc000]/30 px-2 py-0.5 flex items-center gap-1 rounded-lg"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>我的願望</span>
                </Badge>
              )}
            </div>

            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{(item.createdAt || "").slice(0, 16)}</span>
            </div>
          </div>

          {/* 願望主要文字 */}
          <p className="text-slate-900 dark:text-slate-100 font-medium text-sm sm:text-base leading-relaxed break-words">
            {displayContent}
          </p>
        </div>

        {/* 底部集氣互動列 */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            {item.id}
          </span>

          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleUpvote}
            disabled={isLiking}
            className={cn(
              "h-8 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer gap-1.5 active:scale-[0.98]",
              hasUpvoted
                ? "bg-[#ffc000] text-slate-950 border-[#ffc000] hover:bg-yellow-400 hover:text-slate-950 shadow-2xs font-extrabold"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-100 hover:border-slate-300 dark:bg-white/5 dark:border-white/15 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10",
            )}
          >
            <Sparkles
              className={cn(
                "w-3.5 h-3.5",
                hasUpvoted ? "fill-slate-950 text-slate-950" : "text-amber-500 dark:text-[#ffc000]",
              )}
            />
            <span>{hasUpvoted ? "已集氣" : "集氣"}</span>
            <span className="font-mono text-xs tabular-nums font-black ml-0.5">
              {upvotes}
            </span>
          </Button>
        </div>
      </div>
    );
  }

  /* ---------- 2. 擬真乖乖包裝卡片模式 (Kuai Kuai Bags View) ---------- */
  return (
    <div
      className={cn(
        "group relative rounded-2xl overflow-hidden bg-white dark:bg-[#1a1822] border border-slate-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-[#ffc000]/50 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md",
        className,
      )}
    >
      <div className="@container [container-type:inline-size] relative aspect-square w-full select-none overflow-hidden flex items-center justify-center">
        <Image
          src="/image/kuaikuai_wish_v2.png"
          alt="電子乖乖願望卡"
          fill
          className="object-contain pointer-events-none drop-shadow-md"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
          loading="lazy"
        />

        {/* 手寫字跡印刻區 - 精確居中於虛線正中間 */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "66.0%",
            left: "14.6%",
            width: "71.2%",
            height: "19.5%",
          }}
        >
          <p
            className="text-slate-950 font-black tracking-normal break-all font-sans select-none line-clamp-3"
            style={{
              fontSize: "clamp(10px, 3.25cqw, 13.5px)",
              lineHeight: "6.28cqw",
            }}
          >
            {renderBagContent(item.content, true)}
          </p>
        </div>

        {item.isOwn && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px] shadow flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            <span>我的許願</span>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-50 dark:bg-[#131217] border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{(item.createdAt || "").slice(0, 16)}</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleToggleUpvote}
          disabled={isLiking}
          className={cn(
            "h-8 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer gap-1.5 active:scale-[0.98]",
            hasUpvoted
              ? "bg-[#ffc000] text-slate-950 border-[#ffc000] hover:bg-yellow-400 hover:text-slate-950 font-extrabold"
              : "bg-white border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:bg-white/5 dark:border-white/15 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10",
          )}
        >
          <Sparkles
            className={cn(
              "w-3.5 h-3.5",
              hasUpvoted ? "fill-slate-950 text-slate-950" : "text-amber-500 dark:text-[#ffc000]",
            )}
          />
          <span>{hasUpvoted ? "已集氣" : "集氣"}</span>
          <span className="font-mono text-xs tabular-nums font-black ml-0.5">
            {upvotes}
          </span>
        </Button>
      </div>
    </div>
  );
}
