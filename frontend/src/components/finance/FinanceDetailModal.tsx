import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinanceApplication {
  id: string;
  category: string;
  description: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: Array<{
    itemName: string;
    itemSpec: string;
    quantity: number;
    totalPrice: number;
    expenseType: string;
  }>;
  invoiceType: string;
  invoiceNumber?: string;
  invoiceDate: string;
  fileId?: string;
  fileLink?: string;
  rejectReason?: string;
}

interface FinanceDetailModalProps {
  application: FinanceApplication | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FinanceDetailModal({ application, isOpen, onClose }: FinanceDetailModalProps) {
  if (!application) return null;

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">審核中</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">已通過</Badge>;
      case "rejected":
        return <Badge variant="destructive">已拒絕</Badge>;
      case "cancelled":
        return <Badge variant="secondary">已取消</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle className="text-xl flex items-center gap-2">
              申請詳情
              <span className="font-mono text-base font-normal text-muted-foreground">
                {application.id}
              </span>
            </DialogTitle>
            {getStatusBadge(application.status)}
          </div>
          <DialogDescription>
            申請時間: {application.createdAt ? format(new Date(application.createdAt), "yyyy/MM/dd HH:mm") : "-"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Info */}
          <div className="grid gap-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">報帳類別</h4>
              <p>{application.category}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">總金額</h4>
              <p className="font-bold text-lg">NT$ {Number(application.totalAmount).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">支出說明</h4>
            <p className="bg-slate-50 p-3 rounded-md text-sm">{application.description}</p>
          </div>

          {/* Invoice Info */}
          <div className="border rounded-md p-4 bg-slate-50">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              發票/收據資訊
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">發票種類</span>
                <span>{application.invoiceType}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">發票號碼</span>
                <span className="font-mono">{application.invoiceNumber || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">發票日期</span>
                <span>{application.invoiceDate ? format(new Date(application.invoiceDate), "yyyy/MM/dd") : "-"}</span>
              </div>
            </div>
            
            {application.fileLink && (
              <div className="mt-4 pt-3 border-t">
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                  <a href={application.fileLink} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    查看上傳憑證
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <h4 className="font-semibold mb-3">費用明細</h4>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>項目名稱</TableHead>
                    <TableHead>規格/說明</TableHead>
                    <TableHead>數量</TableHead>
                    <TableHead>小計</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {application.items?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div>{item.itemName}</div>
                        <div className="text-xs text-muted-foreground">{item.expenseType}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.itemSpec}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>NT$ {Number(item.totalPrice).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

           {/* Reject Reason */}
           {application.status === 'rejected' && application.rejectReason && (
            <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
              <h4 className="font-semibold mb-1">拒絕原因</h4>
              <p className="text-sm">{application.rejectReason}</p>
            </div>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
