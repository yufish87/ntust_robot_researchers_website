"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface HomeHeroProps {
  mosaicImages?: string[];
}

export function HomeHero({ mosaicImages = [] }: HomeHeroProps) {
  const tileCount = 40;
  const tiles: string[] = [];
  if (mosaicImages.length > 0) {
    for (let i = 0; i < tileCount; i++) {
      tiles.push(mosaicImages[i % mosaicImages.length]);
    }
  }

  // 初始為 null — SSR 時不顯示動畫，避免閃爍
  const [delays, setDelays] = useState<number[] | null>(null);

  useEffect(() => {
    // Client mount 後才產生隨機動畫順序
    const indices = Array.from({ length: tileCount }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setDelays(indices.map((order) => order * 50));
  }, [tileCount]);

  return (
    <section className="w-full min-h-[inherit] relative flex items-center justify-center overflow-hidden">
      {/* 拼圖底圖 — 只在 client mount 後才渲染，避免 SSR 順序閃爍 */}
      {tiles.length > 0 && delays && (
        <div
          className="absolute top-0 -bottom-4 -left-4 -right-4 grid opacity-[0.2] pointer-events-none"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gridAutoRows: "135px",
          }}
          aria-hidden="true"
        >
          {tiles.map((src, i) => (
            <div
              key={i}
              className="relative overflow-hidden animate-[zoomIn_0.4s_ease-out_both]"
              style={{ animationDelay: `${delays[i]}ms` }}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="200px"
                className="object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* 上層遮罩 — 中間加重、外圍保持透明 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 85% 85% at center, rgba(52,49,60,1) 0%, rgba(52,49,60,0.4) 70%)",
        }}
      />

      {/* 主內容 */}
      <div className="relative z-10 space-y-6 max-w-2xl mx-auto text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Image
              src="/image/Bar_Logo_Yellow.png"
              alt="NTUST Robot Researchers Club"
              width={650}
              height={150}
              className="w-[350px] md:w-[500px] lg:w-[650px] h-auto object-contain"
              priority
            />
          </div>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed">
            探索科技極限，實踐創客精神。
            <br />
            從基礎教學到國際競賽，我們提供最完整的資源與舞台，
            <br />
            讓你的機器人夢想不再只是夢想。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="bg-[#ffc000] hover:bg-yellow-500 text-[#34313c] font-bold px-8 rounded-full shadow-lg hover:shadow-xl transition-all border-none cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              const target = document.querySelector("#about");
              if (target) target.scrollIntoView({ behavior: "smooth" });
            }}
          >
            認識我們
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="px-8 rounded-full border-slate-500 text-slate-200 hover:bg-white/10 hover:text-white hover:border-white bg-transparent cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              const target = document.querySelector("#courses");
              if (target) target.scrollIntoView({ behavior: "smooth" });
            }}
          >
            了解課程
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="pt-4 flex items-center justify-center gap-8 text-slate-400 text-sm font-medium">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-[#ffc000]">10+</span>
            <span>年度競賽獎項</span>
          </div>
          <div className="w-px h-8 bg-slate-600"></div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-[#ffc000]">50+</span>
            <span>專業社課時數</span>
          </div>
          <div className="w-px h-8 bg-slate-600"></div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-[#ffc000]">
              臺灣科技大學
            </span>
            <span>專業技術社團</span>
          </div>
        </div>
      </div>
    </section>
  );
}
