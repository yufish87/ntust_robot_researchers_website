import { proxyToGas } from "@/lib/api/gas-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = await proxyToGas(request, "admin/calendar/batch-create");
  
  // 若 GAS upstream 回應 ROUTE_NOT_FOUND，提供明確的部署提示
  try {
    const clone = response.clone();
    const data = await clone.json();
    if (data?.code === "ROUTE_NOT_FOUND" || (data?.message && data.message.includes("Route not found"))) {
      return NextResponse.json(
        {
          success: false,
          code: "ROUTE_NOT_FOUND",
          message: "Google Apps Script 遠端後端尚未更新部署（找不到 admin/calendar/batch-create 路由）。請在專案根目錄執行 clasp push 並於 GAS 控制台更新 Web 應用程式部署版本。",
        },
        { status: 404 },
      );
    }
  } catch {
    // 忽略解析錯誤，回傳原始 response
  }

  return response;
}
