"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Send, CheckCircle2, Lock, Tag, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { WISHLIST_CATEGORIES, type WishlistItem } from "@/lib/types/wishlist";

interface KuaikuaiInteractiveBagProps {
  canSubmitToday: boolean;
  todayWish?: WishlistItem | null;
  onWishSubmitted: () => void;
  className?: string;
}

export function renderBagContent(rawContent: string, showEnding: boolean = false) {
  if (!rawContent) return null;
  const trimmed = rawContent.trim();
  let tag = "";
  let body = trimmed;

  if (trimmed.startsWith("【")) {
    const closeIndex = trimmed.indexOf("】");
    if (closeIndex !== -1) {
      tag = trimmed.slice(0, closeIndex + 1);
      body = trimmed.slice(closeIndex + 1).trim();
    }
  }

  if (body.startsWith("希望")) {
    body = body.slice(2).trim();
  }

  return (
    <>
      {tag && <span>{tag} </span>}
      <span className="text-slate-950 font-black">希望</span>
      {body && <span> {body}</span>}
      {showEnding && (
        <span className="text-red-600 font-black tracking-wider"> 乖乖</span>
      )}
    </>
  );
}

export const formatBagContent = (rawContent: string) => renderBagContent(rawContent, false);

export function KuaikuaiInteractiveBag({
  canSubmitToday,
  todayWish,
  onWishSubmitted,
  className,
}: KuaikuaiInteractiveBagProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const maxChars = 90;
  const currentLength = content.length;

  // 決定乖乖袋上顯示的文字（優先顯示正在打字的內容；若今日已送出則持續顯示今日的願望）
  const activeBagContent = content.trim()
    ? content
    : !canSubmitToday && todayWish
      ? todayWish.content
      : "";

  const handleTagClick = (prefix: string) => {
    if (!canSubmitToday) return;
    if (content.startsWith("【")) {
      // 替換既有分類前綴
      const cleanContent = content.replace(/^【[^】]+】\s*/, "");
      setContent(`${prefix} ${cleanContent}`);
    } else if (content.trim()) {
      setContent(`${prefix} ${content}`);
    } else {
      setContent(`${prefix} `);
    }
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      toast({
        title: "請輸入願望內容",
        description: "請寫下你對社團器材、課程或環境的期許。",
        variant: "destructive",
      });
      textareaRef.current?.focus();
      return;
    }

    if (trimmed.length < 5) {
      toast({
        title: "內容長度不足",
        description: `願望內容至少需要 5 個字（目前 ${trimmed.length} 字）。`,
        variant: "destructive",
      });
      return;
    }

    if (trimmed.length > maxChars) {
      toast({
        title: "超出字數上限",
        description: `願望內容已超出乖乖包裝上限（最多 ${maxChars} 字，目前已達 ${trimmed.length} 字），請刪減後再投遞。`,
        variant: "destructive",
      });
      textareaRef.current?.focus();
      return;
    }

    if (!canSubmitToday) {
      toast({
        title: "今日已完成許願",
        description: "每位成員每天限許願 1 次，明日即可再次投遞！",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/wishlist/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "願望已送出",
          description: "已成功投遞至電子乖乖許願池，大家可開始為你集氣！",
        });
        setContent("");
        onWishSubmitted();
      } else {
        toast({
          title: "投遞失敗",
          description: data.message || "伺服器處理失敗，請稍後再試。",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "連線異常",
        description: "無法連線至伺服器，請檢查網路狀態。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl bg-[#1a1822] border border-white/10 p-5 sm:p-7 shadow-xl",
        className,
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
        {/* 左側：電子乖乖擬真包裝袋（即時手寫預覽） */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="@container [container-type:inline-size] relative w-full max-w-[340px] sm:max-w-[380px] aspect-square select-none drop-shadow-2xl">
            {/* 乖乖包裝袋底圖（已去背透明 PNG v2） */}
            <Image
              src="/image/kuaikuai_wish_v2.png"
              alt="機器人研究社電子乖乖包裝"
              fill
              priority
              className="object-contain pointer-events-none drop-shadow-xl"
              sizes="(max-width: 640px) 90vw, 380px"
            />

            {/* 白色手寫橫線區即時文字印刻 */}
            <div
              onClick={() => {
                if (canSubmitToday) textareaRef.current?.focus();
              }}
              className={cn(
                "absolute rounded cursor-text",
                canSubmitToday ? "hover:bg-amber-500/[0.03]" : "cursor-default",
              )}
              style={{
                top: "66.0%",
                left: "14.6%",
                width: "71.2%",
                height: "19.5%",
              }}
            >
              {activeBagContent ? (
                <p
                  className="text-slate-950 font-black tracking-normal break-all select-none font-sans line-clamp-3"
                  style={{
                    fontSize: "clamp(10px, 3.25cqw, 13.5px)",
                    lineHeight: "6.28cqw",
                  }}
                >
                  {renderBagContent(activeBagContent, !canSubmitToday)}
                </p>
              ) : (
                <p
                  className="select-none font-sans break-all line-clamp-3"
                  style={{
                    fontSize: "clamp(10px, 3.25cqw, 13.5px)",
                    lineHeight: "6.28cqw",
                  }}
                >
                  <span className="text-slate-950 font-black">希望 </span>
                  <span className="text-slate-400 font-medium italic">
                    {canSubmitToday ? "點此或右側欄位寫下願望..." : "今日願望已投遞完成"}
                  </span>
                </p>
              )}
            </div>

            {/* 今日已許願印章 */}
            {!canSubmitToday && (
              <div className="absolute top-[60%] right-[10%] -rotate-12 px-3 py-1 bg-rose-600/90 text-white font-black text-xs rounded border border-white/80 shadow-lg tracking-widest pointer-events-none">
                今日已投遞
              </div>
            )}
          </div>
        </div>

        {/* 右側：表單操作與快捷標籤 */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                填寫社團願望
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px] font-mono",
                  canSubmitToday
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700",
                )}
              >
                {canSubmitToday ? "今日可許願 (1/1)" : "今日已額滿"}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              向幹部提出器材採購、社課主題或環境改善建議，文字將即時印刻於左側電子乖乖袋上。
            </p>
          </div>

          {canSubmitToday ? (
            <>
              {/* 快捷分類前綴 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#ffc000]" />
                  <span>快速套用分類標籤</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {WISHLIST_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleTagClick(cat.prefix)}
                      disabled={!canSubmitToday}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border cursor-pointer",
                        content.startsWith(cat.prefix)
                          ? "bg-[#ffc000] text-slate-950 border-[#ffc000] font-bold"
                          : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white",
                        !canSubmitToday && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 文字輸入框 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="wish-input" className="text-slate-300 font-medium">
                    願望內容
                  </label>
                  <span
                    className={cn(
                      "font-mono text-[11px] tabular-nums",
                      currentLength > maxChars ? "text-rose-400 font-bold" : "text-slate-400",
                    )}
                  >
                    {currentLength} / {maxChars} 字
                    {currentLength > maxChars && `（超出 ${currentLength - maxChars} 字）`}
                  </span>
                </div>
                <Textarea
                  id="wish-input"
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="請輸入願望（例如：希望社辦採購示波器）"
                  rows={3}
                  className={cn(
                    "bg-black/30 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl resize-none",
                    currentLength > maxChars
                      ? "border-rose-500/60 focus-visible:ring-rose-500 text-rose-100"
                      : "border-white/15 focus-visible:ring-[#ffc000]",
                  )}
                />
              </div>

              {/* 操作按鈕列 */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || currentLength < 5 || currentLength > maxChars}
                  className={cn(
                    "w-full sm:w-auto flex-1 bg-[#ffc000] hover:bg-yellow-400 text-slate-950 font-bold h-10 px-5 rounded-xl shadow-md transition-all cursor-pointer gap-2 active:scale-[0.98]",
                    (currentLength < 5 || currentLength > maxChars) && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {isSubmitting ? (
                    <span>正在投遞願望...</span>
                  ) : (
                    <>
                      <span>投遞電子乖乖願望</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </Button>
                {content && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setContent("")}
                    disabled={isSubmitting}
                    className="text-xs text-slate-400 hover:text-white h-9 px-3 gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>清空</span>
                  </Button>
                )}
              </div>
            </>
          ) : (
            /* 今日已完成許願：展示今日已提交願望資訊卡片 */
            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-300 flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    您今日已成功許願
                  </span>
                  {todayWish?.createdAt && (
                    <span className="font-mono text-slate-400 text-[11px]">
                      {todayWish.createdAt.slice(0, 16)}
                    </span>
                  )}
                </div>

                {todayWish ? (
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
                    <span className="text-[11px] text-slate-400 font-mono">{todayWish.id}</span>
                    <p className="text-sm font-semibold text-slate-100 leading-relaxed break-all">
                      {todayWish.content}
                    </p>
                  </div>
                ) : null}

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#ffc000]" />
                    目前累積集氣：<strong className="text-[#ffc000] font-mono text-sm">{todayWish?.upvotes || 0}</strong> 次
                  </span>
                  <span className="text-[11px] text-slate-500">每日限填 1 次，明日可再次許願</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5 text-xs text-slate-400">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>感謝您的期許！願望已經寫在電子乖乖袋上，幹部會議將定期審閱熱門願望。</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
