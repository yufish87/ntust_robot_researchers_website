"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarCategory, CalendarEvent } from "@/types/calendar";
import {
  CALENDAR_CATEGORY_CONFIG,
  STANDARD_CALENDAR_CATEGORIES,
  getCurrentSemester,
} from "@/config/calendar";
import { FileSpreadsheet, Check, AlertCircle, Loader2 } from "lucide-react";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes";

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSemester?: string;
  onBatchImport: (events: Array<Omit<CalendarEvent, "id">>) => Promise<void>;
}

interface ParsedRow {
  selected: boolean;
  semester: string;
  title: string;
  category: CalendarCategory;
  startDate: string;
  endDate: string;
  week?: number;
  location?: string;
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  defaultSemester,
  onBatchImport,
}: ExcelImportDialogProps) {
  const [semester, setSemester] = useState(defaultSemester || getCurrentSemester());
  const [meetingDate, setMeetingDate] = useState("115.08.13");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 關鍵字推算類別 (精準對齊三大類別：社課/工作坊、活動/社員大會、考試/國定假日)
  const detectCategory = (title: string): CalendarCategory => {
    const t = title.toLowerCase();

    // 1. 考試/國定假日 (含期中/期末考、停課、國定假日、彈性補假等)
    if (
      t.includes("考") ||
      t.includes("期中") ||
      t.includes("期末") ||
      t.includes("停課") ||
      t.includes("假") ||
      t.includes("連假") ||
      t.includes("元旦") ||
      t.includes("春節") ||
      t.includes("中秋") ||
      t.includes("國慶") ||
      t.includes("二二八") ||
      t.includes("端午") ||
      t.includes("清明") ||
      t.includes("勞動節") ||
      t.includes("教師節") ||
      t.includes("光復節") ||
      t.includes("補假") ||
      t.includes("彈性放假") ||
      t.includes("校慶")
    ) {
      return "holiday";
    }

    // 2. 社課/工作坊
    if (
      t.includes("課") ||
      t.includes("教學") ||
      t.includes("培訓") ||
      t.includes("工作坊") ||
      t.includes("workshop") ||
      t.includes("演講") ||
      t.includes("講座") ||
      t.includes("python") ||
      t.includes("ros") ||
      t.includes("繪圖") ||
      t.includes("實作") ||
      t.includes("入門") ||
      t.includes("進階") ||
      t.includes("初階") ||
      t.includes("架設") ||
      t.includes("辨識") ||
      t.includes("視覺") ||
      t.includes("機器人")
    ) {
      return "course";
    }

    // 3. 活動/社員大會 (社員大會、迎新、比賽、聚餐、博覽會等社團活動事務)
    return "activity";
  };


  // 處理上傳 Excel 檔案
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsing(true);
    setError(null);
    setParsedRows([]);

    try {
      const isExcel =
        file.name.toLowerCase().endsWith(".xlsx") ||
        file.name.toLowerCase().endsWith(".xls");

      if (!isExcel) {
        throw new Error("僅支援 Excel 檔案格式（.xlsx / .xls）");
      }

      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const { rows, detectedSemester } = parseExcelRows(json, semester);
      if (detectedSemester && detectedSemester !== semester) {
        setSemester(detectedSemester);
      }

      if (rows.length === 0) {
        throw new Error(
          "未解析出有效日程，請確認 Excel 是否包含社團行事曆欄位（A:年份、J:月份、K:日期、M:重要行事）"
        );
      }
      setParsedRows(rows);
    } catch (err: any) {
      setError(err?.message || "檔案解析失敗，請檢查檔案格式");
    } finally {
      setParsing(false);
    }
  };

  // 解析 Excel：優先採用臺科大機器人研究社社曆規格，次以通用表格容錯
  const parseExcelRows = (
    rows: any[][],
    sem: string
  ): { rows: ParsedRow[]; detectedSemester?: string } => {
    if (!rows || rows.length < 2) return { rows: [] };

    // 檢查是否為本社行事曆版型 (標題列常在第 5、6 列，M欄為重要行事，J欄為月份，K欄為日期)
    const isClubCalendarLayout = checkIfClubCalendar(rows);

    if (isClubCalendarLayout) {
      return parseClubCalendarLayout(rows, sem);
    } else {
      return parseGenericLayout(rows, sem);
    }
  };

  // 判斷是否符合本社行事曆格式
  const checkIfClubCalendar = (rows: any[][]): boolean => {
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r] || [];
      const rowStr = row.map((c) => String(c || "")).join(" ");
      if (
        rowStr.includes("重要行事") ||
        rowStr.includes("機器人研究社") ||
        rowStr.includes("學年度行事曆")
      ) {
        return true;
      }
      // 檢查第 5/6 列附近的欄位配置：J欄月、K欄日、L欄星期、M欄活動
      if (row[12] && String(row[12]).includes("行事")) return true;
      if (row[10] && String(row[10]).includes("日") && row[11] && String(row[11]).includes("星期")) {
        return true;
      }
    }
    return false;
  };

  /**
   * 專屬解析臺科大機器人研究社社曆格式：
   * A欄 (0): 民國年份 (文字不會在同一列，向下繼承)
   * B~I欄 (1~8): 月曆與週次 (B欄週次僅供月曆格參考，依日期比對日曆格推導所屬週次)
   * J欄 (9): 月份 (文字不會在同一列，向下繼承)
   * K欄 (10): 活動日期 (日或日期區間)
   * L欄 (11): 活動星期幾
   * M欄 (12): 重要行事 (活動名稱)
   * 第 5, 6 列為標題列，第 7 列 (index 6) 開始為資料列
   */
  const parseClubCalendarLayout = (
    rows: any[][],
    sem: string
  ): { rows: ParsedRow[]; detectedSemester?: string } => {
    let detectedRocYear: number | undefined = undefined;
    let detectedTerm: string | undefined = undefined;

    // 1. 從前幾列標題偵測學年度與學期
    for (let r = 0; r < Math.min(rows.length, 6); r++) {
      const rowStr = (rows[r] || []).map((c) => String(c || "")).join(" ");
      const yMatch = rowStr.match(/(\d{2,3})\s*學年度/);
      if (yMatch) {
        detectedRocYear = parseInt(yMatch[1], 10);
      }
      if (rowStr.includes("第一學期") || rowStr.includes("第1學期")) {
        detectedTerm = "1";
      } else if (rowStr.includes("第二學期") || rowStr.includes("第2學期")) {
        detectedTerm = "2";
      }
    }

    // 民國年份預設值
    let currentRocYear = detectedRocYear || 115;
    if (!detectedRocYear && sem) {
      const semMatch = sem.match(/(\d{2,3})/);
      if (semMatch) currentRocYear = parseInt(semMatch[1], 10);
    }

    const detectedSemester =
      detectedRocYear && detectedTerm ? `${detectedRocYear}-${detectedTerm}` : undefined;
    const activeSemester = detectedSemester || sem;

    // 2. 標題列偵測欄位索引（以預設 A=0, B=1, J=9, K=10, L=11, M=12 為基礎，動態微調）
    let colYear = 0;
    let colWeek = 1;
    let colMonth = 9;
    let colDay = 10;
    let colWeekday = 11;
    let colTitle = 12;

    for (let r = 3; r <= 6; r++) {
      const row = rows[r] || [];
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || "").trim();
        if (val.includes("重要行事") || val === "行事") colTitle = c;
        else if (val === "星期" || val === "星期幾") colWeekday = c;
        else if ((val === "日" || val === "日期") && c >= 9) colDay = c;
        else if ((val === "月" || val === "月份") && c >= 8) colMonth = c;
        else if (val.includes("週次") || val.includes("周次")) colWeek = c;
        else if (val === "年" || val.includes("民國")) colYear = c;
      }
    }

    // 3. 將列切分為月份區塊 (Month Blocks)
    // 在校曆/社曆排版中，每個月份為獨立連續列群組（區塊間有空行分隔）
    // 月份文字 (如 10、11) 往往印在該區塊中間列，同區塊內所有日曆格與活動必須共享該月份
    interface RowItem {
      r: number;
      row: any[];
    }
    interface MonthBlock {
      items: RowItem[];
      month?: number;
      rocYear?: number;
    }

    const blocks: MonthBlock[] = [];
    let currentBlockItems: RowItem[] = [];

    for (let r = 6; r < rows.length; r++) {
      const row = rows[r] || [];
      let hasData = false;
      for (let c = 0; c < row.length; c++) {
        if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== "") {
          hasData = true;
          break;
        }
      }

      if (hasData) {
        currentBlockItems.push({ r, row });
      } else {
        if (currentBlockItems.length > 0) {
          blocks.push({ items: currentBlockItems });
          currentBlockItems = [];
        }
      }
    }
    if (currentBlockItems.length > 0) {
      blocks.push({ items: currentBlockItems });
    }

    // 掃描各區塊內標註的月份與民國年份
    let lastMonth = 8;
    let lastRocYear = currentRocYear;

    for (const block of blocks) {
      for (const item of block.items) {
        // 年份欄
        const yVal = item.row[colYear];
        if (yVal !== undefined && yVal !== null && String(yVal).trim() !== "") {
          const yMatch = String(yVal).match(/(\d{2,3})/);
          if (yMatch) {
            const py = parseInt(yMatch[1], 10);
            if (py >= 90 && py <= 200) block.rocYear = py;
          }
        }
        // 月份欄
        const mVal = item.row[colMonth];
        if (mVal !== undefined && mVal !== null && String(mVal).trim() !== "") {
          const mMatch = String(mVal).match(/(\d{1,2})/);
          if (mMatch) {
            const pm = parseInt(mMatch[1], 10);
            if (pm >= 1 && pm <= 12) block.month = pm;
          }
        }
      }
    }

    // 依序連貫月份（若無標示則自動遞增，並處理 12 月跨入 1 月時年份進位）
    for (const block of blocks) {
      if (block.rocYear !== undefined) {
        lastRocYear = block.rocYear;
      } else {
        block.rocYear = lastRocYear;
      }

      if (block.month !== undefined) {
        if (lastMonth === 12 && block.month === 1) {
          lastRocYear += 1;
          block.rocYear = lastRocYear;
        }
        lastMonth = block.month;
      } else {
        const nextM = lastMonth === 12 ? 1 : lastMonth + 1;
        if (lastMonth === 12 && nextM === 1) {
          lastRocYear += 1;
          block.rocYear = lastRocYear;
        }
        lastMonth = nextM;
        block.month = nextM;
      }
    }

    // 4. 建立日曆格（B~I欄）日期與週次的對應映射
    const dateToWeekMap = new Map<string, number>();
    for (const block of blocks) {
      const bMonth = block.month!;
      for (const item of block.items) {
        const row = item.row;
        const wCell = row[colWeek];
        let rowWeek: number | undefined = undefined;
        if (wCell !== undefined && wCell !== null && String(wCell).trim() !== "") {
          const wMatch = String(wCell).match(/(\d{1,2})/);
          if (wMatch) rowWeek = parseInt(wMatch[1], 10);
        }

        if (rowWeek !== undefined) {
          for (let c = 2; c <= 8; c++) {
            const dayVal = row[c];
            if (dayVal !== undefined && dayVal !== null) {
              const dMatch = String(dayVal).trim().match(/^(\d{1,2})$/);
              if (dMatch) {
                const dayNum = parseInt(dMatch[1], 10);
                if (dayNum >= 1 && dayNum <= 31) {
                  dateToWeekMap.set(`${bMonth}-${dayNum}`, rowWeek);
                }
              }
            }
          }
        }
      }
    }

    // 5. 解析各月份區塊中的活動行事
    const result: ParsedRow[] = [];

    for (const block of blocks) {
      const curMonth = block.month!;
      const curRocYear = block.rocYear!;
      const currentWesternYear = curRocYear + 1911;

      for (const item of block.items) {
        const row = item.row;
        const rawTitle =
          row[colTitle] !== undefined && row[colTitle] !== null
            ? String(row[colTitle]).trim()
            : "";
        if (!rawTitle) continue;

        const rawDay =
          row[colDay] !== undefined && row[colDay] !== null
            ? String(row[colDay]).trim()
            : "";
        if (!rawDay) continue;

        // 解析日期（支援單日 e.g. 12 或區間 e.g. 20~24）
        let startDate = "";
        let endDate = "";
        let firstDayNum: number | undefined = undefined;

        const rangeMatch = rawDay.match(/^(\d{1,2})\s*[-~～至]\s*(\d{1,2})$/);
        if (rangeMatch) {
          firstDayNum = parseInt(rangeMatch[1], 10);
          const eDay = parseInt(rangeMatch[2], 10);
          const mStr = String(curMonth).padStart(2, "0");
          startDate = `${currentWesternYear}-${mStr}-${String(firstDayNum).padStart(2, "0")}`;
          endDate = `${currentWesternYear}-${mStr}-${String(eDay).padStart(2, "0")}`;
        } else {
          const singleMatch = rawDay.match(/^(\d{1,2})/);
          if (singleMatch) {
            firstDayNum = parseInt(singleMatch[1], 10);
            if (firstDayNum >= 1 && firstDayNum <= 31) {
              const mStr = String(curMonth).padStart(2, "0");
              startDate = `${currentWesternYear}-${mStr}-${String(firstDayNum).padStart(2, "0")}`;
              endDate = startDate;
            }
          }
        }

        if (!startDate) {
          const fallback = formatExcelDate(row[colDay]);
          if (fallback) {
            startDate = fallback;
            endDate = fallback;
          } else {
            continue;
          }
        }

        // 比對週次
        let weekNum: number | undefined = undefined;
        if (firstDayNum !== undefined && dateToWeekMap.has(`${curMonth}-${firstDayNum}`)) {
          weekNum = dateToWeekMap.get(`${curMonth}-${firstDayNum}`);
        }

        const category = detectCategory(rawTitle);

        result.push({
          selected: true,
          semester: activeSemester,
          title: rawTitle,
          category,
          startDate,
          endDate: endDate || startDate,
          week: weekNum,
          location: category === "course" || category === "activity" ? "研揚大樓 TR-516" : "",
        });
      }
    }

    return { rows: result, detectedSemester };
  };

  // 通用直式表格容錯解析（以標題文字搜尋欄位）
  const parseGenericLayout = (
    rows: any[][],
    sem: string
  ): { rows: ParsedRow[]; detectedSemester?: string } => {
    let headerIdx = -1;
    let colTitle = -1;
    let colDate = -1;
    let colEndDate = -1;
    let colWeek = -1;
    let colCategory = -1;
    let colLocation = -1;

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i] || [];
      for (let j = 0; j < row.length; j++) {
        const val = String(row[j] || "").trim();
        if (
          val.includes("事件名稱") ||
          val.includes("活動名稱") ||
          val.includes("項目") ||
          val.includes("摘要") ||
          val === "事件" ||
          val === "活動"
        ) {
          colTitle = j;
        }
        if (
          val.includes("開始日期") ||
          val.includes("起始日") ||
          val === "日期" ||
          val.includes("時間")
        ) {
          colDate = j;
        }
        if (val.includes("結束日期") || val.includes("截止日")) {
          colEndDate = j;
        }
        if (val.includes("週次") || val.includes("周次") || val === "週") {
          colWeek = j;
        }
        if (val.includes("類別") || val.includes("類型")) {
          colCategory = j;
        }
        if (val.includes("地點") || val.includes("備註") || val.includes("說明")) {
          colLocation = j;
        }
      }

      if (colTitle !== -1 && colDate !== -1) {
        headerIdx = i;
        break;
      }
    }

    if (colTitle === -1 || colDate === -1) {
      colTitle = 0;
      colDate = 1;
      headerIdx = 0;
    }

    const result: ParsedRow[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawTitle = String(row[colTitle] || "").trim();
      const rawDate = row[colDate];
      if (!rawTitle || rawDate === undefined || rawDate === null || rawDate === "") {
        continue;
      }

      const formattedStartDate = formatExcelDate(rawDate);
      if (!formattedStartDate) continue;

      let formattedEndDate = formattedStartDate;
      if (colEndDate !== -1 && row[colEndDate]) {
        formattedEndDate = formatExcelDate(row[colEndDate]) || formattedStartDate;
      }

      let weekNum: number | undefined = undefined;
      if (colWeek !== -1 && row[colWeek]) {
        const wStr = String(row[colWeek]).replace(/[^\d]/g, "");
        if (wStr) weekNum = parseInt(wStr, 10);
      }

      let category: CalendarCategory = detectCategory(rawTitle);
      if (colCategory !== -1 && row[colCategory]) {
        const catStr = String(row[colCategory]);
        if (catStr.includes("課")) category = "course";
        else if (catStr.includes("活動")) category = "activity";
        else if (catStr.includes("假")) category = "holiday";
        else if (catStr.includes("考")) category = "exam";
      }

      let loc = "";
      if (colLocation !== -1 && row[colLocation]) {
        loc = String(row[colLocation]).trim();
      } else if (category === "course" || category === "activity") {
        loc = "研揚大樓 TR-516";
      }

      result.push({
        selected: true,
        semester: sem,
        title: rawTitle,
        category,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        week: weekNum,
        location: loc,
      });
    }

    return { rows: result };
  };

  // 日期格式統一轉為 YYYY-MM-DD
  const formatExcelDate = (val: any): string | null => {
    if (typeof val === "number") {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }

    const str = String(val).trim();
    const isoMatch = str.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (isoMatch) {
      const y = isoMatch[1];
      const m = String(parseInt(isoMatch[2], 10)).padStart(2, "0");
      const d = String(parseInt(isoMatch[3], 10)).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    const rocMatch = str.match(/(\d{2,3})[./-](\d{1,2})[./-](\d{1,2})/);
    if (rocMatch) {
      const y = parseInt(rocMatch[1], 10) + 1911;
      const m = String(parseInt(rocMatch[2], 10)).padStart(2, "0");
      const d = String(parseInt(rocMatch[3], 10)).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    const shortMatch = str.match(/^(\d{1,2})[./-](\d{1,2})$/);
    if (shortMatch) {
      const curYear = new Date().getFullYear();
      const m = String(parseInt(shortMatch[1], 10)).padStart(2, "0");
      const d = String(parseInt(shortMatch[2], 10)).padStart(2, "0");
      return `${curYear}-${m}-${d}`;
    }

    return null;
  };

  const toggleRowSelect = (index: number) => {
    setParsedRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  };

  const toggleSelectAll = (select: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  const updateRowCategory = (index: number, cat: CalendarCategory) => {
    setParsedRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, category: cat } : r))
    );
  };

  const handleImport = async () => {
    const toImport = parsedRows.filter((r) => r.selected);
    if (toImport.length === 0) {
      setError("請至少勾選一項要匯入的日程事件");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const payload = toImport.map((r) => ({
        semester: semester.trim(),
        title: r.title,
        category: r.category,
        startDate: r.startDate,
        endDate: r.endDate || r.startDate,
        week: r.week,
        location: r.location,
        status: "confirmed" as const,
        updatedAt: meetingDate.trim() || undefined,
      }));

      await onBatchImport(payload);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "批次匯入失敗，請稍後再試");
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = parsedRows.filter((r) => r.selected).length;

  const isDirty = open && parsedRows.length > 0 && !importing;
  const { confirmDiscard } = useUnsavedChangesWarning(isDirty, {
    message:
      "您有尚未匯入的行事曆資料，確定要放棄並關閉視窗嗎？\n\nAre you sure you want to discard your changes and close this window?",
  });

  const handleRequestClose = (nextOpen: boolean) => {
    if (!nextOpen && isDirty) {
      if (!confirmDiscard()) return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleRequestClose}>
      <DialogContent className="w-[95vw] sm:max-w-[760px] max-h-[90vh] flex flex-col p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
            匯入 Excel 行事曆
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            支援社團官方 Excel 社曆格式自動解析（包含 A:年份、J:月份、K:日期、M:重要行事），社課與活動預設地點帶入 研揚大樓 TR-516
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 flex-1 overflow-y-auto pr-1">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 學期設定、會議時間與檔案選擇 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="import-semester" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                匯入學期
              </Label>
              <Input
                id="import-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="例如 115-1"
                className="h-9 text-xs rounded-lg font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="import-meeting-date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                會議時間
              </Label>
              <Input
                id="import-meeting-date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                placeholder="例如 115.08.13"
                className="h-9 text-xs rounded-lg font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="excel-file-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                選擇 Excel 試算表檔案
              </Label>
              <Input
                id="excel-file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="h-9 text-xs rounded-lg file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-100 dark:file:bg-white/10 file:text-slate-800 dark:file:text-white file:font-semibold cursor-pointer"
              />
            </div>
          </div>

          {parsing && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-[#ffc000]" />
              <p className="text-xs font-mono">正在自動比對社曆欄位與日程資料…</p>
            </div>
          )}

          {/* 解析後的預覽列表 */}
          {!parsing && parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">
                    已辨識出 {parsedRows.length} 筆活動日程
                  </span>
                  <span className="text-amber-600 font-mono font-semibold">
                    (已選取 {selectedCount} 筆)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSelectAll(true)}
                    className="h-7 text-xs text-slate-600 hover:text-slate-900"
                  >
                    全選
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSelectAll(false)}
                    className="h-7 text-xs text-slate-400 hover:text-slate-900"
                  >
                    全不選
                  </Button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[560px]">
                    <thead className="bg-muted/50 text-slate-600 sticky top-0 border-b border-slate-200 z-10 backdrop-blur-md">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">選取</th>
                        <th className="py-2.5 px-2 w-14 text-center">週次</th>
                        <th className="py-2.5 px-3 w-28">開始日期</th>
                        <th className="py-2.5 px-3 w-28">結束日期</th>
                        <th className="py-2.5 px-3">活動名稱</th>
                        <th className="py-2.5 px-3 w-32">類別</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 transition-colors ${
                            row.selected ? "bg-white" : "opacity-40"
                          }`}
                        >
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={() => toggleRowSelect(idx)}
                              aria-label={`選取活動 ${row.title}`}
                              className="rounded border-slate-300 text-[#ffc000] focus:ring-[#ffc000] cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-slate-500 tabular-nums">
                            {row.week ? `W${row.week}` : "—"}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                            {row.startDate}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                            {row.endDate !== row.startDate ? row.endDate : "同開始"}
                          </td>
                          <td
                            className="py-2 px-3 font-medium text-slate-900 truncate max-w-[200px]"
                            title={row.title}
                          >
                            {row.title}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={row.category === "exam" ? "holiday" : row.category}
                              onChange={(e) =>
                                updateRowCategory(idx, e.target.value as CalendarCategory)
                              }
                              aria-label={`調整活動 ${row.title} 的類別`}
                              className="h-7 text-xs bg-white dark:bg-[#1a1820] border border-slate-200 dark:border-white/10 rounded-md px-2 py-0.5 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#ffc000] hover:border-slate-300 transition-colors w-full min-w-[110px]"
                            >
                              {STANDARD_CALENDAR_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRequestClose(false)}
            className="w-full sm:w-auto rounded-lg text-xs"
          >
            關閉
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={importing || selectedCount === 0}
            onClick={handleImport}
            className="w-full sm:w-auto bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold rounded-lg text-xs gap-1.5 cursor-pointer shadow-xs"
          >
            {importing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            匯入已選取之 {selectedCount} 筆日程
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
