/**
 * 電子乖乖許願池型別定義與統一分類常數
 */

export interface WishlistCategoryItem {
  id: string;       // 識別碼，如 "hardware"
  label: string;    // 顯示名稱，如 "硬體採購"
  prefix: string;   // 標題前綴，如 "【硬體採購】"
  keyword: string;  // 內容匹配關鍵字，如 "硬體"
  example: string;  // 輸入提示範例
}

export const WISHLIST_CATEGORIES: WishlistCategoryItem[] = [
  {
    id: "hardware",
    label: "硬體採購",
    prefix: "【硬體採購】",
    keyword: "硬體",
    example: "希望添購示波器與 ESP32-S3 開發板",
  },
  {
    id: "course",
    label: "社課主題",
    prefix: "【社課主題】",
    keyword: "社課",
    example: "想開辦 ROS 2 實作專題",
  },
  {
    id: "facility",
    label: "社辦環境",
    prefix: "【社辦環境】",
    keyword: "環境",
    example: "建議增加 3D 列印 PETG 耗材與整理工具架",
  },
  {
    id: "feedback",
    label: "功能反饋",
    prefix: "【功能反饋】",
    keyword: "功能",
    example: "希望借用設備時能支援行事曆自動提醒",
  },
];

export interface WishlistItem {
  id: string;          // 意見ID (WSH-YYYYMMDD-XXX)
  content: string;     // 願望內容 (印刻在乖乖包裝袋上的文字，含前綴)
  createdAt: string;   // 發布時間 (YYYY-MM-DD HH:mm:ss)
  upvotes: number;     // 累積集氣數
  hasUpvoted: boolean; // 當前使用者是否已集氣
  isOwn?: boolean;     // 是否為當前使用者發起的願望
}

export interface WishlistFeedData {
  items: WishlistItem[];
  canSubmitToday: boolean; // 當前使用者今日是否還能許願 (每人每日限 1 次)
  todayWish?: WishlistItem | null; // 當前使用者今日已提交的願望
}
