"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { HomeCarousel } from "./home-carousel";

export function HomeHero() {
  return (
    <section className="w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-12 py-8 md:py-12">
      {/* Left Content */}
      <div className="flex-1 space-y-6 text-center lg:text-left">
        <div className="space-y-4">
          <div className="relative mx-auto lg:mx-0">
             <Image 
               src="/image/Bar_Logo_Yellow.png" 
               alt="NTUST Robot Researchers Club" 
               width={500}
               height={120}
               className="w-[300px] md:w-[400px] lg:w-[500px] h-auto object-contain object-left"
               priority
             />
          </div>
          <p className="text-slate-300 text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            探索科技極限，實踐創客精神。<br className="hidden md:inline" />
            從基礎教學到國際競賽，我們提供最完整的資源與舞台，讓你的機器人夢想不再只是夢想。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
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
          </Button>
        </div>
        
        {/* Simple Stats or Highlights */}
        <div className="pt-4 flex items-center justify-center lg:justify-start gap-8 text-slate-400 text-sm font-medium">
          <div className="flex flex-col items-center lg:items-start">
             <span className="text-2xl font-bold text-[#ffc000]">10+</span>
             <span>年度競賽獎項</span>
          </div>
          <div className="w-px h-8 bg-slate-600"></div>
          <div className="flex flex-col items-center lg:items-start">
             <span className="text-2xl font-bold text-[#ffc000]">50+</span>
             <span>專業社課時數</span>
          </div>
           <div className="w-px h-8 bg-slate-600"></div>
          <div className="flex flex-col items-center lg:items-start">
             <span className="text-2xl font-bold text-[#ffc000]">臺科大</span>
             <span>頂尖技術社團</span>
          </div>
        </div>
      </div>

      {/* Right Content - Carousel */}
      <div className="flex-1 w-full max-w-[600px] lg:max-w-none">
        <div className="relative aspect-video lg:aspect-auto lg:h-[450px] shadow-2xl rounded-2xl overflow-hidden border-4 border-slate-700/50">
          <HomeCarousel />
          {/* Decorative Elements */}
          <div className="absolute -z-10 top-[-20px] right-[-20px] w-full h-full bg-[#ffc000]/10 rounded-2xl"></div>
          <div className="absolute -z-10 bottom-[-20px] left-[-20px] w-full h-full bg-slate-700/30 rounded-2xl"></div>
        </div>
      </div>
    </section>
  );
}
