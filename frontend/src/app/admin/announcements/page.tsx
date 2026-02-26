import { Construction, Megaphone } from "lucide-react";

export default function AdminAnnouncementsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
        <Megaphone className="w-8 h-8 text-blue-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">公告管理</h1>
      <div className="flex items-center gap-2 text-slate-500">
        <Construction className="w-4 h-4" />
        <span>此功能正在開發中</span>
      </div>
    </div>
  );
}
