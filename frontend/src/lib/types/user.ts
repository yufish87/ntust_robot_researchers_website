/**
 * 使用者相關型別定義
 */

/** 使用者角色 */
export type UserRole = "visitor" | "member" | "admin" | "owner";

/** 使用者狀態 */
export type UserStatus = "active" | "deleted";

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
  positions: string;     // 逗號分隔職位，如 "副社長,教學"
  lastPaidYear: string;  // 最後繳費學年，如 "114"
}

/** 更新個人資料 Request */
export interface UpdateProfileRequest {
  department: string;
  grade: string;
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
  positions: string[];  // 前端以陣列傳入，後端轉為逗號字串
}

/** 管理員用 — 手動設定社費學年 Request */
export interface AdminSetMemberYearRequest {
  targetStudentId: string;
  lastPaidYear: string;  // 3 位學年如 "114"，空字串代表清除
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
