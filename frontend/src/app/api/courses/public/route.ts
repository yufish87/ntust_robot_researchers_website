import { proxyToGas } from "@/lib/api/gas-server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const isRefresh = request.nextUrl.searchParams.get("refresh") === "true";
  return proxyToGas(
    request,
    "course/public/list",
    isRefresh ? undefined : { revalidate: 60, tags: ["courses"] },
  );
}
