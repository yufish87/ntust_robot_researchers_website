import axios from "axios";

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

export const MachineAPI = {
  // Apply 3D Printer
  apply3DPrinter: async (data: Machine3DPrinterRequest) => {
    // POST /api/machine/apply/3d-printer (Next.js route -> GAS)
    // GAS Endpoint: machine/apply/3d-printer
    const res = await axios.post("/api/machine/apply/3d-printer", data);
    return res.data; 
  },

  // Apply Laser Cutter
  applyLaserCutter: async (data: MachineLaserCutterRequest) => {
    const res = await axios.post("/api/machine/apply/laser-cutter", data);
    return res.data;
  },

  // Get My Applications
  getMyApplications: async () => {
    const res = await axios.get("/api/machine/my-applications");
    return res.data;
  },

  // Update File (For 2-step upload)
  updateFile: async (applicationId: string, fileId: string, fileType: 'main' | 'screenshot' = 'main') => {
      const res = await axios.post("/api/machine/update-file", {
          applicationId,
          fileId,
          fileType
      });
      return res.data;
  }
};
