"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/lib/types/user";

export type MemberAttribute = "社長" | "副社長" | "幹部" | "社員";

interface ExportMembersCsvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserProfile[];
}

/** 依據西元年月計算當前預設民國學年度 */
function getDefaultAcademicYear(): string {
  const now = new Date();
  const currentRocYear = now.getFullYear() - 1911;
  const month = now.getMonth() + 1;
  return (month >= 9 ? currentRocYear : currentRocYear - 1).toString();
}

/** CSV 特殊字元跳脫 */
function escapeCsv(cell: string): string {
  if (!cell) return "";
  if (cell.includes(",") || cell.includes('"') || cell.includes("\n") || cell.includes("\r")) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export function ExportMembersCsvModal({
  open,
  onOpenChange,
  users,
}: ExportMembersCsvModalProps) {
  const { toast } = useToast();
  const defaultYear = useMemo(() => getDefaultAcademicYear(), []);

  // 目標學年（純下拉選單，不可手動輸入）
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const [copied, setCopied] = useState<boolean>(false);

  // 搜集資料中所有出現過的學年度（使用 Set<number> 徹底避免字串格式不一致導致重複 key）
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    const def = parseInt(defaultYear, 10);
    if (!isNaN(def)) {
      yearSet.add(def + 1);
      yearSet.add(def);
      yearSet.add(def - 1);
    }
    users.forEach((u) => {
      const activeY = parseInt(String(u.activeUntilYear || "").trim(), 10);
      if (!isNaN(activeY)) yearSet.add(activeY);
      u.membershipHistory?.forEach((h) => {
        const histY = parseInt(String(h.year || "").trim(), 10);
        if (!isNaN(histY)) yearSet.add(histY);
      });
    });
    return Array.from(yearSet)
      .sort((a, b) => b - a)
      .map(String);
  }, [users, defaultYear]);

  // 解析與篩選名單
  const parsedMembers = useMemo(() => {
    const targetYrStr = String(selectedYear).trim();

    // 1. 精準篩選在目標學年有效的社員（排除停用人員，且社費或記錄必須精準符合該學年）
    const activeUsers = users.filter((u) => {
      if (u.status === "deleted") return false;

      // 檢查歷年記錄中是否有該學年
      const hasHistoryRecord = u.membershipHistory?.some(
        (h) => String(h.year).trim() === targetYrStr
      );

      // 檢查社費學年是否為該學年
      const matchesActiveYear = String(u.activeUntilYear || "").trim() === targetYrStr;

      return hasHistoryRecord || matchesActiveYear;
    });

    // 2. 判斷每位成員在該學年的屬性與職稱
    const result = activeUsers.map((u) => {
      const yearRec = u.membershipHistory?.find(
        (h) => String(h.year).trim() === targetYrStr
      );

      const posString = (yearRec?.positions || "").trim();
      const posArray = posString.split(",").map((p) => p.trim()).filter(Boolean);

      let attribute: MemberAttribute = "社員";
      let title = "";

      // 判斷社長
      const isPresident =
        posArray.includes("社長") ||
        (posString.includes("社長") && !posString.includes("副社長")) ||
        (yearRec?.type === "owner" && !posArray.includes("副社長")) ||
        (!yearRec && u.role === "owner" && !posArray.includes("副社長"));

      // 判斷副社長
      const isVicePresident =
        posArray.includes("副社長") || posString.includes("副社長");

      if (isPresident) {
        attribute = "社長";
        title = "";
      } else if (isVicePresident) {
        attribute = "副社長";
        title = "";
      } else if (
        yearRec?.type === "admin" ||
        yearRec?.type === "owner" ||
        posArray.length > 0 ||
        (!yearRec && (u.role === "admin" || u.role === "owner"))
      ) {
        attribute = "幹部";
        const filteredPositions = posArray.filter(
          (p) => p !== "社長" && p !== "副社長"
        );
        title = filteredPositions.length > 0 ? filteredPositions.join("、") : "幹部";
      } else {
        attribute = "社員";
        title = "";
      }

      return {
        studentId: u.studentId,
        name: u.name,
        attribute,
        title,
      };
    });

    // 3. 排序：社長 -> 副社長 -> 幹部 -> 社員，同級依學號升冪
    const priority: Record<MemberAttribute, number> = {
      社長: 1,
      副社長: 2,
      幹部: 3,
      社員: 4,
    };

    result.sort((a, b) => {
      const pDiff = priority[a.attribute] - priority[b.attribute];
      if (pDiff !== 0) return pDiff;
      return a.studentId.localeCompare(b.studentId);
    });

    return result;
  }, [users, selectedYear, defaultYear]);

  // 生成 CSV 內容（不需要首欄標題列，空職稱不需要尾逗號）
  const csvContent = useMemo(() => {
    return parsedMembers
      .map((m) => {
        const name = escapeCsv(m.name);
        const id = escapeCsv(m.studentId);
        const attr = escapeCsv(m.attribute);
        const title = escapeCsv(m.title);

        if (m.attribute === "幹部" && title) {
          return `${name},${id},${attr},${title}`;
        }
        // 社長/副社長/社員：空職稱不需要逗號
        return `${name},${id},${attr}`;
      })
      .join("\n");
  }, [parsedMembers]);

  // 複製文字
  const handleCopy = async () => {
    if (!csvContent) return;
    try {
      await navigator.clipboard.writeText(csvContent);
      setCopied(true);
      toast({
        title: "已複製至剪貼簿",
        description: `已複製 ${parsedMembers.length} 筆社員資料。`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "複製失敗",
        description: "無法寫入剪貼簿，請手動複製文字方塊內容。",
      });
    }
  };

  // 下載 CSV 檔
  const handleDownload = () => {
    try {
      // 加入 UTF-8 BOM 確保 Windows / Excel 解析中文不亂碼
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `臺科大社團社員名單_${selectedYear}學年度.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "已下載 CSV 檔",
        description: `檔案：臺科大社團社員名單_${selectedYear}學年度.csv (${parsedMembers.length} 筆)`,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "下載發生錯誤";
      toast({
        variant: "destructive",
        title: "下載失敗",
        description: msg,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>匯出社員 (CSV)</DialogTitle>
          <DialogDescription>
            依據學校社團系統匯入規範格式匯出社員名冊。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* 目標學年度下拉選單 */}
          <div className="space-y-2">
            <Label htmlFor="export-year">目標學年度</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="export-year" className="w-full">
                <SelectValue placeholder="選擇學年度" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-56">
                {availableYears.map((yr) => (
                  <SelectItem key={yr} value={yr}>
                    {yr} 學年度{yr === defaultYear ? "（當前學期）" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 下方預覽區域 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="csv-preview">
                名單預覽（共 {parsedMembers.length} 筆）
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={parsedMembers.length === 0}
                className="h-7 px-2 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                    已複製
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    複製內容
                  </>
                )}
              </Button>
            </div>
            <textarea
              id="csv-preview"
              readOnly
              value={csvContent}
              placeholder="該學年度尚無符合資格的成員資料"
              className="w-full h-56 font-mono text-xs bg-muted/40 border border-input rounded-md p-3 resize-none leading-relaxed overflow-y-auto focus:outline-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-3 shrink-0 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={parsedMembers.length === 0}
            className="bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold"
          >
            <Download className="h-4 w-4 mr-1.5" />
            下載 CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
