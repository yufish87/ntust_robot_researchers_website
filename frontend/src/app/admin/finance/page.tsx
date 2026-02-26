import { Construction, CreditCard } from "lucide-react";

export default function AdminFinancePage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
        <CreditCard className="w-8 h-8 text-rose-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">報帳審核</h1>
      <div className="flex items-center gap-2 text-slate-500">
        <Construction className="w-4 h-4" />
        <span>此功能正在開發中</span>
      </div>
    </div>
  );
}
