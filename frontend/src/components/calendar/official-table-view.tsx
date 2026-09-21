"use client";

import React, { useMemo } from "react";
import { CalendarEvent } from "@/types/calendar";
import { getMeetingApprovalText } from "@/lib/calendar-utils";
import { getCurrentSemester } from "@/config/calendar";

interface OfficialTableViewProps {
  events: CalendarEvent[];
  selectedSemester?: string;
  onSelectEvent?: (event: CalendarEvent) => void;
}

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
 * 依日程類別與標題判斷公版印刷色系 (精準還原社團官方 115-1 校曆對照配色)
 */
function getEventColorStyle(evt?: CalendarEvent) {
  if (!evt) {
    return {
      type: "none",
      gridBg: "",
      dateBg: "",
      isRedText: false,
      isExam: false,
      inlineBg: "",
      inlineColor: "",
    };
  }
  const t = evt.title;
  const cat = evt.category;

  // 1. 期中/期末考週、停課一週 -> 鮮紅底白字 (表格月曆格與日期欄皆紅底白字)
  if (
    t.includes("停課") ||
    t.includes("期中考") ||
    t.includes("期末考")
  ) {
    return {
      type: "exam",
      gridBg: "bg-[#c00000] text-white font-bold",
      dateBg: "bg-[#c00000] text-white font-bold",
      isRedText: true,
      isExam: true,
      inlineBg: "#c00000",
      inlineColor: "#ffffff",
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
      gridBg: "",
      dateBg: "",
      isRedText: true,
      isExam: false,
      inlineBg: "",
      inlineColor: "#c00000",
    };
  }

  // 3. 社團博覽會 / 特別活動 -> 亮黃底黑字
  if (t.includes("博覽會") || t.includes("迎新活動")) {
    return {
      type: "expo",
      gridBg: "bg-[#ffff00] text-black font-bold",
      dateBg: "bg-[#ffff00] text-black font-bold",
      isRedText: false,
      isExam: false,
      inlineBg: "#ffff00",
      inlineColor: "#000000",
    };
  }

  // 4. 工作坊 (Arduino 工作坊等) -> 淺藍底黑字
  if (t.includes("工作坊") || t.includes("workshop") || t.includes("Arduino")) {
    return {
      type: "workshop",
      gridBg: "bg-[#bdd7ee] text-black font-bold",
      dateBg: "bg-[#bdd7ee] text-black font-bold",
      isRedText: false,
      isExam: false,
      inlineBg: "#bdd7ee",
      inlineColor: "#000000",
    };
  }

  // 5. 社內競賽 / 賽事 -> 淺蜜桃/橘底黑字
  if (t.includes("競賽") || t.includes("比賽")) {
    return {
      type: "competition",
      gridBg: "bg-[#fce4d6] text-black font-bold",
      dateBg: "bg-[#fce4d6] text-black font-bold",
      isRedText: false,
      isExam: false,
      inlineBg: "#fce4d6",
      inlineColor: "#000000",
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
      gridBg: "bg-[#e2f0d9] text-black font-bold",
      dateBg: "bg-[#e2f0d9] text-black font-bold",
      isRedText: false,
      isExam: false,
      inlineBg: "#e2f0d9",
      inlineColor: "#000000",
    };
  }

  return {
    type: "normal",
    gridBg: "",
    dateBg: "",
    isRedText: false,
    isExam: false,
    inlineBg: "",
    inlineColor: "",
  };
}

export function OfficialTableView({
  events,
  selectedSemester,
}: OfficialTableViewProps) {
  // 解析學年度與學期 (若未指定或為 all 則自動偵測當前學期)
  const sem = (!selectedSemester || selectedSemester === "all") ? getCurrentSemester() : selectedSemester;
  const semMatch = sem.match(/^(\d{2,3})-(\d)$/);
  const rocYear = semMatch ? parseInt(semMatch[1], 10) : 115;
  const term = semMatch ? semMatch[2] : "1";
  const startGregYear = rocYear + 1911;

  // 定義學期月份 (第一學期 9~12 月與次年 1 月，第二學期 2~6 月)
  const monthConfigs = useMemo(() => {
    if (term === "1") {
      return [
        { y: startGregYear, m: 9 },
        { y: startGregYear, m: 10 },
        { y: startGregYear, m: 11 },
        { y: startGregYear, m: 12 },
      ];
    } else {
      return [
        { y: startGregYear + 1, m: 2 },
        { y: startGregYear + 1, m: 3 },
        { y: startGregYear + 1, m: 4 },
        { y: startGregYear + 1, m: 5 },
        { y: startGregYear + 1, m: 6 },
      ];
    }
  }, [startGregYear, term]);

  // 依開始日期正序排序事件
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) =>
      (a.startDate || "").localeCompare(b.startDate || "")
    );
  }, [events]);

  // 精確篩選屬於當前目標學期的事件（避免「所有學期」時混入其他學期資料）
  const targetEvents = useMemo(() => {
    return sortedEvents.filter((evt) => {
      if (evt.semester) return evt.semester === sem;
      if (!evt.startDate) return false;
      const parts = evt.startDate.split("-");
      const y = parseInt(parts[0], 10);
      return y === startGregYear || y === startGregYear + 1;
    });
  }, [sortedEvents, sem, startGregYear]);

  // 按月份分組事件 (直接依據字串 YYYY-MM-DD 切割，徹底杜絕瀏覽器本地或 UTC 時區偏差)
  const eventsByMonth = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const evt of targetEvents) {
      if (!evt.startDate) continue;
      const parts = evt.startDate.split("-");
      if (parts.length < 2) continue;
      const m = parseInt(parts[1], 10);
      if (!map.has(m)) map.set(m, []);
      map.get(m)!.push(evt);
    }
    return map;
  }, [targetEvents]);

  // 計算每個月份所需的列數以及全學期總列數 (使左側「年」欄位能單一合併到底)
  const monthRowCounts = useMemo(() => {
    return monthConfigs.map(({ y, m }) => {
      const gridWeeks = generateMonthlyGrid(y, m);
      const monthEvts = eventsByMonth.get(m) || [];
      return Math.max(gridWeeks.length, monthEvts.length);
    });
  }, [monthConfigs, eventsByMonth]);

  const totalSemesterRows = useMemo(() => {
    return monthRowCounts.reduce((acc, count) => acc + count, 0);
  }, [monthRowCounts]);

  const meetingText = useMemo(
    () => getMeetingApprovalText(events, sem, rocYear),
    [events, sem, rocYear]
  );

  return (
    <div
      className="w-full max-w-[880px] mx-auto bg-white text-black p-0 leading-tight select-text print:max-w-none print:w-full print:m-0 print:box-border print:p-[10mm]"
      style={{
        fontFamily: '"Microsoft JhengHei", "微軟正黑體", "Segoe UI", sans-serif',
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* 頂部 Header 橫幅：黑底金字，A 欄空白，B~L 欄(42.42%)合併置中 Logo，M 欄(51.52%)置中學年度行事曆 (完全依 Excel Row 1 列高 60 規格) */}
      <table className="w-full table-fixed border-collapse border-2 border-b-0 border-black select-text">
        <colgroup>
          <col style={{ width: "6.0606%" }} />
          <col style={{ width: "42.4237%" }} />
          <col style={{ width: "51.5152%" }} />
        </colgroup>
        <tbody>
          <tr className="bg-[#333333] h-[68px] print:h-[68px]">
            <td className="bg-[#333333] p-0"></td>
            <td className="bg-[#333333] text-center p-1">
              <div className="flex items-center justify-center h-full w-full">
                <img
                  src="/image/Bar_Logo_Yellow.png"
                  alt="臺科大機器人研究社"
                  style={{ width: "6.05cm", height: "1.52cm", maxHeight: "1.52cm" }}
                  className="object-contain max-w-full"
                />
              </div>
            </td>
            <td className="bg-[#333333] text-center p-1">
              <h1 className="text-xl sm:text-2xl font-bold text-[#ffc000] tracking-wider font-mono">
                {sem} 學年度行事曆
              </h1>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 橫幅下方小字：對齊 M 欄右側幹部會議通過 (對應 Excel 第 2 列 M2) */}
      <div className="flex justify-end items-center h-[22px] print:h-[22px] text-right text-xs text-black font-medium pr-1 select-text">
        {meetingText}
      </div>

      {/* 校曆標準月曆對照表格 (完全依 115-1 Excel: A=5.5, B~L=3.5, M=46.75) */}
      <table className="w-full table-fixed border-collapse border-2 border-black text-center text-xs select-text">
        <colgroup>
          <col style={{ width: "6.0606%" }} />
          <col style={{ width: "3.8567%" }} />
          <col style={{ width: "3.8567%" }} />
          <col style={{ width: "3.8567%" }} />
          <col style={{ width: "3.8567%" }} />
          <col style={{ width: "3.8567%" }} />
          <col style={{ width: "3.8567%" }} />
          <col style={{ width: "3.8567%" }} />
          <col style={{ width: "3.8567%" }} />
          <col style={{ width: "3.8567%" }} />
          <col style={{ width: "3.8567%" }} />
          <col style={{ width: "3.8567%" }} />
          <col style={{ width: "51.5152%" }} />
        </colgroup>
        <thead className="bg-white">
          <tr className="h-[28px] print:h-[28px]">
            {/* 年：跨 2 列，上下左右完整外框 */}
            <th rowSpan={2} className="border border-black py-0.5 font-bold text-xs sm:text-sm">
              年
            </th>

            {/* 週：直向「週次」上方，底部無邊框 (消除週與次中間框線) */}
            <th className="border border-black border-b-0 py-0.5 font-bold text-xs sm:text-sm">
              週
            </th>

            {/* 月曆：橫跨 7 欄，有底邊框 */}
            <th colSpan={7} className="border border-black py-0.5 font-bold text-xs sm:text-sm tracking-widest">
              月&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;曆
            </th>

            {/* 日：橫向「日期」左側，右側無邊框 (消除日與期中間框線) */}
            <th className="border border-black border-r-0 py-0.5 font-bold text-xs sm:text-sm">
              日
            </th>

            {/* 期：橫向「日期」右側，左側無邊框 (消除日與期中間框線) */}
            <th className="border border-black border-l-0 py-0.5 font-bold text-xs sm:text-sm">
              期
            </th>

            {/* 星：直向「星期」上方，底部無邊框 (消除星與期中間框線) */}
            <th className="border border-black border-b-0 py-0.5 font-bold text-xs sm:text-sm">
              星
            </th>

            {/* 重要行事：跨 2 列，上下左右完整外框 */}
            <th rowSpan={2} className="border border-black py-0.5 font-bold text-xs sm:text-sm tracking-widest">
              重&nbsp;&nbsp;&nbsp;&nbsp;要&nbsp;&nbsp;&nbsp;&nbsp;行&nbsp;&nbsp;&nbsp;&nbsp;事
            </th>
          </tr>
          <tr className="border-b-2 border-black h-[26px] print:h-[26px]">
            {/* 次：直向「週次」下方，頂部無邊框 (消除週與次中間框線) */}
            <th className="border border-black border-t-0 py-0.5 font-bold text-xs sm:text-sm">次</th>

            {/* 日~六：正常邊框 */}
            <th className="border border-black py-0.5 text-[#c00000] font-bold text-xs sm:text-sm">日</th>
            <th className="border border-black py-0.5 font-bold text-xs sm:text-sm">一</th>
            <th className="border border-black py-0.5 font-bold text-xs sm:text-sm">二</th>
            <th className="border border-black py-0.5 font-bold text-xs sm:text-sm">三</th>
            <th className="border border-black py-0.5 font-bold text-xs sm:text-sm">四</th>
            <th className="border border-black py-0.5 font-bold text-xs sm:text-sm">五</th>
            <th className="border border-black py-0.5 text-[#c00000] font-bold text-xs sm:text-sm">六</th>

            {/* 月：正常邊框 */}
            <th className="border border-black py-0.5 font-bold text-xs sm:text-sm">月</th>

            {/* 日：正常邊框 */}
            <th className="border border-black py-0.5 font-bold text-xs sm:text-sm">日</th>

            {/* 期：直向「星期」下方，頂部無邊框 (消除星與期中間框線) */}
            <th className="border border-black border-t-0 py-0.5 font-bold text-xs sm:text-sm">期</th>
          </tr>
        </thead>
        <tbody>
          {/* 各月份區塊 */}
          {monthConfigs.map(({ y, m }, monthIdx) => {
            const gridWeeks = generateMonthlyGrid(y, m);
            const monthEvents = eventsByMonth.get(m) || [];
            const rowCount = monthRowCounts[monthIdx];

            return (
              <React.Fragment key={`${y}-${m}`}>
                {Array.from({ length: rowCount }).map((_, rIdx) => {
                  const hasGridWeek = rIdx < gridWeeks.length;
                  const weekDays = hasGridWeek
                    ? gridWeeks[rIdx]
                    : [null, null, null, null, null, null, null];

                  const evt = rIdx < monthEvents.length ? monthEvents[rIdx] : undefined;

                  let evtDay = "";
                  let evtWeekday = "";
                  let evtTitle = "";
                  const evtStyle = getEventColorStyle(evt);

                  if (evt && evt.startDate) {
                    const parts = evt.startDate.split("-");
                    const yr = parseInt(parts[0], 10);
                    const mo = parseInt(parts[1], 10);
                    const da = parseInt(parts[2], 10);
                    evtDay = String(da);
                    // 依年月日建立本地日期以換算星期 (免受 ISO 跨時區干擾)
                    const d = new Date(yr, mo - 1, da);
                    const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];
                    evtWeekday = weekdayNames[d.getDay()] || "";
                    evtTitle = evt.title;
                  }

                  // 週次計算 (對齊官方校曆週次分布)
                  let weekNum = "";
                  if (term === "1") {
                    if (monthIdx === 0) {
                      // 9月: 第2列開始為 W1~W4
                      if (rIdx === 1) weekNum = "1";
                      else if (rIdx === 2) weekNum = "2";
                      else if (rIdx === 3) weekNum = "3";
                      else if (rIdx === 4) weekNum = "4";
                    } else if (monthIdx === 1) {
                      // 10月: W4~W8
                      if (rIdx === 1) weekNum = "4";
                      else if (rIdx === 2) weekNum = "5";
                      else if (rIdx === 3) weekNum = "6";
                      else if (rIdx === 4) weekNum = "7";
                      else if (rIdx === 5) weekNum = "8";
                    } else if (monthIdx === 2) {
                      // 11月: W9~W13
                      if (rIdx === 0) weekNum = "9";
                      else if (rIdx === 1) weekNum = "10";
                      else if (rIdx === 2) weekNum = "11";
                      else if (rIdx === 3) weekNum = "12";
                      else if (rIdx === 4) weekNum = "13";
                    } else if (monthIdx === 3) {
                      // 12月: W13~W16
                      if (rIdx === 0) weekNum = "13";
                      else if (rIdx === 1) weekNum = "14";
                      else if (rIdx === 2) weekNum = "15";
                      else if (rIdx === 3) weekNum = "16";
                    }
                  } else {
                    // 第二學期動態推算
                    const baseWeek = monthIdx * 4 + rIdx;
                    if (baseWeek >= 1 && baseWeek <= 18) {
                      weekNum = String(baseWeek);
                    }
                  }

                  // 是否為當月最後一列 (需繪製粗黑分隔線)
                  const isLastRowInMonth = rIdx === rowCount - 1;

                  return (
                    <tr
                      key={rIdx}
                      className={`h-[28px] sm:h-[30px] print:h-[30.5px] text-xs sm:text-[12.5px] print:text-[12.5px] select-text ${
                        isLastRowInMonth ? "border-b-2 border-black" : "border-b border-black"
                      }`}
                    >
                      {/* 年欄 (全表單一合併到底，置中顯示 民國年 與 「年」) */}
                      {monthIdx === 0 && rIdx === 0 && (
                        <td
                          rowSpan={totalSemesterRows}
                          className="border border-black font-bold text-xs sm:text-sm bg-white text-center align-middle select-text"
                        >
                          <div className="flex flex-col items-center justify-center gap-1 font-mono">
                            <span>{rocYear}</span>
                            <span>年</span>
                          </div>
                        </td>
                      )}

                      {/* 週次 */}
                      <td className="border border-black font-bold font-mono text-xs sm:text-[12.5px] select-text">
                        {weekNum}
                      </td>

                      {/* 日曆格 日~六 (C~I 欄) */}
                      {weekDays.map((dayNum, dayIdx) => {
                        if (!hasGridWeek || dayNum === null) {
                          return (
                            <td
                              key={dayIdx}
                              className="border border-black bg-white select-text"
                            />
                          );
                        }

                        const isWeekend = dayIdx === 0 || dayIdx === 6;

                        // 精準比對該日是否對應到事件 (純數字比對)
                        const matchingEvt = monthEvents.find((e) => {
                          if (!e.startDate) return false;
                          const parts = e.startDate.split("-");
                          if (parts.length < 3) return false;
                          return parseInt(parts[2], 10) === dayNum;
                        });

                        const matchingStyle = getEventColorStyle(matchingEvt);

                        let cellClass = "";
                        if (matchingStyle.gridBg) {
                          cellClass = matchingStyle.gridBg;
                        } else if (matchingStyle.isRedText || isWeekend) {
                          cellClass = "text-[#c00000] font-bold";
                        } else {
                          cellClass = "text-black font-medium";
                        }

                        return (
                          <td
                            key={dayIdx}
                            className={`border border-black font-mono text-xs sm:text-[12px] select-text ${cellClass}`}
                            style={
                              matchingStyle.inlineBg
                                ? {
                                    backgroundColor: matchingStyle.inlineBg,
                                    color: matchingStyle.inlineColor,
                                    WebkitPrintColorAdjust: "exact",
                                    printColorAdjust: "exact",
                                  }
                                : undefined
                            }
                          >
                            {dayNum}
                          </td>
                        );
                      })}

                      {/* 月份 J 欄 (當月單一合併，置中顯示數字與「月」) */}
                      {rIdx === 0 && (
                        <td
                          rowSpan={rowCount}
                          className="border border-black font-bold text-xs sm:text-sm bg-white text-center align-middle select-text"
                        >
                          <div className="flex flex-col items-center justify-center font-mono">
                            <span>{m}</span>
                            <span className="mt-0.5">月</span>
                          </div>
                        </td>
                      )}

                      {/* 日 K 欄 */}
                      <td
                        className={`border border-black font-mono text-center text-xs sm:text-[12.5px] select-text ${
                          evtStyle.dateBg
                            ? evtStyle.dateBg
                            : evtStyle.isRedText
                            ? "text-[#c00000] font-bold"
                            : "font-bold text-black"
                        }`}
                        style={
                          evtStyle.inlineBg
                            ? {
                                backgroundColor: evtStyle.inlineBg,
                                color: evtStyle.inlineColor,
                                WebkitPrintColorAdjust: "exact",
                                printColorAdjust: "exact",
                              }
                            : undefined
                        }
                      >
                        {evtDay}
                      </td>

                      {/* 星期 L 欄 */}
                      <td
                        className={`border border-black font-bold text-center text-xs sm:text-[12.5px] select-text ${
                          evtStyle.isRedText ? "text-[#c00000]" : "text-black"
                        }`}
                      >
                        {evtWeekday}
                      </td>

                      {/* 重要行事 M 欄 (不帶 title 屬性避免列印時原生 tooltip 遮蔽文字) */}
                      <td
                        className={`border border-black px-2.5 sm:px-3 text-left font-bold select-text text-xs sm:text-[12.5px] print:text-[12.5px] truncate ${
                          evtStyle.isRedText ? "text-[#c00000]" : "text-black"
                        }`}
                      >
                        {evtTitle ? (
                          evtTitle
                        ) : targetEvents.length === 0 && monthIdx === 0 && rIdx === 0 ? (
                          <span className="text-slate-400 font-normal italic select-text">
                            （此學期目前無排定日程或資料載入中）
                          </span>
                        ) : (
                          ""
                        )}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
