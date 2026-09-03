/**
 * 使用者相關型別定義
 */

/** 使用者角色 */
export type UserRole = "visitor" | "member" | "admin" | "owner" | "expired";

/** 使用者狀態 */
export type UserStatus = "active" | "deleted";

/** 歷年身份組記錄 */
export interface MembershipRecord {
  year: string;       // 學年如 "115"
  type: "member" | "admin" | "owner";  // 身份
  positions: string;  // 職位（社員為空字串）
}

/** 各渠道通知開關項目 */
export interface NotificationChannel {
  equipment: boolean;
  machine: boolean;
  finance: boolean;
  announcements: boolean;
}

/** 通知偏好設定結構 */
export interface NotificationPreferences {
  email: NotificationChannel;
  line: NotificationChannel;
}

/** LINE 綁定狀態資訊 */
export interface LineBindingInfo {
  isLineBound: boolean;
  lineUserId?: string;
  bindCode?: string;
  expiresInSeconds?: number;
}

/** 使用者個人資料 (不含敏感欄位) */
export interface UserProfile {
  studentId: string;
  name: string;
  department: string;
  grade: string;
  role: UserRole;
  status: UserStatus;
  registrationTime: string;
  loginCount: number;
  lastLoginTime: string;
  membershipHistory: MembershipRecord[];  // 歷年身份組
  activeUntilYear: string;               // 有效截止學年，如 "115"
  lineUserId?: string;                   // LINE User ID
  notificationPreferences?: NotificationPreferences | string; // 通知偏好
  email?: string;                        // 自訂通知信箱 (未設定時預設學校信箱)
}

/** 更新個人資料 Request */
export interface UpdateProfileRequest {
  department: string;
  grade: string;
  email?: string;
}

/** 修改密碼 Request */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/** 刪除帳號 Request */
export interface DeleteAccountRequest {
  password: string;
}

/** 社員自助更新社費學年 Request */
export interface ExtendMembershipRequest {
  code: string;
}

/** 管理員用 — 使用者列表回應 */
export interface AdminListUsersResponse {
  users: UserProfile[];
  total: number;
}

/** 管理員用 — 變更身份 Request */
export interface AdminUpdateRoleRequest {
  targetStudentId: string;
  newRole: "member" | "admin";
}

/** 管理員用 — 刪除使用者 Request */
export interface AdminDeleteUserRequest {
  targetStudentId: string;
}

/** 管理員用 — 設定職位 Request */
export interface AdminUpdatePositionsRequest {
  targetStudentId: string;
  positions: string[];  // 前端以陣列傳入，如 ['副社長']
}

/** 管理員用 — 手動設定社費學年 Request */
export interface AdminSetMemberYearRequest {
  targetStudentId: string;
  activeUntilYear: string;  // 3 位學年如 "115"，空字串代表清除
}

/** 驗證碼物件 */
export interface VerifyCode {
  code: string;
  description: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  usedCount: number;
  usageLimit: number;
  createdBy: string;
  createdAt: string;
  targetYear: string;  // 目標學年，如 "114"，空字串代表無特定學年
}

/** 管理員用 — 產生驗證碼 Request */
export interface AdminGenerateCodeRequest {
  code: string;
  description: string;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  targetYear?: string;  // 選填：目標學年
}

/** 管理員用 — 產生驗證碼 Response */
export interface AdminGenerateCodeResponse {
  code: string;
  message: string;
}

/** 管理員用 — 驗證碼列表回應 */
export interface AdminListCodesResponse {
  codes: VerifyCode[];
  total: number;
}

/** 管理員用 — 更新驗證碼 Request */
export interface AdminUpdateCodeRequest {
  code: string;
  isActive?: boolean;
  usageLimit?: number;
}

/** 管理員用 — 手動新增人員 Request */
export interface AdminAddUserRequest {
  studentId: string;
  name: string;
}
