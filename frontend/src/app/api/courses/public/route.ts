import { proxyToGas } from "@/lib/api/gas-server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // P1: 公開課程資料 5 分鐘快取，支援主動快取失效
  return proxyToGas(request, "course/public/list", { revalidate: 300, tags: ["courses"] });
}
