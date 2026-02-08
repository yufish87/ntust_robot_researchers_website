"use client";

import { Megaphone, BookOpen, Info, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Latest News Section
export function NewsSection({ className }: { className?: string }) {
  return (
    <div className={cn("w-full py-8 md:py-12", className)}>
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
        {/* Header */}
        <div className="md:w-1/4 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="h-6 w-6 text-[#ffc000]" />
            <h3 className="text-2xl font-bold text-white">最新公告</h3>
          </div>
          <p className="text-sm text-slate-400">社團最新消息與異動</p>
        </div>
        
        {/* Content */}
        <div className="flex-1 w-full bg-white/5 rounded-xl p-6 min-h-[150px] flex items-center justify-center text-slate-500 italic">
           <p>目前沒有新公告</p>
           {/* TODO: Integrate with News API */}
        </div>
      </div>
    </div>
  );
}

// 2. Course Info Section
export function CourseSection({ className }: { className?: string }) {
  return (
    <div className={cn("w-full py-8 md:py-12", className)}>
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
        {/* Header */}
        <div className="md:w-1/4 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-6 w-6 text-[#ffc000]" />
            <h3 className="text-2xl font-bold text-white">課程資訊</h3>
          </div>
          <p className="text-sm text-slate-400">近期社課內容與時間</p>
        </div>

        {/* Content */}
        <div className="flex-1 w-full bg-white/5 rounded-xl p-6 min-h-[150px] flex items-center justify-center text-slate-500 italic">
           <p>尚無課程資訊</p>
           {/* TODO: Integrate with Course API */}
        </div>
      </div>
    </div>
  );
}

// 3. About Us Section
export function AboutSection({ className }: { className?: string }) {
  return (
    <div className={cn("w-full py-8 md:py-12", className)}>
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
        {/* Header */}
        <div className="md:w-1/4 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <Info className="h-6 w-6 text-[#ffc000]" />
            <h3 className="text-2xl font-bold text-white">社團簡介</h3>
          </div>
          <p className="text-sm text-slate-400">關於我們的故事與願景</p>
        </div>

        {/* Content */}
        <div className="flex-1 w-full bg-white/5 rounded-xl p-6 md:p-8">
          <div className="text-slate-300 leading-relaxed text-lg">
            <p className="mb-4">
              臺科大機器人研究社致力於推廣機器人技術與知識分享。藉由參與不同的競賽與實作，共同精進機電類相關知識與技能，立志成為學界與業界的橋樑！我們提供豐富的社課教學、器材資源以及競賽輔導，歡迎所有對機器人領域有興趣的同學加入！
            </p>
            <ul className="list-disc pl-5 space-y-1 text-base text-slate-400">
              <li>每週固定社課教學</li>
              <li>豐富的硬體設備與器材</li>
              <li>校內外競賽輔導與補助</li>
              <li>跨領域技術交流</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Contact Us Section
export function ContactSection({ className }: { className?: string }) {
  return (
    <div className={cn("w-full py-8 md:py-12", className)}>
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
        {/* Header */}
        <div className="md:w-1/4 shrink-0">
           <div className="flex items-center gap-3 mb-2">
            <Phone className="h-6 w-6 text-[#ffc000]" />
            <h3 className="text-2xl font-bold text-white">聯絡我們</h3>
          </div>
          <p className="text-sm text-slate-400">歡迎隨時與我們聯繫</p>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          {/* Location */}
          <div className="bg-white/5 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ffc000]/20 flex items-center justify-center shrink-0 text-[#ffc000]">
               <span className="text-lg">📍</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Location</p>
              <p className="font-medium text-white">社團大樓二樓 S205</p>
            </div>
          </div>
          
          {/* Email */}
          <a href="mailto:ntust.robot@gmail.com" className="bg-white/5 p-4 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-[#ffc000]/20 flex items-center justify-center shrink-0 text-[#ffc000] group-hover:bg-[#ffc000] group-hover:text-black transition-colors">
               <span className="text-lg">📧</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Email</p>
              <p className="font-medium text-white truncate">ntust.robot@gmail.com</p>
            </div>
          </a>

          {/* Facebook */}
           <a href="https://www.facebook.com/NTUSTRRC" target="_blank" rel="noopener noreferrer" className="bg-white/5 p-4 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-[#ffc000]/20 flex items-center justify-center shrink-0 text-[#ffc000] group-hover:bg-[#ffc000] group-hover:text-black transition-colors">
               <span className="text-lg">f</span>
            </div>
            <div>
               <p className="text-xs text-slate-400 uppercase tracking-wider">Facebook</p>
               <p className="font-medium text-white">粉絲專頁</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
