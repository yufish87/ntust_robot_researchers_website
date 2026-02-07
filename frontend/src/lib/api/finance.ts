import axios from "axios";

export interface FinanceItem {
  itemName: string;
  itemSpec: string;
  expenseType: string;
  quantity: number;
  totalPrice: number;
}

export interface FinanceApplicationRequest {
  category: string;
  description: string;
  invoiceType: string;
  invoiceNumber?: string;
  invoiceDate: string;
  totalAmount: number;
  items: FinanceItem[];
  fileId: string; // From Direct Upload
}

export const FinanceAPI = {
  // Submit Application
  submit: async (data: FinanceApplicationRequest) => {
    const res = await axios.post("/api/applications/finance", data);
    return res.data; // { success: true, ... }
  },

  // Get My Applications
  getMyApplications: async () => {
    // We can reuse the same endpoint with GET or different path.
    // Plan says: GET /applications/finance/my for GAS, but BFF needs a route too.
    // Let's use GET /api/applications/finance
    const res = await axios.get("/api/applications/finance");
    return res.data;
  },

  updateFile: async (applicationId: string, fileId: string) => {
    const res = await axios.post("/api/applications/finance/update-file", {
      applicationId,
      fileId
    });
    return res.data;
  },

  // Cancel Application
  cancel: async (applicationId: string) => {
    const res = await axios.post("/api/applications/finance/cancel", {
      applicationId
    });
    return res.data;
  }
};
