import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  FileText,
  Download,
  ShieldCheck,
  Receipt,
  Banknote,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinanceApplication } from "@/lib/types/finance";

interface FinanceDetailModalProps {
  application: FinanceApplication | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FinanceDetailModal({
  application,
  isOpen,
  onClose,
}: FinanceDetailModalProps) {
  if (!application) return null;

  function getStatusBadge(app: FinanceApplication) {
    switch (app.status) {
      case "審核中":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
          >
            審核中
          </Badge>
        );
      case "已通過": {
        if (app.disbursementStatus === "已撥款")
          return (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              已完成
            </Badge>
          );
        if (app.invoiceSubmitStatus === "已確認")
          return (
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
              待撥款
            </Badge>
          );
        if (app.invoiceSubmitStatus === "已提交")
          return (
            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
              發票已提交
            </Badge>
          );
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800">
            已通過
          </Badge>
        );
      }
      case "不予通過":
        return <Badge variant="destructive">不予通過</Badge>;
      case "已取消":
        return <Badge variant="secondary">已取消</Badge>;
      default:
        return <Badge variant="secondary">{app.status}</Badge>;
    }
  }

  const fmtDate = (d: string | undefined | null) =>
    d ? format(new Date(d), "yyyy/MM/dd HH:mm") : "—";

  const showAuditSection = application.status !== "審核中";
  const showInvoiceSection =
    application.status === "已通過" && application.invoiceSubmitStatus;
  const showDisbursementSection =
    application.status === "已通過" && application.disbursementStatus;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 gap-5">
        {/* Header: 防遮擋與自適應換行 */}
        <DialogHeader className="pr-8 sm:pr-10 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
                申請詳情
              </DialogTitle>
              <span className="font-mono text-xs sm:text-sm font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                {application.id}
              </span>
            </div>
            <div className="flex items-center">
              {getStatusBadge(application)}
            </div>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            申請人：{application.applicantName || application.applicantId} ・ 申請時間：{fmtDate(application.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-1">
                報帳類別
              </span>
              <p className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                {application.category}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-1">
                總金額
              </span>
              <p className="font-bold text-base sm:text-xl text-amber-600 dark:text-[#ffc000]">
                NT$ {Number(application.totalAmount).toLocaleString()}
              </p>
            </div>
          </div>

          {/* 支出說明 */}
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1.5">
              支出說明
            </span>
            <p className="bg-slate-50/70 dark:bg-white/[0.02] p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 break-words leading-relaxed">
              {application.description}
            </p>
          </div>

          {/* Invoice Info */}
          <div className="border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5 sm:p-4 bg-slate-50/70 dark:bg-white/[0.02]">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-xs sm:text-sm text-slate-900 dark:text-white">
              <FileText className="h-4 w-4 text-amber-500" />
              發票 / 收據資訊
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">發票種類</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {application.invoiceType}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">發票號碼</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {application.invoiceNumber || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">發票日期</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {application.invoiceDate
                    ? format(new Date(application.invoiceDate), "yyyy/MM/dd")
                    : "—"}
                </span>
              </div>
            </div>

            {application.fileLink && (
              <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                >
                  <a
                    href={application.fileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    查看上傳憑證
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Items: 費用明細 (行動端 Card / 桌面端 Table 自適應) */}
          <div>
            <h4 className="font-semibold mb-2.5 flex items-center gap-2 text-xs sm:text-sm text-slate-900 dark:text-white">
              <Package className="h-4 w-4 text-amber-500" />
              費用明細
            </h4>

            {/* 行動裝置卡片清單 (sm:hidden) */}
            <div className="sm:hidden space-y-2.5">
              {application.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white break-words">
                        {item.itemName}
                      </div>
                      <span className="inline-block mt-0.5 text-[11px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium border border-amber-200/60 dark:border-amber-900/60">
                        {item.expenseType}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        NT$ {Number(item.totalPrice).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        數量：{item.quantity}
                      </div>
                    </div>
                  </div>
                  {item.itemSpec && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-black/20 p-2 rounded-lg border border-slate-200/50 dark:border-white/5 break-words">
                      <span className="text-[11px] text-muted-foreground mr-1">規格：</span>
                      {item.itemSpec}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 桌面端表格 (hidden sm:block) */}
            <div className="hidden sm:block border border-slate-200/80 dark:border-white/10 rounded-xl overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-white/[0.02]">
                    <TableHead className="min-w-[160px]">項目名稱</TableHead>
                    <TableHead className="min-w-[120px]">規格/說明</TableHead>
                    <TableHead className="w-[80px] text-center">數量</TableHead>
                    <TableHead className="w-[110px] text-right">小計</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {application.items?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium whitespace-normal break-all">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.itemName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.expenseType}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-normal break-all">
                        {item.itemSpec || "—"}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium">
                        NT$ {Number(item.totalPrice).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Audit Section */}
          {showAuditSection && (
            <div className="border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5 sm:p-4 bg-slate-50/70 dark:bg-white/[0.02]">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-xs sm:text-sm text-slate-900 dark:text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                審核資訊
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">審核結果</span>
                  <span className="font-medium text-slate-900 dark:text-white">{application.status}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">審核人</span>
                  <span className="font-medium text-slate-900 dark:text-white">{application.reviewerId || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">審核時間</span>
                  <span className="font-medium text-slate-900 dark:text-white">{fmtDate(application.reviewedAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Submit Section */}
          {showInvoiceSection && (
            <div className="border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5 sm:p-4 bg-slate-50/70 dark:bg-white/[0.02]">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-xs sm:text-sm text-slate-900 dark:text-white">
                <Receipt className="h-4 w-4 text-blue-500" />
                發票投遞狀態
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">提交狀態</span>
                  <span className="font-medium text-slate-900 dark:text-white">{application.invoiceSubmitStatus}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">提交時間</span>
                  <span className="font-medium text-slate-900 dark:text-white">{fmtDate(application.invoiceSubmitTime)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">確認者</span>
                  <span className="font-medium text-slate-900 dark:text-white">{application.invoiceReceiverId || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">確認時間</span>
                  <span className="font-medium text-slate-900 dark:text-white">{fmtDate(application.invoiceReceivedAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Disbursement Section */}
          {showDisbursementSection && (
            <div className="border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5 sm:p-4 bg-slate-50/70 dark:bg-white/[0.02]">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-xs sm:text-sm text-slate-900 dark:text-white">
                <Banknote className="h-4 w-4 text-emerald-500" />
                撥款資訊
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">撥款狀態</span>
                  <span className="font-medium text-slate-900 dark:text-white">{application.disbursementStatus}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">撥款時間</span>
                  <span className="font-medium text-slate-900 dark:text-white">{fmtDate(application.disbursedAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reject Reason */}
          {application.status === "不予通過" && application.rejectReason && (
            <div className="bg-red-50 dark:bg-red-950/30 p-3.5 sm:p-4 rounded-xl border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300">
              <h4 className="font-semibold mb-1 text-xs sm:text-sm">駁回原因</h4>
              <p className="text-xs sm:text-sm leading-relaxed">{application.rejectReason}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
