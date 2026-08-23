"use client";

import { cn } from "@/lib/utils";
import { Mail, MapPin, Facebook, Instagram, BookOpen, ExternalLink, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      id="footer"
      className={cn(
        "w-full border-t border-white/10 bg-[#16141a] text-white select-none",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          {/* 1. 品牌與介紹 */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 shrink-0">
                <Image
                  src="/image/icon.png"
                  alt="Icon"
                  fill
                  className="object-contain"
                  sizes="40px"
                />
              </div>
              <div>
                <p className="font-bold text-white text-base tracking-wide">
                  國立臺灣科技大學 機器人研究社
                </p>
                <p className="text-xs text-[#ffc000] font-mono">
                  NTUST Robot Researchers Club
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              以創客實作為根基，致力於推廣機器人科技、軟硬體整合與全國賽事實戰。提供社課教學、機具借用與跨領域技術交流空間。
            </p>
          </div>

          {/* 2. 快速連結 */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold text-[#ffc000] uppercase tracking-wider">
              QUICK NAVIGATION
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <a href="#about" className="hover:text-white hover:underline transition-colors">
                  社團簡介與願景
                </a>
              </li>
              <li>
                <a href="#awards" className="hover:text-white hover:underline transition-colors">
                  歷年競賽成果
                </a>
              </li>
              <li>
                <a href="#news" className="hover:text-white hover:underline transition-colors">
                  最新社團消息
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-white hover:underline transition-colors">
                  專業社課資訊
                </a>
              </li>
              <li>
                <Link href="/manual" className="hover:text-[#ffc000] hover:underline transition-colors inline-flex items-center gap-1">
                  社團使用說明手冊
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. 社辦位置與聯絡 */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold text-[#ffc000] uppercase tracking-wider">
              CONNECT & LOCATION
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#ffc000] shrink-0" />
                <a href="https://maps.app.goo.gl/H5yPBJSKp45tRefC9" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  台北市大安區基隆路四段43號<br />臺科大校本部 社團大樓2樓 S205室
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#ffc000] shrink-0" />
                <a href="mailto:ntust.robot@gmail.com" className="hover:text-white transition-colors">
                  ntust.robot@gmail.com
                </a>
              </div>
            </div>

            {/* 社群圖示列 */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://www.facebook.com/ntust.robot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-[#ffc000] hover:text-[#1e1c24] hover:border-transparent transition-all"
                aria-label="Facebook 粉絲專頁"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/ntust.robot/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-[#ffc000] hover:text-[#1e1c24] hover:border-transparent transition-all"
                aria-label="Instagram 官方帳號"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:ntust.robot@gmail.com"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-[#ffc000] hover:text-[#1e1c24] hover:border-transparent transition-all"
                aria-label="電子郵件"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* 下半部: 版權聲明 */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            {new Date().getFullYear()} NTUST Robot Researchers Club
          </p>
          <div className="flex items-center gap-4">
            <Link href="/manual" className="hover:text-slate-300 transition-colors">
              使用條款與規範
            </Link>
            <span>・</span>
            <span className="text-slate-400 font-mono">
              Designed for NTUST Makers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
