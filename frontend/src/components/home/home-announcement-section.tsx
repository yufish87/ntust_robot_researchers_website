"use client";

import { useEffect, useState } from "react";
import {
  Megaphone,
  ExternalLink,
  Calendar,
  Paperclip,
  Pin,
  Image as ImageIcon,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Lock,
} from "lucide-react";
import { cn, isGoogleDriveOrCdnUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ANNOUNCEMENT_CATEGORIES,
  type Announcement,
} from "@/lib/types/announcement";
import Image from "next/image";
import Link from "next/link";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuthStore } from "@/store/useAuthStore";

const categoryColor: Record<string, string> = {
  一般公告: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  課程資訊: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  活動與競賽: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  榮譽榜: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  設備與系統: "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

interface AnnouncementSectionProps {
  className?: string;
}

const imageAttachmentPattern =
  /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic|heif)(?:$|[?#])/i;

function isImageAttachment(att: {
  title?: string;
  link?: string;
  fileId?: string;
}) {
  const title = att.title || "";
  const link = att.link || "";

  if (imageAttachmentPattern.test(title) || imageAttachmentPattern.test(link)) {
    return true;
  }

  if (att.fileId || isGoogleDriveOrCdnUrl(link)) {
    const nonImagePattern = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|7z|txt|csv|json)$/i;
    if (!nonImagePattern.test(title)) {
      return true;
    }
  }

  return Boolean(att.fileId && !att.link);
}

function getAttachmentImageSrc(att: { link?: string; fileId?: string }) {
  if (att.fileId) {
    return `https://lh3.googleusercontent.com/d/${att.fileId}=w1200`;
  }
  return att.link || "";
}

function getAttachmentLink(att: { link?: string; fileId?: string }) {
  if (att.link) return att.link;
  if (att.fileId) {
    return `https://drive.google.com/file/d/${att.fileId}/view?usp=sharing`;
  }
  return "#";
}

export function AnnouncementSection({ className }: AnnouncementSectionProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const { user } = useAuthStore();

  const MAX_HOMEPAGE_ANNOUNCEMENTS = 6;

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setLoading(true);
        const res = await fetch("/api/announcements");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAnnouncements(data.data);
        }
      } catch (err) {
        console.error("Failed to load announcements:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = announcements
    .filter((item) => {
      if (item.status && item.status !== "顯示中") return false;
      if (activeCategory === "all") return true;
      return item.category === activeCategory;
    })
    .sort((a, b) => {
      const timeA = a.publishTime
        ? new Date(a.publishTime.replace(" ", "T")).getTime()
        : 0;
      const timeB = b.publishTime
        ? new Date(b.publishTime.replace(" ", "T")).getTime()
        : 0;
      return timeB - timeA;
    });

  const displayedAnnouncements = filteredAnnouncements.slice(
    0,
    MAX_HOMEPAGE_ANNOUNCEMENTS,
  );
  const hasMore = filteredAnnouncements.length > MAX_HOMEPAGE_ANNOUNCEMENTS;
  const remainingCount =
    filteredAnnouncements.length - MAX_HOMEPAGE_ANNOUNCEMENTS;

  const categories = ["all", ...ANNOUNCEMENT_CATEGORIES];

  return (
    <section id="news" className={cn("w-full scroll-mt-24", className)}>
      {/* 標題與分類過濾器 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#ffc000] text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4" />
            <span>COMMUNITY BULLETIN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            最新消息與重要公告
          </h2>
        </div>

        {/* 分類按鈕列 (Responsive Scrollable Filter Pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border",
                activeCategory === cat
                  ? "bg-[#ffc000] text-[#1e1c24] border-[#ffc000] font-bold shadow-xs"
                  : "bg-white/[0.03] text-slate-300 border-white/10 hover:border-white/20 hover:text-white",
              )}
            >
              {cat === "all" ? "全部公告" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 公告列表網格 (Hub Cards Grid) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-xl bg-white/[0.02] border border-white/10 animate-pulse p-5 space-y-3"
            >
              <div className="h-4 bg-white/10 rounded-sm w-1/3" />
              <div className="h-6 bg-white/10 rounded-sm w-3/4" />
              <div className="h-12 bg-white/5 rounded-sm w-full" />
            </div>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-slate-400">
          <Megaphone className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
          <p className="text-sm">目前尚無相關公告訊息</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayedAnnouncements.map((item) => {
            const hasAttachments = item.attachments && item.attachments.length > 0;
            const imageAtt = item.attachments?.find((att) =>
              isImageAttachment(att),
            );

            return (
              <div
                key={item.id}
                onClick={() => setSelectedAnnouncement(item)}
                className="group relative p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#ffc000]/30 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedAnnouncement(item);
                  }
                }}
              >
                {/* 卡片頂部：分類與日期 */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-2 py-0.5 font-medium border",
                        categoryColor[item.category] ||
                          "bg-white/10 text-slate-300 border-white/10",
                      )}
                    >
                      {item.category}
                    </Badge>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{(item.publishTime || "").split(" ")[0]}</span>
                    </div>
                  </div>

                  {/* 標題 */}
                  <h3 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-[#ffc000] transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {/* 內文摘要 */}
                  <p className="text-xs sm:text-sm text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {item.content}
                  </p>
                </div>

                {/* 卡片底部：附件狀態與點擊提示 */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    {hasAttachments && (
                      <span className="inline-flex items-center gap-1 text-slate-300 text-[11px]">
                        <Paperclip className="w-3 h-3 text-[#ffc000]" />
                        {item.attachments.length} 個附件
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#ffc000] font-medium group-hover:underline flex items-center gap-1">
                    閱讀完整公告
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部歷史公告引導區 */}
      <div className="mt-8 p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <Lock className="w-4 h-4 text-[#ffc000] shrink-0" />
          <span>
            {hasMore
              ? `首頁僅展示最新 ${MAX_HOMEPAGE_ANNOUNCEMENTS} 則公告，尚有 ${remainingCount} 則歷史公告可至公告專區查閱。`
              : "完整社團公告與歷史發布紀錄，請至會員公告專區查閱。"}
          </span>
        </div>

        {user ? (
          <Link href="/dashboard/announcements" className="shrink-0 w-full sm:w-auto">
            <Button
              size="sm"
              className="w-full sm:w-auto bg-white/10 hover:bg-[#ffc000] hover:text-[#1e1c24] text-white text-xs font-bold gap-1.5 h-9 px-4 cursor-pointer transition-colors"
            >
              前往完整公告專區
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        ) : (
          <LoginModal>
            <Button
              size="sm"
              className="w-full sm:w-auto bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] text-xs font-bold gap-1.5 h-9 px-4 cursor-pointer"
            >
              登入後查看更多公告
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </LoginModal>
        )}
      </div>

      {/* 公告詳情彈窗 (與資源管理系統 Modal 排版一致) */}
      <Dialog
        open={Boolean(selectedAnnouncement)}
        onOpenChange={(open) => !open && setSelectedAnnouncement(null)}
      >
        <DialogContent
          aria-describedby={undefined}
          className="max-w-2xl max-h-[85vh] bg-[#1e1c24] border-white/10 text-white p-6"
        >
          {selectedAnnouncement && (
            <>
              <DialogHeader className="pr-8">
                <DialogTitle className="text-xl font-bold text-white text-left leading-snug pr-6">
                  {selectedAnnouncement.title}
                </DialogTitle>
                <div className="flex items-center gap-2 pt-1">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs px-2 py-0.5",
                      categoryColor[selectedAnnouncement.category] ||
                        "bg-white/10 text-slate-300",
                    )}
                  >
                    {selectedAnnouncement.category}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedAnnouncement.publishTime || ""}
                  </span>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[55vh] pr-4 scrollbar-dark">
                <div className="space-y-4">
                  {/* 內容 */}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                    {selectedAnnouncement.content}
                  </div>

                  {/* 附件 */}
                  {selectedAnnouncement.attachments &&
                    selectedAnnouncement.attachments.length > 0 && (
                      <div className="pt-4 border-t border-white/10 space-y-3">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-white">
                          <Paperclip className="h-4 w-4 text-[#ffc000]" />
                          附件 ({selectedAnnouncement.attachments.length})
                        </h4>

                        {/* 圖片附件：直接顯示 */}
                        {selectedAnnouncement.attachments
                          .filter((att) => isImageAttachment(att))
                          .map((att, i) => {
                            const imgSrc = getAttachmentImageSrc(att);
                            if (!imgSrc) return null;

                            return (
                              <div
                                key={`img-${i}`}
                                className="rounded-lg overflow-hidden border border-white/10 bg-black/40"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imgSrc}
                                  alt={att.title || "附件圖片"}
                                  className="w-full h-auto object-cover max-h-[420px]"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (att.fileId && !target.dataset.fallback) {
                                      target.dataset.fallback = "1";
                                      target.src = `https://drive.google.com/thumbnail?id=${att.fileId}&sz=w1200`;
                                    }
                                  }}
                                />
                                {att.title && (
                                  <p className="p-3 text-xs text-slate-400 border-t border-white/5">
                                    {att.title}
                                  </p>
                                )}
                              </div>
                            );
                          })}

                        {/* 非圖片附件 */}
                        <div className="space-y-1.5">
                          {selectedAnnouncement.attachments
                            .filter((att) => !isImageAttachment(att))
                            .map((att, i) => {
                              const link = getAttachmentLink(att);
                              if (!link) return null;

                              return (
                                <a
                                  key={`file-${i}`}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-[#ffc000] hover:underline"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                  {att.title || link}
                                </a>
                              );
                            })}
                        </div>
                      </div>
                    )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
