import api from "@/lib/api";
import type {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  DeleteAccountRequest,
  AdminListUsersResponse,
  AdminUpdateRoleRequest,
  AdminDeleteUserRequest,
} from "@/lib/types/user";

/**
 * 使用者 API 封裝
 */
export const UserAPI = {
  /** 取得個人資料 */
  getProfile: async (): Promise<UserProfile> => {
    const res = await api.post("/user/profile", {});
    if (!res.data.success)
      throw new Error(res.data.message || "取得個人資料失敗");
    return res.data.data as UserProfile;
  },

  /** 更新個人資料 (系所、年級) */
  updateProfile: async (data: UpdateProfileRequest) => {
    const res = await api.post("/user/update-profile", data);
    if (!res.data.success) throw new Error(res.data.message || "更新失敗");
    return res.data;
  },

  /** 修改密碼 */
  changePassword: async (data: ChangePasswordRequest) => {
    const res = await api.post("/user/change-password", data);
    if (!res.data.success) throw new Error(res.data.message || "密碼修改失敗");
    return res.data;
  },

  /** 刪除帳號 (軟刪除) */
  deleteAccount: async (data: DeleteAccountRequest) => {
    const res = await api.post("/user/delete-account", data);
    if (!res.data.success) throw new Error(res.data.message || "帳號刪除失敗");
    return res.data;
  },

  /** 管理員 — 取得使用者列表 */
  listUsers: async (): Promise<AdminListUsersResponse> => {
    const res = await api.post("/admin/members/list", {});
    if (!res.data.success)
      throw new Error(res.data.message || "取得使用者列表失敗");
    return res.data.data as AdminListUsersResponse;
  },

  /** 管理員 — 變更使用者身份 */
  updateRole: async (data: AdminUpdateRoleRequest) => {
    const res = await api.post("/admin/members/update-role", data);
    if (!res.data.success)
      throw new Error(res.data.message || "變更身份失敗");
    return res.data;
  },

  /** 管理員 — 軟刪除使用者 */
  adminDelete: async (data: AdminDeleteUserRequest) => {
    const res = await api.post("/admin/members/delete", data);
    if (!res.data.success)
      throw new Error(res.data.message || "刪除使用者失敗");
    return res.data;
  },
};
