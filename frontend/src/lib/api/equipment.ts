import api from "@/lib/api";
import type {
  EquipmentApplication,
  EquipmentStatusFilter,
} from "@/lib/types/equipment";

export interface EquipmentListResponse {
  success: boolean;
  data: EquipmentApplication[];
}

export interface EquipmentActionResponse {
  success: boolean;
  message?: string;
}

export const EquipmentUserAPI = {
  /**
   * 社員申請器材續借
   * @param applicationId - 申請單號
   * @param requestedReturnDate - 擬展延之新歸還日期 (YYYY-MM-DD)
   * @param reason - 續借理由 (選填)
   */
  applyRenewal: async (
    applicationId: string,
    requestedReturnDate: string,
    reason?: string,
  ): Promise<EquipmentActionResponse> => {
    const res = await api.post("/equipment/renew", {
      applicationId,
      requestedReturnDate,
      reason: reason || "",
    });
    return res.data;
  },
};

export const EquipmentAdminAPI = {
  /**
   * 取得管理員器材借用申請列表
   * @param status - 篩選狀態 (pending / active / history / all)
   */
  list: async (
    status: EquipmentStatusFilter = "all",
  ): Promise<EquipmentListResponse> => {
    const res = await api.get("/admin/equipment/list", {
      params: { status },
    });
    return res.data;
  },

  /**
   * 審核通過申請
   * @param applicationId - 申請單號
   */
  approve: async (applicationId: string): Promise<EquipmentActionResponse> => {
    const res = await api.post("/admin/applications/review", {
      applicationId,
      action: "approve",
    });
    return res.data;
  },

  /**
   * 拒絕申請
   * @param applicationId - 申請單號
   * @param reason - 拒絕理由
   */
  reject: async (
    applicationId: string,
    reason: string,
  ): Promise<EquipmentActionResponse> => {
    const res = await api.post("/admin/applications/review", {
      applicationId,
      action: "reject",
      rejectReason: reason,
    });
    return res.data;
  },

  /**
   * 審核續借申請
   * @param applicationId - 申請單號
   * @param action - "approve" | "reject"
   * @param rejectReason - 拒絕理由 (駁回時必填)
   */
  reviewRenewal: async (
    applicationId: string,
    action: "approve" | "reject",
    rejectReason?: string,
  ): Promise<EquipmentActionResponse> => {
    const res = await api.post("/admin/equipment/review-renewal", {
      applicationId,
      action,
      rejectReason: rejectReason || "",
    });
    return res.data;
  },

  /**
   * 確認歸還器材
   * @param applicationId - 申請單號
   */
  return: async (applicationId: string): Promise<EquipmentActionResponse> => {
    const res = await api.post("/admin/equipment/return", {
      applicationId,
    });
    return res.data;
  },
};
