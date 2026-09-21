import ExcelJS from "exceljs";
import { CalendarEvent } from "@/types/calendar";
import { CALENDAR_CATEGORY_CONFIG, getWeekdayName } from "@/config/calendar";
export { getMeetingApprovalText } from "@/lib/calendar-utils";
import { getMeetingApprovalText } from "@/lib/calendar-utils";

// 產生日曆月曆格陣列 (週日到週六)
function generateMonthlyGrid(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks: (number | null)[][] = [];
  let currentWeek = new Array(7).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = new Date(year, month - 1, day).getDay();
    currentWeek[weekday] = day;
    if (weekday === 6 || day === daysInMonth) {
      weeks.push([...currentWeek]);
      currentWeek = new Array(7).fill(null);
    }
  }
  return weeks;
}

/**
 * 依日程類別與標題判斷公版 Excel 印刷色彩配置
 */
function getEventColorStyle(evt?: CalendarEvent) {
  if (!evt) return { type: "none", fill: null, fontColor: "FF000000", isRed: false, isExam: false };
  const t = evt.title;
  const cat = evt.category;

  // 1. 期中/期末考週、停課一週 -> 鮮紅底白字
  if (t.includes("停課") || t.includes("期中考") || t.includes("期末考")) {
    return {
      type: "exam",
      fill: "FFC00000",
      fontColor: "FFFFFFFF",
      isRed: true,
      isExam: true,
    };
  }

  // 2. 國定假日 / 放假日 / 彈性補假 / 紀念日 -> 紅字
  if (
    cat === "holiday" ||
    cat === "exam" ||
    t.includes("放假") ||
    t.includes("補假") ||
    t.includes("紀念日") ||
    t.includes("連假")
  ) {
    return {
      type: "holiday",
      fill: null,
      fontColor: "FFC00000",
      isRed: true,
      isExam: false,
    };
  }

  // 3. 社團博覽會 / 特別活動 -> 亮黃底黑字
  if (t.includes("博覽會") || t.includes("迎新活動")) {
    return {
      type: "expo",
      fill: "FFFFFF00",
      fontColor: "FF000000",
      isRed: false,
      isExam: false,
    };
  }

  // 4. 工作坊 (Arduino 工作坊等) -> 淺藍底黑字
  if (t.includes("工作坊") || t.includes("workshop") || t.includes("Arduino")) {
    return {
      type: "workshop",
      fill: "FFBDD7EE",
      fontColor: "FF000000",
      isRed: false,
      isExam: false,
    };
  }

  // 5. 社內競賽 / 賽事 -> 淺蜜桃/橘底黑字
  if (t.includes("競賽") || t.includes("比賽")) {
    return {
      type: "competition",
      fill: "FFFCE4D6",
      fontColor: "FF000000",
      isRed: false,
      isExam: false,
    };
  }

  // 6. 一般社課 (Python, 2D/3D繪圖, 雷切實操等) -> 淺綠底黑字
  if (
    cat === "course" ||
    t.includes("社課") ||
    t.includes("繪圖") ||
    t.includes("入門") ||
    t.includes("架設") ||
    t.includes("辨識") ||
    t.includes("雷切")
  ) {
    return {
      type: "course",
      fill: "FFE2F0D9",
      fontColor: "FF000000",
      isRed: false,
      isExam: false,
    };
  }

  return { type: "normal", fill: null, fontColor: "FF000000", isRed: false, isExam: false };
}

// getMeetingApprovalText 已移至 @/lib/calendar-utils 以避免 exceljs 洩漏

export interface ExportOfficialCalendarExcelParams {
  events: CalendarEvent[];
  semester: string;
}

/**
 * 匯出與官方校曆 PDF 完全一致的 Excel 社曆檔案
 */
export async function exportOfficialCalendarExcel({
  events,
  semester,
}: ExportOfficialCalendarExcelParams): Promise<void> {
  const sem = semester === "all" ? "115-1" : semester;
  const semMatch = sem.match(/^(\d{2,3})-(\d)$/);
  const rocYear = semMatch ? parseInt(semMatch[1], 10) : 115;
  const term = semMatch ? semMatch[2] : "1";
  const startGregYear = rocYear + 1911;

  const fileName = `臺科大機器人研究社_社團行事曆_${sem}.xlsx`;

  // 定義學期月份
  const monthConfigs =
    term === "1"
      ? [
          { y: startGregYear, m: 9 },
          { y: startGregYear, m: 10 },
          { y: startGregYear, m: 11 },
          { y: startGregYear, m: 12 },
        ]
      : [
          { y: startGregYear + 1, m: 2 },
          { y: startGregYear + 1, m: 3 },
          { y: startGregYear + 1, m: 4 },
          { y: startGregYear + 1, m: 5 },
          { y: startGregYear + 1, m: 6 },
        ];

  // 依開始日期正序排序事件
  const sortedEvents = [...events].sort((a, b) =>
    (a.startDate || "").localeCompare(b.startDate || "")
  );

  // 按月份分組事件
  const eventsByMonth = new Map<number, CalendarEvent[]>();
  for (const evt of sortedEvents) {
    if (!evt.startDate) continue;
    const d = new Date(evt.startDate);
    const m = d.getMonth() + 1;
    if (!eventsByMonth.has(m)) eventsByMonth.set(m, []);
    eventsByMonth.get(m)!.push(evt);
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "臺科大機器人研究社";
  wb.created = new Date();

  // 工作表 1：官方公版校曆月曆對照表
  const ws = wb.addWorksheet(String(rocYear), {
    views: [{ showGridLines: true }],
  });

  // 設定欄位寬度 (在 Excel 顯示: A=5.5, B~L=3.5, M=46.75；ExcelJS 加上字元邊界差額 0.625)
  ws.columns = [
    { key: "year", width: 5.5 },
    { key: "week", width: 4.125 }, // Excel 顯示為 3.5
    { key: "sun", width: 4.125 },
    { key: "mon", width: 4.125 },
    { key: "tue", width: 4.125 },
    { key: "wed", width: 4.125 },
    { key: "thu", width: 4.125 },
    { key: "fri", width: 4.125 },
    { key: "sat", width: 4.125 },
    { key: "month", width: 4.125 },
    { key: "day", width: 4.125 },
    { key: "weekday", width: 4.125 },
    { key: "title", width: 47.375 }, // Excel 顯示為 46.75
  ];

  // 頂部橫幅 (Row 1): B1~L1 合併放置 Logo，M1 置中放置學年度行事曆標題 (列高 60)
  ws.getRow(1).height = 60;
  ws.mergeCells("B1:L1");

  const darkFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF333333" },
  };

  for (let c = 1; c <= 13; c++) {
    ws.getCell(1, c).fill = darkFill;
  }

  // 載入機器人研究社 Logo (/image/Bar_Logo_Yellow.png) 至 B1~L1 合併儲存格內，並設定鎖定儲存格
  // 規格：高度 1.52 公分 (57.45 px / 547,200 EMUs)、寬度 6.05 公分 (228.66 px / 2,178,000 EMUs)
  try {
    let imgBuffer: ArrayBuffer | null = null;
    if (typeof window !== "undefined") {
      const res = await fetch("/image/Bar_Logo_Yellow.png");
      if (res.ok) imgBuffer = await res.arrayBuffer();
    } else {
      const fs = require("fs");
      const path = require("path");
      const p = path.join(process.cwd(), "public", "image", "Bar_Logo_Yellow.png");
      if (fs.existsSync(p)) {
        imgBuffer = fs.readFileSync(p);
      }
    }

    if (imgBuffer) {
      const imgId = wb.addImage({
        buffer: imgBuffer,
        extension: "png",
      });
      // 精準設定尺寸：寬度 6.05 cm (228.66 px)、高度 1.52 cm (57.45 px)，置中鎖定 (editAs: 'oneCell')
      ws.addImage(imgId, {
        tl: { col: 2.15, row: 0.14 },
        ext: { width: 228.66, height: 57.45 },
        editAs: "oneCell",
      } as any);
    }
  } catch (err) {
    console.warn("無法載入 Bar_Logo_Yellow.png，將以文字代替：", err);
    const logoCell = ws.getCell("B1");
    logoCell.value = "臺科大 機器人研究社 Robot Researchers";
    logoCell.font = { name: "Microsoft JhengHei", size: 14, bold: true, color: { argb: "FFFFC000" } };
    logoCell.alignment = { vertical: "middle", horizontal: "center" };
  }

  // M1: "XXX-X 學年度行事曆" (上下置中、左右置中)
  const titleCell = ws.getCell("M1");
  titleCell.value = `${sem} 學年度行事曆`;
  titleCell.font = {
    name: "Microsoft JhengHei",
    size: 18,
    bold: true,
    color: { argb: "FFFFC000" },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  // 橫幅下方結構：會議通過文字移至 M2，並調整 Row 2/3/4 列高
  const meetingText = getMeetingApprovalText(events, sem, rocYear);
  ws.getRow(2).height = 16;
  const noteCell = ws.getCell("M2");
  noteCell.value = meetingText;
  noteCell.font = {
    name: "Microsoft JhengHei",
    size: 9,
    color: { argb: "FF000000" },
  };
  noteCell.alignment = { vertical: "middle", horizontal: "right" };

  ws.getRow(3).height = 8;
  ws.getRow(4).height = 8;

  // 表格邊框規格
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
  };

  // 表頭（第 5, 6 列，列高 19.95）
  ws.getRow(5).height = 19.95;
  ws.getRow(6).height = 19.95;

  ws.mergeCells("A5:A6");
  ws.getCell("A5").value = "年";

  ws.getCell("B5").value = "週";
  ws.getCell("B6").value = "次";

  ws.mergeCells("C5:I5");
  ws.getCell("C5").value = "月           曆";

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  weekdays.forEach((w, idx) => {
    const c = ws.getCell(6, 3 + idx);
    c.value = w;
    if (idx === 0 || idx === 6) {
      c.font = { name: "Microsoft JhengHei", bold: true, color: { argb: "FFC00000" } };
    }
  });

  ws.getCell("J5").value = "日";
  ws.getCell("J6").value = "月";

  ws.getCell("K5").value = "期";
  ws.getCell("K6").value = "日";

  ws.getCell("L5").value = "星";
  ws.getCell("L6").value = "期";

  ws.mergeCells("M5:M6");
  ws.getCell("M5").value = "重    要    行    事";

  for (let r = 5; r <= 6; r++) {
    for (let c = 1; c <= 13; c++) {
      const cell = ws.getCell(r, c);
      cell.border = {
        ...thinBorder,
        bottom: r === 6 ? { style: "medium", color: { argb: "FF000000" } } : thinBorder.bottom,
      };
      if (!cell.font) {
        cell.font = { name: "Microsoft JhengHei", bold: true, size: 10 };
      }
      if (!cell.alignment) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
    }
  }

  // 依官方校曆規格精準消除指定二字中間框線：
  // 1. 直向「週」「次」(B5, B6) 二字中間無橫向框線
  ws.getCell("B5").border = {
    top: thinBorder.top,
    left: thinBorder.left,
    right: thinBorder.right,
  };
  ws.getCell("B6").border = {
    bottom: { style: "medium", color: { argb: "FF000000" } },
    left: thinBorder.left,
    right: thinBorder.right,
  };

  // 2. 橫向「日」「期」(J5, K5) 二字中間無垂直框線
  ws.getCell("J5").border = {
    top: thinBorder.top,
    bottom: thinBorder.bottom,
    left: thinBorder.left,
  };
  ws.getCell("K5").border = {
    top: thinBorder.top,
    bottom: thinBorder.bottom,
    right: thinBorder.right,
  };

  // 3. 直向「星」「期」(L5, L6) 二字中間無橫向框線
  ws.getCell("L5").border = {
    top: thinBorder.top,
    left: thinBorder.left,
    right: thinBorder.right,
  };
  ws.getCell("L6").border = {
    bottom: { style: "medium", color: { argb: "FF000000" } },
    left: thinBorder.left,
    right: thinBorder.right,
  };

  // 繪製各月資料列 (第 7 列開始，列高 19.95)
  let currentRow = 7;
  const semesterStartRow = 7;

  monthConfigs.forEach(({ y, m }, monthIdx) => {
    const gridWeeks = generateMonthlyGrid(y, m);
    const monthEvents = eventsByMonth.get(m) || [];
    const rowCount = Math.max(gridWeeks.length, monthEvents.length);
    const monthStartRow = currentRow;

    for (let rIdx = 0; rIdx < rowCount; rIdx++) {
      const r = currentRow;
      ws.getRow(r).height = 20;

      const hasGridWeek = rIdx < gridWeeks.length;
      const weekDays = hasGridWeek
        ? gridWeeks[rIdx]
        : [null, null, null, null, null, null, null];
      const evt = rIdx < monthEvents.length ? monthEvents[rIdx] : undefined;
      const evtStyle = getEventColorStyle(evt);

      // 週次計算
      let weekNum = "";
      if (term === "1") {
        if (monthIdx === 0) {
          if (rIdx === 1) weekNum = "1";
          else if (rIdx === 2) weekNum = "2";
          else if (rIdx === 3) weekNum = "3";
          else if (rIdx === 4) weekNum = "4";
        } else if (monthIdx === 1) {
          if (rIdx === 1) weekNum = "4";
          else if (rIdx === 2) weekNum = "5";
          else if (rIdx === 3) weekNum = "6";
          else if (rIdx === 4) weekNum = "7";
          else if (rIdx === 5) weekNum = "8";
        } else if (monthIdx === 2) {
          if (rIdx === 0) weekNum = "9";
          else if (rIdx === 1) weekNum = "10";
          else if (rIdx === 2) weekNum = "11";
          else if (rIdx === 3) weekNum = "12";
          else if (rIdx === 4) weekNum = "13";
        } else if (monthIdx === 3) {
          if (rIdx === 0) weekNum = "13";
          else if (rIdx === 1) weekNum = "14";
          else if (rIdx === 2) weekNum = "15";
          else if (rIdx === 3) weekNum = "16";
        }
      } else {
        const baseWeek = monthIdx * 4 + rIdx;
        if (baseWeek >= 1 && baseWeek <= 18) weekNum = String(baseWeek);
      }

      const isLastRowInMonth = rIdx === rowCount - 1;

      // 預先設定全列薄邊框 (最後一列底部為 medium 粗黑邊框)
      for (let c = 1; c <= 13; c++) {
        ws.getCell(r, c).border = {
          ...thinBorder,
          bottom: isLastRowInMonth
            ? { style: "medium", color: { argb: "FF000000" } }
            : thinBorder.bottom,
        };
      }

      // B 欄：週次
      const weekCell = ws.getCell(r, 2);
      weekCell.value = weekNum ? (isNaN(Number(weekNum)) ? weekNum : Number(weekNum)) : "";
      weekCell.font = { name: "Microsoft JhengHei", bold: true, size: 9 };
      weekCell.alignment = { vertical: "middle", horizontal: "center" };

      // C~I 欄：日曆格
      weekDays.forEach((dayNum, dayIdx) => {
        const cell = ws.getCell(r, 3 + dayIdx);
        if (dayNum !== null) {
          cell.value = dayNum;

          const isWeekend = dayIdx === 0 || dayIdx === 6;
          const matchingEvt = monthEvents.find((e) => {
            if (!e.startDate) return false;
            return new Date(e.startDate).getDate() === dayNum;
          });
          const matchStyle = getEventColorStyle(matchingEvt);

          if (matchStyle.fill) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: matchStyle.fill },
            };
            cell.font = {
              name: "Microsoft JhengHei",
              bold: true,
              size: 9,
              color: { argb: matchStyle.fontColor },
            };
          } else if (matchStyle.isRed || isWeekend) {
            cell.font = {
              name: "Microsoft JhengHei",
              bold: true,
              size: 9,
              color: { argb: "FFC00000" },
            };
          } else {
            cell.font = { name: "Microsoft JhengHei", size: 9 };
          }
        }
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      // K 欄：活動日
      const dayCell = ws.getCell(r, 11);
      if (evt) {
        const d = new Date(evt.startDate);
        dayCell.value = d.getDate();
        if (evtStyle.fill) {
          dayCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: evtStyle.fill },
          };
          dayCell.font = {
            name: "Microsoft JhengHei",
            bold: true,
            size: 9,
            color: { argb: evtStyle.fontColor },
          };
        } else if (evtStyle.isRed) {
          dayCell.font = {
            name: "Microsoft JhengHei",
            bold: true,
            size: 9,
            color: { argb: "FFC00000" },
          };
        } else {
          dayCell.font = { name: "Microsoft JhengHei", bold: true, size: 9 };
        }
      }
      dayCell.alignment = { vertical: "middle", horizontal: "center" };

      // L 欄：星期
      const weekdayCell = ws.getCell(r, 12);
      if (evt) {
        const d = new Date(evt.startDate);
        const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];
        weekdayCell.value = weekdayNames[d.getDay()] || "";
        weekdayCell.font = {
          name: "Microsoft JhengHei",
          bold: true,
          size: 9,
          color: { argb: evtStyle.isRed ? "FFC00000" : "FF000000" },
        };
      }
      weekdayCell.alignment = { vertical: "middle", horizontal: "center" };

      // M 欄：重要行事
      const titleColCell = ws.getCell(r, 13);
      if (evt) {
        titleColCell.value = evt.title;
        titleColCell.font = {
          name: "Microsoft JhengHei",
          bold: true,
          size: 9.5,
          color: { argb: evtStyle.isRed ? "FFC00000" : "FF000000" },
        };
      }
      titleColCell.alignment = { vertical: "middle", horizontal: "left" };

      currentRow++;
    }

    // J 欄：月份單一合併
    const monthLastRow = currentRow - 1;
    ws.mergeCells(`J${monthStartRow}:J${monthLastRow}`);
    const monthCell = ws.getCell(`J${monthStartRow}`);
    monthCell.value = `${m}\n月`;
    monthCell.font = { name: "Microsoft JhengHei", bold: true, size: 10 };
    monthCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

    // 確保每個月分底線（B~M 欄，包含 J 欄月份底線）為粗體 (medium 粗黑線)
    for (let c = 2; c <= 13; c++) {
      const cell = ws.getCell(monthLastRow, c);
      cell.border = {
        top: cell.border?.top || { style: "thin", color: { argb: "FF000000" } },
        left: cell.border?.left || { style: "thin", color: { argb: "FF000000" } },
        right: cell.border?.right || { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "medium", color: { argb: "FF000000" } },
      };
    }
  });

  // A 欄：年份單一合併到底
  const semesterEndRow = currentRow - 1;
  ws.mergeCells(`A${semesterStartRow}:A${semesterEndRow}`);
  const yearCell = ws.getCell(`A${semesterStartRow}`);
  yearCell.value = `${rocYear}\n年`;
  yearCell.font = { name: "Microsoft JhengHei", bold: true, size: 11 };
  yearCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

  // 確保全表最底列 (包含 A 欄) 底線均為 medium 粗黑線
  for (let c = 1; c <= 13; c++) {
    const cell = ws.getCell(semesterEndRow, c);
    cell.border = {
      ...cell.border,
      bottom: { style: "medium", color: { argb: "FF000000" } },
    };
  }

  // 工作表 2：日程明細總表 (便於查詢、篩選與批次編輯)
  if (sortedEvents.length > 0) {
    const wsDetail = wb.addWorksheet("日程明細總表");
    wsDetail.columns = [
      { header: "學年學期", key: "semester", width: 12 },
      { header: "週次", key: "week", width: 8 },
      { header: "開始日期", key: "startDate", width: 14 },
      { header: "結束日期", key: "endDate", width: 14 },
      { header: "星期", key: "weekday", width: 8 },
      { header: "重要行事 (活動名稱)", key: "title", width: 34 },
      { header: "類別", key: "category", width: 16 },
      { header: "地點", key: "location", width: 22 },
      { header: "確認狀態", key: "status", width: 12 },
    ];

    // 表頭樣式
    const headerRow = wsDetail.getRow(1);
    headerRow.height = 24;
    headerRow.font = { name: "Microsoft JhengHei", bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF34313C" },
    };

    sortedEvents.forEach((evt) => {
      wsDetail.addRow({
        semester: evt.semester || sem,
        week: evt.week ? `W${evt.week}` : "",
        startDate: evt.startDate,
        endDate: evt.endDate || evt.startDate,
        weekday: getWeekdayName(evt.startDate),
        title: evt.title,
        category: CALENDAR_CATEGORY_CONFIG[evt.category]?.label || evt.category,
        location: evt.location || (evt.category === "course" || evt.category === "activity" ? "TR-516" : ""),
        status: evt.status === "confirmed" ? "已確認" : "草稿/待確認",
      });
    });

    wsDetail.views = [{ showGridLines: true }];
  }

  // 產出 buffer 並透過瀏覽器觸發下載
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
