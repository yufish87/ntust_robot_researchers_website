import { CalendarEvent } from "@/types/calendar";

/**
 * 解析動態會議通過文字："YYYY.MM.DD 115-1幹部會議通過"
 * 此函式獨立於 excel-calendar.ts，避免 exceljs 被 tree-shake 失敗洩漏到 client bundle
 */
export function getMeetingApprovalText(
  events: CalendarEvent[],
  sem: string,
  rocYear: number
): string {
  for (const evt of events) {
    if (evt.updatedAt) {
      const u = evt.updatedAt.trim();
      if (u.includes("幹部會議通過") || u.includes("會議通過")) {
        return u;
      }
      const match = u.match(/^(\d{2,4})[./-](\d{1,2})[./-](\d{1,2})/);
      if (match) {
        let yr = parseInt(match[1], 10);
        if (yr > 1911) yr -= 1911;
        const mm = String(match[2]).padStart(2, "0");
        const dd = String(match[3]).padStart(2, "0");
        return `${yr}.${mm}.${dd} ${sem}幹部會議通過`;
      }
    }
  }
  return `${rocYear}.08.13 ${sem}幹部會議通過`;
}
