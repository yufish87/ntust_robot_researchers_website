import { proxyToGas } from "@/lib/api/gas-server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // 公開公告快取 5 分鐘
  return proxyToGas(request, "announcement/public/list", { revalidate: 300 });
}
