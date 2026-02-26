import { Construction, Wrench } from "lucide-react";

export default function AdminEquipmentPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
        <Wrench className="w-8 h-8 text-orange-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">器材借用審核</h1>
      <div className="flex items-center gap-2 text-slate-500">
        <Construction className="w-4 h-4" />
        <span>此功能正在開發中</span>
      </div>
    </div>
  );
}
