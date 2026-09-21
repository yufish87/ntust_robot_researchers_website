import { CalendarCategory, CalendarEvent } from "@/types/calendar";

export interface CategoryTheme {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  accentBorder: string;
  cardBg: string;
}

export const CALENDAR_CATEGORY_CONFIG: Record<CalendarCategory, CategoryTheme> = {
  course: {
    label: "社課/工作坊",
    badgeBg: "bg-[#ffc000]/15",
    badgeText: "text-[#ffc000]",
    badgeBorder: "border-[#ffc000]/30",
    dotColor: "bg-[#ffc000]",
    accentBorder: "border-l-[#ffc000]",
    cardBg: "hover:bg-[#ffc000]/[0.03]",
  },
  activity: {
    label: "活動/社員大會",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-400",
    badgeBorder: "border-sky-500/30",
    dotColor: "bg-sky-400",
    accentBorder: "border-l-sky-400",
    cardBg: "hover:bg-sky-500/[0.03]",
  },
  holiday: {
    label: "考試/國定假日",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-400",
    badgeBorder: "border-rose-500/30",
    dotColor: "bg-rose-400",
    accentBorder: "border-l-rose-400",
    cardBg: "hover:bg-rose-500/[0.03]",
  },
  exam: {
    label: "考試/國定假日",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-400",
    badgeBorder: "border-rose-500/30",
    dotColor: "bg-rose-400",
    accentBorder: "border-l-rose-400",
    cardBg: "hover:bg-rose-500/[0.03]",
  },
  custom: {
    label: "其他日程",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-400",
    badgeBorder: "border-purple-500/30",
    dotColor: "bg-purple-400",
    accentBorder: "border-l-purple-400",
    cardBg: "hover:bg-purple-500/[0.03]",
  },
};

/**
 * 標準三項事件類別選項（新增行事曆、匯入 Excel、後台指標卡全站統一）
 */
export const STANDARD_CALENDAR_CATEGORIES = [
  { value: "course" as const, label: "社課/工作坊" },
  { value: "activity" as const, label: "活動/社員大會" },
  { value: "holiday" as const, label: "考試/國定假日" },
] as const;

export const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"] as const;

/**
 * 依 YYYY-MM-DD 動態推算星期（週日為 0，週六為 6）
 */
export function getWeekdayName(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3) return "";
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return WEEKDAY_NAMES[d.getDay()] || "";
}

/**
 * 產生加入 Google 日曆的 Web Intent URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const prefix = "臺科大機器人研究社";
  const fullTitle = event.title.startsWith(prefix)
    ? event.title
    : `${prefix} ${event.title}`;
  const title = encodeURIComponent(fullTitle);
  const details = encodeURIComponent(
    [
      event.week ? `【臺科大機器人研究社】第 ${event.week} 週` : "【臺科大機器人研究社】",
      event.category ? `類別：${CALENDAR_CATEGORY_CONFIG[event.category]?.label || event.category}` : "",
      event.status === "tentative" ? "狀態：暫定" : "狀態：已確認",
      event.location ? `地點/備註：${event.location}` : "",
      event.courseId ? "本活動有提供社課講義與教材，請至社團網站查閱" : "",
    ]
      .filter(Boolean)
      .join("\n")
  );
  const defaultLoc =
    event.category === "course" || event.category === "activity"
      ? "國立臺灣科技大學 TR-516"
      : "國立臺灣科技大學 微型車庫 / 機器人研究社辦";
  const location = encodeURIComponent(event.location || defaultLoc);

  const isCourse = event.category === "course";
  const startTime = isCourse ? "190000" : "080000";
  const endTime = isCourse ? "210000" : "170000";

  const cleanDate = (d?: string) => (d ? d.split(/[T ]/)[0].replace(/-/g, "") : "");
  const startClean = cleanDate(event.startDate);
  const endClean = cleanDate(event.endDate) || startClean;

  const datesParam = `${startClean}T${startTime}/${endClean}T${endTime}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&ctz=Asia/Taipei&details=${details}&location=${location}`;
}

/**
 * 預設學年學期推算
 */
export function getCurrentSemester(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  // 臺灣學制：8月~隔年1月為第1學期，2月~7月為第2學期
  // 民國年 = 西元年 - 1911
  let rocYear = year - 1911;
  let term = "1";

  if (month >= 2 && month <= 7) {
    // 2~7月屬於前一年入學的下學期
    rocYear -= 1;
    term = "2";
  } else if (month === 1) {
    // 1月仍屬於前一年的上學期
    rocYear -= 1;
    term = "1";
  } else {
    // 8~12月屬於當年的上學期
    term = "1";
  }

  return `${rocYear}-${term}`;
}
