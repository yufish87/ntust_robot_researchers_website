"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Info,
  Trophy,
  Cpu,
  Layers,
  Sparkles,
  Maximize2,
  Hammer,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  Paperclip,
} from "lucide-react";
import { cn, isGoogleDriveOrCdnUrl, getGoogleDriveIdFromUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Announcement, AnnouncementAttachment } from "@/lib/types/announcement";

interface HonorItem {
  id: string;
  competition: string; // 比賽名稱
  award: string;       // 獎項
  fullTitle: string;   // 原始公告標題
  content: string;     // 公告內文說明
  imgSrc: string;      // 榮譽相片網址
  publishTime: string; // 發佈日期
  attachments?: AnnouncementAttachment[];
}

interface AboutSectionProps {
  className?: string;
}

const imageAttachmentPattern =
  /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic|heif)(?:$|[?#])/i;

function isImageAttachment(att: { title?: string; link?: string; fileId?: string }) {
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
  const link = att.link || "";
  const driveId = getGoogleDriveIdFromUrl(link);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}=w1200`;
  }
  return link;
}

function getAttachmentLink(att: { link?: string; fileId?: string }) {
  if (att.link) return att.link;
  if (att.fileId) return `https://drive.google.com/file/d/${att.fileId}/view`;
  return "#";
}

/**
 * 依據 "榮獲" 後的空格與文字切分比賽名稱與獎項
 * 例如：【榮譽榜】本社團成員榮獲 2025技職盃黑客松全國賽 評審團大獎 !
 * -> competition: "2025技職盃黑客松全國賽", award: "評審團大獎"
 */
function parseHonorTitle(rawTitle: string) {
  const trimmed = rawTitle.trim();

  // 1. 查找 "榮獲" 關鍵字
  const rongHuoIdx = trimmed.indexOf("榮獲");
  if (rongHuoIdx !== -1) {
    // 截取 "榮獲" 之後的字串
    const after = trimmed.substring(rongHuoIdx + 2).trim();
    // 移除結尾的感嘆號與標點符號
    const cleaned = after.replace(/[\s!！~.]+$/, "").trim();
    const parts = cleaned.split(/\s+/);
    if (parts.length >= 2) {
      // 最後一個詞為獎項，其餘為比賽名稱
      const award = parts[parts.length - 1].trim();
      const competition = parts.slice(0, parts.length - 1).join(" ").trim();
      return {
        competition: competition || cleaned,
        award,
        fullTitle: rawTitle,
      };
    } else if (parts.length === 1 && parts[0]) {
      return {
        competition: parts[0],
        award: "榮獲佳績",
        fullTitle: rawTitle,
      };
    }
  }

  // 2. 備用格式: "比賽名稱 - 獎項"
  if (trimmed.includes(" - ")) {
    const parts = trimmed.split(" - ");
    return {
      competition: parts[0].trim(),
      award: parts.slice(1).join(" - ").trim(),
      fullTitle: rawTitle,
    };
  }

  return {
    competition: rawTitle,
    award: "榮譽獲獎",
    fullTitle: rawTitle,
  };
}

export function AboutSection({ className }: AboutSectionProps) {
  const [selectedAward, setSelectedAward] = useState<HonorItem | null>(null);
  const [awards, setAwards] = useState<HonorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // 1. 純抓取後台公告「榮譽榜」資料（不使用本地照片）
  useEffect(() => {
    async function fetchHonorAnnouncements() {
      try {
        setLoading(true);
        const res = await fetch("/api/announcements");
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          const honorAnnouncements = json.data.filter(
            (item: Announcement) =>
              item.category === "榮譽榜" && (!item.status || item.status === "顯示中"),
          );

          const honorItems: HonorItem[] = honorAnnouncements
            .map((item: Announcement) => {
              const imgAtt = item.attachments?.find((att) => isImageAttachment(att));
              const imgSrc = imgAtt
                ? getAttachmentImageSrc(imgAtt)
                : item.attachments?.[0]?.fileId
                  ? `https://lh3.googleusercontent.com/d/${item.attachments[0].fileId}=w1200`
                  : "";

              const { competition, award, fullTitle } = parseHonorTitle(item.title);

              return {
                id: item.id,
                competition,
                award,
                fullTitle,
                content: item.content || "",
                imgSrc,
                publishTime: (item.publishTime || "").split(" ")[0],
                attachments: item.attachments || [],
              };
            })
            .filter((item: HonorItem) => item.imgSrc); // 僅保留有附圖的項目

          // 最多展示 4 張照片
          setAwards(honorItems.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load honor announcements:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHonorAnnouncements();
  }, []);

  // 2. 跑馬燈 / 輪播自動播放邏輯 (4.5秒切換)
  useEffect(() => {
    if (awards.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % awards.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [awards.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? awards.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % awards.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  const pillars = [
    {
      title: "軟硬體實作培訓",
      icon: Cpu,
      desc: "每週安排微控制器、電路設計、CAD繪圖與機構組裝等實作課程，從零打好工程底子。",
    },
    {
      title: "全國賽事出征挑戰",
      icon: Trophy,
      desc: "組織社員組成戰隊，征戰全國自走車、機器人競賽、黑客松等各項高強度競賽，提供經費與設備支援。",
    },
    {
      title: "社辦工坊資源共享",
      icon: Hammer,
      desc: "社辦配備 3D 列印機、雷射切割機、焊接工作站與數百種電子模組庫存，隨借隨用。",
    },
  ];

  // 整理 Modal 中需展示之圖片清單（確保主圖 100% 顯示）
  const modalImageList: { src: string; title?: string; fileId?: string }[] = [];
  if (selectedAward) {
    if (selectedAward.imgSrc) {
      modalImageList.push({
        src: selectedAward.imgSrc,
        title: selectedAward.competition || "榮譽照片",
        fileId: selectedAward.attachments?.[0]?.fileId,
      });
    }

    selectedAward.attachments?.forEach((att) => {
      const src = getAttachmentImageSrc(att);
      if (src && isImageAttachment(att) && !modalImageList.some((img) => img.src === src)) {
        modalImageList.push({
          src,
          title: att.title || "附件圖片",
          fileId: att.fileId,
        });
      }
    });
  }

  // 整理非圖片附件清單
  const modalNonImageAttachments = selectedAward?.attachments?.filter(
    (att) => !isImageAttachment(att) && !modalImageList.some((img) => img.fileId === att.fileId),
  ) || [];

  return (
    <div className={cn("w-full space-y-16", className)}>
      {/* ===== 1. 社團簡介與三大核心 (About 臺科大機器人研究社) ===== */}
      <section id="about" className="scroll-mt-24">
        {/* 區塊標題 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-white/10 gap-2">
          <div>
            <div className="flex items-center gap-2 text-[#ffc000] text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              <Info className="w-4 h-4" />
              <span>ABOUT OUR COMMUNITY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              社團簡介與核心願景
            </h2>
          </div>
        </div>

        {/* 簡介主卡片與三大特色 (Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主說明面板 (占 2 欄在桌機) */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffc000]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                動手實作，跨域交流，把天馬行空的靈感變成真實作品。
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                臺科大機器人研究社致力於推廣機器人科技、嵌入式系統與創客實作知識。我們匯聚機械、電機、電子、資工等跨系所的熱血夥伴，透過系統化社課、學長姐經驗傳承與競賽實戰，打造開放、充滿創造力的技術交流聚落。
              </p>
            </div>

            {/* 核心承諾標籤 */}
            <div className="pt-6 mt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-[#ffc000] shrink-0" />
                <span>每週精實實體社課</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-[#ffc000] shrink-0" />
                <span>機具設備免費實作</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-[#ffc000] shrink-0" />
                <span>校內外賽事經費補助</span>
              </div>
            </div>
          </div>

          {/* 創客空間亮點卡片 (占 1 欄) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between relative">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#ffc000]/10 border border-[#ffc000]/20 flex items-center justify-center text-[#ffc000]">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white">社辦工坊硬體環境</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                社辦位於社團大樓2樓，擁有3D列印機、雷射切割機與常用器材庫，提供社員探索硬體技術的絕佳空間。
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[11px] bg-white/5 border-white/10 text-slate-300">
                3D 列印
              </Badge>
              <Badge variant="outline" className="text-[11px] bg-white/5 border-white/10 text-slate-300">
                雷射切割
              </Badge>
              <Badge variant="outline" className="text-[11px] bg-white/5 border-white/10 text-slate-300">
                電子零件庫
              </Badge>
              <Badge variant="outline" className="text-[11px] bg-white/5 border-white/10 text-slate-300">
                氣動元件庫
              </Badge>
            </div>
          </div>
        </div>

        {/* 三大支柱卡片 (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6">
          {pillars.map((p, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-xl bg-white/[0.02] border border-white/10 hover:border-[#ffc000]/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#ffc000]/10 flex items-center justify-center text-[#ffc000] mb-3.5">
                <p.icon className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">{p.title}</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 2. 歷年競賽成果與榮譽榜 (純抓取公告「榮譽榜」，跑馬燈輪播，最多4張相片) ===== */}
      <section id="awards" className="scroll-mt-24">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#ffc000] text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4" />
              <span>HONORS & COMPETITIONS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              歷年競賽成果與榮譽
            </h2>
          </div>

          {/* 跑馬燈控制器 (桌面與平板) */}
          {awards.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="w-9 h-9 rounded-xl border-white/10 bg-white/5 text-white hover:bg-[#ffc000] hover:text-[#1e1c24] hover:border-[#ffc000] transition-colors cursor-pointer"
                aria-label="上一張榮譽照片"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="w-9 h-9 rounded-xl border-white/10 bg-white/5 text-white hover:bg-[#ffc000] hover:text-[#1e1c24] hover:border-[#ffc000] transition-colors cursor-pointer"
                aria-label="下一張榮譽照片"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-64 rounded-2xl bg-white/[0.02] border border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : awards.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-slate-400 text-sm">
            目前尚無公開榮譽榜相片記錄
          </div>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* 1. 桌機版網格展示 (Desktop: 1~4 Card Grid) */}
            <div
              className={cn(
                "hidden lg:grid gap-5",
                awards.length === 1 && "grid-cols-1 max-w-md mx-auto",
                awards.length === 2 && "grid-cols-2 max-w-3xl mx-auto",
                awards.length === 3 && "grid-cols-3",
                awards.length >= 4 && "grid-cols-4",
              )}
            >
              {awards.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedAward(item)}
                  className="group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-[#ffc000]/60 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedAward(item);
                    }
                  }}
                  aria-label={`檢視 ${item.competition}`}
                >
                  <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                    <Image
                      src={item.imgSrc}
                      alt={item.competition}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      unoptimized={isGoogleDriveOrCdnUrl(item.imgSrc)}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      quality={70}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />
                    <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5 text-[#ffc000]" />
                    </div>
                    {item.publishTime && (
                      <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-slate-300 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#ffc000]" />
                        <span>{item.publishTime}</span>
                      </div>
                    )}
                  </div>

                  {/* 圖片下方：只顯示比賽名稱與獎項 */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-2 bg-[#1e1c24]/90">
                    <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#ffc000] transition-colors leading-snug">
                      {item.competition}
                    </h4>
                    <div className="pt-1.5 border-t border-white/5 flex items-center gap-1.5 text-xs text-[#ffc000] font-semibold truncate">
                      <Trophy className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.award}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. 手機與平板版輪播跑馬燈 (Mobile & Tablet: Carousel Slider) */}
            <div className="lg:hidden relative overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                }}
              >
                {awards.map((item) => (
                  <div
                    key={item.id}
                    className="w-full shrink-0 px-1"
                    onClick={() => setSelectedAward(item)}
                  >
                    <div className="group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-[#ffc000]/60 transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-lg">
                      <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                        <Image
                          src={item.imgSrc}
                          alt={item.competition}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          unoptimized={isGoogleDriveOrCdnUrl(item.imgSrc)}
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          priority
                          quality={70}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
                        <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-white">
                          <Maximize2 className="w-4 h-4 text-[#ffc000]" />
                        </div>
                        {item.publishTime && (
                          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/70 backdrop-blur-xs text-xs text-slate-300 font-mono flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#ffc000]" />
                            <span>{item.publishTime}</span>
                          </div>
                        )}
                      </div>

                      {/* 圖片下方：只顯示比賽名稱與獎項 */}
                      <div className="p-4 sm:p-5 flex flex-col justify-between gap-2 bg-[#1e1c24]">
                        <h4 className="text-base font-bold text-white line-clamp-1 group-hover:text-[#ffc000] transition-colors">
                          {item.competition}
                        </h4>
                        <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-xs sm:text-sm text-[#ffc000] font-semibold truncate">
                          <Trophy className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.award}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 手機輪播指示點 */}
              {awards.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  {awards.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setCurrentIndex(dotIdx)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300 cursor-pointer",
                        currentIndex === dotIdx
                          ? "w-6 bg-[#ffc000]"
                          : "w-2 bg-white/20 hover:bg-white/40",
                      )}
                      aria-label={`切換至第 ${dotIdx + 1} 張榮譽照片`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. 榮譽榜公告詳情 Dialog（與資源管理系統公告 Modal 排版 100% 一致） */}
        <Dialog
          open={Boolean(selectedAward)}
          onOpenChange={(isOpen) => !isOpen && setSelectedAward(null)}
        >
          <DialogContent
            aria-describedby={undefined}
            className="max-w-2xl max-h-[85vh] bg-[#1e1c24] border-white/10 text-white p-6"
          >
            {selectedAward && (
              <>
                <DialogHeader className="pr-8">
                  <DialogTitle className="text-xl font-bold text-white text-left leading-snug pr-6">
                    {selectedAward.fullTitle}
                  </DialogTitle>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
                    >
                      榮譽榜
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedAward.publishTime || ""}
                    </span>
                  </div>
                </DialogHeader>

                <ScrollArea className="max-h-[55vh] pr-4 scrollbar-dark">
                  <div className="space-y-4">
                    {/* 內容 */}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                      {selectedAward.content}
                    </div>

                    {/* 附件與圖片清單 (確保主相片 100% 呈現) */}
                    {(modalImageList.length > 0 || modalNonImageAttachments.length > 0) && (
                      <div className="pt-4 border-t border-white/10 space-y-3">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-white">
                          <Paperclip className="h-4 w-4 text-[#ffc000]" />
                          附件 ({modalImageList.length + modalNonImageAttachments.length})
                        </h4>

                        {/* 圖片附件：直接顯示 */}
                        {modalImageList.map((img, i) => (
                          <div
                            key={`img-${i}`}
                            className="rounded-lg overflow-hidden border border-white/10 bg-black/40"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.src}
                              alt={img.title || "榮譽照片"}
                              className="w-full h-auto object-cover max-h-[420px]"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (img.fileId && !target.dataset.fallback) {
                                  target.dataset.fallback = "1";
                                  target.src = `https://drive.google.com/thumbnail?id=${img.fileId}&sz=w1200`;
                                }
                              }}
                            />
                            {img.title && (
                              <p className="p-3 text-xs text-slate-400 border-t border-white/5">
                                {img.title}
                              </p>
                            )}
                          </div>
                        ))}

                        {/* 非圖片附件 */}
                        {modalNonImageAttachments.length > 0 && (
                          <div className="space-y-1.5">
                            {modalNonImageAttachments.map((att, i) => {
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
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
