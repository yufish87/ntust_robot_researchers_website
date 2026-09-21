import { proxyToGas } from "@/lib/api/gas-server";
import { NextRequest, NextResponse } from "next/server";
import { CalendarEvent } from "@/types/calendar";

/**
 * 格式化日期 YYYYMMDD
 */
function cleanDate(dateStr: string): string {
  if (!dateStr) return "";
  const dateOnly = dateStr.split(/[T ]/)[0];
  return dateOnly.replace(/-/g, "");
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
      "BEGIN:VTIMEZONE",
      "TZID:Asia/Taipei",
      "X-LIC-LOCATION:Asia/Taipei",
      "BEGIN:STANDARD",
      "TZOFFSETFROM:+0800",
      "TZOFFSETTO:+0800",
      "TZNAME:CST",
      "DTSTART:19700101T000000",
      "END:STANDARD",
      "END:VTIMEZONE",
    ];

    const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    for (const evt of events) {
      if (!evt.startDate) continue;

      const isCourse = evt.category === "course";
      // 社課固定 19:00 - 21:00，其它活動預設 08:00 - 17:00
      const startTime = isCourse ? "190000" : "080000";
      const endTime = isCourse ? "210000" : "170000";

      const startClean = cleanDate(evt.startDate);
      const endClean = cleanDate(evt.endDate) || startClean;

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${evt.id}@ntust-robotresearchers.club`);
      lines.push(`DTSTAMP:${now}`);
      lines.push(`DTSTART;TZID=Asia/Taipei:${startClean}T${startTime}`);
      lines.push(`DTEND;TZID=Asia/Taipei:${endClean}T${endTime}`);
      const prefix = "臺科大機器人研究社";
      const fullTitle = evt.title.startsWith(prefix) ? evt.title : `${prefix} ${evt.title}`;
      lines.push(`SUMMARY:${escapeIcsText(fullTitle)}`);

      const desc = [
        evt.week ? `週次：第 ${evt.week} 週` : "",
        evt.category ? `類別：${isCourse ? "社課/工作坊" : evt.category}` : "",
        isCourse ? "時間：19:00 - 21:00" : "時間：08:00 - 17:00",
        evt.status === "tentative" ? "狀態：[暫定]" : "狀態：[已確認]",
        evt.location ? `地點/備註：${evt.location}` : "",
        evt.courseId ? "本活動有提供社課講義與教材，請至社團網站查閱" : "",
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
      lines.push("TRANSP:OPAQUE");
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
