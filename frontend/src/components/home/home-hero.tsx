"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowRight, Sparkles, Cpu, Wrench, Trophy } from "lucide-react";
import { useState, useEffect } from "react";

interface HomeHeroProps {
  mosaicImages?: string[];
}

export function HomeHero({ mosaicImages = [] }: HomeHeroProps) {
  // 使用充足數量（120片）以確保在 4K/2K/超寬螢幕下皆能 100% 鋪滿全區域
  const tileCount = 120;
  const tiles: string[] = [];
  if (mosaicImages.length > 0) {
    for (let i = 0; i < tileCount; i++) {
      tiles.push(mosaicImages[i % mosaicImages.length]);
    }
  }

  // Avoid animation during SSR; only run after client mount.
  const [delays, setDelays] = useState<number[] | null>(null);

  useEffect(() => {
    // Client mount 後啟動馬賽克動畫順序（隨機洗牌）
    const indices = Array.from({ length: tileCount }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setDelays(indices.map((order) => Math.min(order * 25, 1800)));
  }, [tileCount]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className="w-full min-h-[92dvh] pt-16 relative flex items-center justify-center overflow-hidden bg-[#1e1c24] select-none"
    >
      {/* 1. 動態相片拼圖底圖矩陣 (Maker Photo Mosaic Matrix) - 支援滑鼠懸浮互動 */}
      {tiles.length > 0 && delays && (
        <div
          className="absolute inset-0 grid gap-1 p-1 opacity-65 hover:opacity-80 transition-opacity duration-500"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gridAutoRows: "95px",
          }}
          aria-hidden="true"
        >
          {tiles.map((src, i) => (
            <div
              key={i}
              className="group/tile relative rounded-[3px] overflow-hidden bg-black/30 border border-white/[0.06] hover:border-[#ffc000]/80 hover:scale-110 hover:z-20 hover:opacity-100 hover:shadow-xl hover:shadow-black/90 transition-all duration-300 cursor-pointer animate-[zoomIn_0.4s_cubic-bezier(0.16,1,0.3,1)_both]"
              style={{ animationDelay: `${delays[i]}ms` }}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="150px"
                className="object-cover transition-transform duration-500 group-hover/tile:scale-105"
                loading="eager"
                quality={65}
              />
              <div className="absolute inset-0 bg-black/10 group-hover/tile:bg-transparent transition-colors" />
            </div>
          ))}
        </div>
      )}

      {/* 2. 均勻科技暗色遮罩 (Smooth Linear Scrim) */}
      <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-[#1e1c24]/70 via-[#1e1c24]/80 to-[#1e1c24]" />

      {/* 4. 英雄區核心內容 (Main Content) */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center flex flex-col items-center pointer-events-auto">

        {/* 社團大標 Logo */}
        <div className="relative w-[320px] sm:w-[480px] md:w-[620px] h-[80px] sm:h-[110px] md:h-[140px] mb-6 drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)]">
          <Image
            src="/image/Bar_Logo_Yellow.png"
            alt="臺科大機器人研究社"
            fill
            priority
            className="object-contain"
            sizes="(max-width: 640px) 320px, (max-width: 768px) 480px, 620px"
          />
        </div>

        {/* 核心精神標語 (高清晰度對比) */}
        <div className="space-y-2.5 mb-8 max-w-2xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            探索科技創新・實踐創客精神
          </h1>
          <p className="text-slate-200 text-sm sm:text-base md:text-lg font-medium leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            從基礎教學到全國競賽，匯聚每位夥伴的熱情與汗水，讓夢想具體成真。
          </p>
        </div>

        {/* 雙行動按鈕 (CTA Buttons) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-10">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-[#ffc000] hover:bg-yellow-500 text-[#1e1c24] font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-base gap-2 group"
            onClick={() => scrollToSection("about")}
          >
            探索社團
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto px-8 py-6 rounded-xl border-white/20 text-slate-200 hover:text-white hover:bg-white/10 hover:border-white/40 bg-white/5 backdrop-blur-xs font-semibold cursor-pointer text-base gap-2"
            onClick={() => scrollToSection("courses")}
          >
            查看社課資訊
            <Cpu className="w-4 h-4 text-[#ffc000]" />
          </Button>
        </div>

        {/* 5. 核心指標牌 (Tabular Metric Badges) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 w-full max-w-xl p-3 sm:p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-xl">
          <div className="flex flex-col items-center text-center p-2 group/metric hover:bg-white/[0.03] rounded-xl transition-colors">
            <div className="flex items-center gap-1 text-[#ffc000] mb-0.5">
              <Trophy className="w-3.5 h-3.5 hidden sm:inline" />
              <span className="text-xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight">
                10+
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">競賽歷練經驗</span>
          </div>

          <div className="flex flex-col items-center text-center p-2 border-x border-white/10 group/metric hover:bg-white/[0.03] rounded-xl transition-colors">
            <div className="flex items-center gap-1 text-[#ffc000] mb-0.5">
              <Wrench className="w-3.5 h-3.5 hidden sm:inline" />
              <span className="text-xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight">
                50+
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">年度社課時數</span>
          </div>

          <div className="flex flex-col items-center text-center p-2 group/metric hover:bg-white/[0.03] rounded-xl transition-colors">
            <div className="flex items-center gap-1 text-[#ffc000] mb-0.5">
              <Cpu className="w-3.5 h-3.5 hidden sm:inline" />
              <span className="text-xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight">
                NTUST
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">頂尖創客基地</span>
          </div>
        </div>
      </div>
    </section>
  );
}
