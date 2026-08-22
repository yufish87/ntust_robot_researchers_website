import { SiteHeader } from "@/components/layout/site-header";
import { HomeHero } from "@/components/home/home-hero";
import { AboutSection } from "@/components/home/home-info-section";
import { AnnouncementSection } from "@/components/home/home-announcement-section";
import { CourseSection } from "@/components/home/home-course-section";
import { ScrollIndicator } from "@/components/home/scroll-indicator";
import { SiteFooter } from "@/components/home/site-footer";

import fs from "fs/promises";
import path from "path";

export default async function Home() {
  // 讀取 Hero 拼圖底圖
  const mosaicDir = path.join(process.cwd(), "public", "image", "Mosaic");
  let mosaicImages: string[] = [];

  try {
    const files = await fs.readdir(mosaicDir);
    mosaicImages = files
      .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .map((file) => `/image/Mosaic/${encodeURIComponent(file)}`);
  } catch (err) {
    console.error("Failed to read mosaic images", err);
  }

  return (
    <div className="min-h-screen bg-[#1e1c24] text-white selection:bg-[#ffc000] selection:text-[#1e1c24] flex flex-col justify-between">
      {/* 頂部固定滿版導覽列 (Solid Fixed Header) */}
      <SiteHeader />

      {/* 首頁主體內容 (Full-width Content) */}
      <main className="w-full flex-1 flex flex-col">
        {/* 1. 英雄區塊：科技拼圖矩陣 (Cyber Mosaic Matrix) */}
        <section id="hero" className="w-full">
          <HomeHero mosaicImages={mosaicImages} />
        </section>

        {/* 2. 創客儀表板整合網格主容器 (Robotics Hub Grid Container) */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-20 sm:space-y-28">
          {/* 社團簡介與歷年競賽榮譽榜 */}
          <AboutSection />

          {/* 最新消息與社團公告 */}
          <AnnouncementSection />

          {/* 社課資訊與教學資源 */}
          <CourseSection />

          {/* 滾動進度提示器 */}
          <ScrollIndicator />
        </div>
      </main>

      {/* 沉浸式頁尾 */}
      <SiteFooter />
    </div>
  );
}
