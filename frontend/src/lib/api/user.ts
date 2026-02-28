import api from "@/lib/api";
import type {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  DeleteAccountRequest,
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
};
