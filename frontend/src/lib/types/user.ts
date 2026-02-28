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
