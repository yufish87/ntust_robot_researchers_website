import { proxyToGas } from "@/lib/api/gas-server";
import { NextRequest, NextResponse } from "next/server";
import { CalendarEvent } from "@/types/calendar";

/**
 * 格式化為 iCalendar 專用日期格式 (全天事件 YYYYMMDD)
 */
function formatIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

/**
 * 計算結束隔天（iCal 全天事件的 DTEND 是 exclusive 的）
 */
function getIcsEndDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * 跳脫 iCalendar 字元
 */
function escapeIcsText(str: string): string {
  return (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(request: NextRequest) {
  try {
    const gasResponse = await proxyToGas(request, "calendar/list");
    const json = await gasResponse.json();

    const events: CalendarEvent[] = (json && json.data) ? json.data : [];
    const semester = request.nextUrl.searchParams.get("semester") || "NTUST RRC";

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//NTUST Robot Researchers Club//Calendar System//ZH-TW",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:臺科大機器人研究社行事曆 (${escapeIcsText(semester)})`,
      "X-WR-TIMEZONE:Asia/Taipei",
    ];

    const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    for (const evt of events) {
      if (!evt.startDate) continue;
      const dtStart = formatIcsDate(evt.startDate);
      const dtEnd = evt.endDate ? getIcsEndDate(evt.endDate) : getIcsEndDate(evt.startDate);

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${evt.id}@ntust-robotresearchers.club`);
      lines.push(`DTSTAMP:${now}`);
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      const prefix = "臺科大機器人研究社";
      const fullTitle = evt.title.startsWith(prefix) ? evt.title : `${prefix} ${evt.title}`;
      lines.push(`SUMMARY:${escapeIcsText(fullTitle)}`);

      const desc = [
        evt.week ? `週次：第 ${evt.week} 週` : "",
        evt.category ? `類別：${evt.category}` : "",
        evt.status === "tentative" ? "狀態：[暫定]" : "",
        evt.location ? `地點/備註：${evt.location}` : ""
      ].filter(Boolean).join("\\n");

      if (desc) {
        lines.push(`DESCRIPTION:${desc}`);
      }

      const eventLocation =
        evt.location ||
        (evt.category === "course" || evt.category === "activity"
          ? "國立臺灣科技大學 TR-516"
          : "");
      if (eventLocation) {
        lines.push(`LOCATION:${escapeIcsText(eventLocation)}`);
      }

      lines.push("STATUS:CONFIRMED");
      lines.push("TRANSP:TRANSPARENT");
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    const icsContent = lines.join("\r\n");

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="ntust_rrc_calendar_${semester}.ics"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to generate ICS", error: err.message },
      { status: 500 }
    );
  }
}
