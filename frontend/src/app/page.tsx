import { PublicSidebar } from "@/components/layout/public-sidebar";
import { HomeHero } from "@/components/home/home-hero";
import {
  AboutSection,
  NewsSection,
} from "@/components/home/home-info-section";
import { CourseSection } from "@/components/home/home-course-section";
import { ScrollIndicator } from "@/components/home/scroll-indicator";
import { SiteFooter } from "@/components/home/site-footer";

import fs from "fs/promises";
import path from "path";

export default async function Home() {
  // 讀取競賽成果圖片
  const competitionDir = path.join(process.cwd(), "public", "image", "Competition");
  let awardImages: { src: string; text: string }[] = [];

  try {
    const files = await fs.readdir(competitionDir);
    awardImages = files
      .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .map((file) => ({
        src: `/image/Competition/${encodeURIComponent(file)}`,
        text: path.parse(file).name,
      }));
  } catch (err) {
    console.error("Failed to read competition images", err);
  }

  // 讀取 Hero 拼圖底圖
  const mosaicDir = path.join(process.cwd(), "public", "image", "Mosaic");
  let mosaicImages: string[] = [];

  try {
    const files = await fs.readdir(mosaicDir);
    mosaicImages = files
      .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .map((file) => `/image/Mosaic/${encodeURIComponent(file)}`);
    // Fisher-Yates shuffle
    for (let i = mosaicImages.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mosaicImages[i], mosaicImages[j]] = [mosaicImages[j], mosaicImages[i]];
    }
  } catch (err) {
    console.error("Failed to read mosaic images", err);
  }

  return (
    <div className="flex bg-[#34313c] min-h-screen selection:bg-[#ffc000] selection:text-[#34313c]">
      {/* Sidebar - Visible on Desktop */}
      <PublicSidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 w-full h-screen overflow-y-auto scroll-smooth">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center px-4 py-4 sticky top-0 bg-[#34313c]/95 backdrop-blur-md z-50 border-b border-white/10">
          <span className="font-bold text-lg text-white">NTUST RRC</span>
          <a
            href="/auth/login"
            className="text-sm font-bold text-[#34313c] bg-[#ffc000] px-4 py-1.5 rounded-full hover:bg-yellow-400 transition-colors"
          >
            登入
          </a>
        </div>

        {/* 1. Hero Section — 全寬，不受 max-w-7xl 限制 */}
        <section
          id="hero"
          className="h-[88vh] flex items-center justify-center relative"
        >
          <HomeHero mosaicImages={mosaicImages} />
        </section>

        <div className="max-w-7xl mx-auto flex flex-col">

          {/* 2. About Section - Alt Background (Deep) */}
          <section
            id="about"
            className="px-4 md:px-8 lg:px-12 py-12 scroll-mt-20 bg-black/20"
          >
            <AboutSection awardImages={awardImages} />
          </section>

          {/* 3. News Section (Base/Light) */}
          <section
            id="news"
            className="px-4 md:px-8 lg:px-12 py-12 scroll-mt-20"
          >
            <NewsSection />
          </section>

          {/* 4. Course Section - Alt Background (Deep) */}
          <section
            id="courses"
            className="px-4 md:px-8 lg:px-12 py-12 scroll-mt-20 bg-black/20"
          >
            <CourseSection />
          </section>

          {/* Footer (含聯絡資訊) */}
          <SiteFooter />

          <ScrollIndicator />
        </div>
      </main>
    </div>
  );
}
