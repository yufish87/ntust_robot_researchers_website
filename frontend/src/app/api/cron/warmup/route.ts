import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron / External Keeper: 保活 GAS 容器，避免冷啟動延遲
 * 每次觸發時向 GAS 輕量發送 system/health 請求
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // 若環境變數設定了 CRON_SECRET，驗證 Vercel Cron Bearer Token 防止非授權濫用
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;
  if (!GAS_API_URL) {
    return NextResponse.json(
      { success: false, message: "GAS_API_URL not configured" },
      { status: 500 },
    );
  }

  const t0 = Date.now();
  try {
    const url = new URL(GAS_API_URL);
    url.searchParams.set("route", "system/health");

    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(9000),
    });

    const latencyMs = Date.now() - t0;
    const data = await res.json().catch(() => null);

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      latencyMs,
      gasResponse: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        latencyMs: Date.now() - t0,
        error: error.message || "Ping failed",
      },
      { status: 500 },
    );
  }
}
