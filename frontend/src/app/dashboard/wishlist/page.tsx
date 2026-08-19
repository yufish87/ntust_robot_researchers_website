import { Sparkles } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function WishlistPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <AdminPageHeader
        title="社團許願池"
        description="向社團幹部提出新器材採購建議、想上的社課工作坊主題或系統反饋。"
      />
      <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-12 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-white/5 border border-amber-200/60 dark:border-white/10 flex items-center justify-center text-amber-600 dark:text-[#ffc000] mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">功能籌備中</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            想要什麼新硬體模組、特殊感測器或進階技術講座？許願池系統即將上線！
          </p>
        </div>
      </div>
    </div>
  );
}
