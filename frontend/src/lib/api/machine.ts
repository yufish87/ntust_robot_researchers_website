import api from "@/lib/api";
import type {
  MachineApplication,
  MachineStatusFilter,
  MachineType,
} from "@/lib/types/machine";

/* ================================================================ */
/*  Request interfaces                                               */
/* ================================================================ */

// 3D Printer Interfaces
export interface Machine3DPrinterRequest {
  purpose: string;
  needAssist: string;
  quantity: number;
  infill: string;
  estimateTime: string;
  estimateMaterial: string;
  useTime?: string;
  note?: string;
  fileId: string; // Gcode
  screenshotFileId: string; // Screenshot
}

// Laser Cutter Interfaces
export interface MachineLaserCutterRequest {
  purpose: string;
  needAssist: string;
  quantity: number;
  materialSource: string;
  materialType?: string;
  thickness?: string;
  estimateTime: string;
  useTime?: string;
  note?: string;
  fileId: string; // Vector File
}

/* ================================================================ */
/*  Response interfaces                                              */
/* ================================================================ */

export interface MachineListResponse {
  success: boolean;
  data: MachineApplication[];
}

export interface MachineActionResponse {
  success: boolean;
  message?: string;
}

/* ================================================================ */
/*  User API                                                         */
/* ================================================================ */

export const MachineAPI = {
  // Apply 3D Printer
  apply3DPrinter: async (data: Machine3DPrinterRequest) => {
    const res = await api.post("/machine/apply/3d-printer", data);
    return res.data;
  },

  // Apply Laser Cutter
  applyLaserCutter: async (data: MachineLaserCutterRequest) => {
    const res = await api.post("/machine/apply/laser-cutter", data);
    return res.data;
  },

  // Get My Applications
  getMyApplications: async () => {
    const res = await api.get("/machine/my-applications");
    return res.data;
  },

  // Update File (For 2-step upload)
  updateFile: async (
    applicationId: string,
    fileId: string,
    fileType: "main" | "screenshot" = "main",
  ) => {
    const res = await api.post("/machine/update-file", {
      applicationId,
      fileId,
      fileType,
    });
    return res.data;
  },

  /**
   * 回覆管理員排程建議（接受 / 拒絕）
   * @param applicationId - 申請單號
   * @param accept - true 接受 / false 拒絕
   */
  replyProposal: async (
    applicationId: string,
    accept: boolean,
  ): Promise<MachineActionResponse> => {
    const res = await api.post("/machine/reply", {
      applicationId,
      accept,
    });
    return res.data;
  },
};

/* ================================================================ */
/*  Admin API                                                        */
/* ================================================================ */

export const MachineAdminAPI = {
  /**
   * 取得管理員機器借用申請列表
   * @param type - 機器類型
   * @param status - 篩選狀態
   */
  list: async (
    type: MachineType,
    status: MachineStatusFilter = "all",
  ): Promise<MachineListResponse> => {
    const res = await api.get("/admin/machine/list", {
      params: { type, status },
    });
    return res.data;
  },

  /**
   * 提出排程建議（審核中 → 待確認）
   * @param applicationId - 申請單號
   * @param proposedTime - 建議開始時間 (ISO 字串)
   */
  propose: async (
    applicationId: string,
    proposedTime: string,
  ): Promise<MachineActionResponse> => {
    const res = await api.post("/admin/machine/propose", {
      applicationId,
      proposedTime,
    });
    return res.data;
  },

  /**
   * 拒絕申請（審核中 / 待確認 → 不予通過）
   * @param applicationId - 申請單號
   * @param rejectReason - 拒絕理由
   */
  reject: async (
    applicationId: string,
    rejectReason: string,
  ): Promise<MachineActionResponse> => {
    const res = await api.post("/admin/machine/reject", {
      applicationId,
      rejectReason,
    });
    return res.data;
  },
};
