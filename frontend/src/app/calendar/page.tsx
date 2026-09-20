import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/home/site-footer";
import { CalendarClientPage } from "@/components/calendar/calendar-client-page";

export const metadata: Metadata = {
  title: "社團行事曆",
  description: "國立臺灣科技大學機器人研究社全學期行事曆。提供社課/工作坊、創客活動、競賽日程、期中考週停課資訊與公版行事曆下載。",
  openGraph: {
    title: "社團行事曆 | 臺科大機器人研究社",
    description: "掌握全學期社課、工作坊、創客競賽與學校重大日程，支援單鍵加入 Google 日曆與標準 ICS 訂閱。",
  },
};

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-[#1e1c24] text-white flex flex-col justify-between selection:bg-[#ffc000] selection:text-[#1e1c24] print:bg-white print:text-black print:min-h-0 print:block print:p-0">
      {/* 頂部常駐導覽列 */}
      <SiteHeader />

      {/* 內容主容器 */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 print:p-0 print:m-0 print:max-w-none">
        <CalendarClientPage />
      </main>

      {/* 頁尾 */}
      <SiteFooter />
    </div>
  );
}
