import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;

if (!GAS_API_URL) {
  throw new Error("GAS_API_URL is not defined");
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    console.log(`[LINE Webhook] 收到請求 Raw Body:`, rawBody);

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      // 容錯空 body
    }

    const events = body.events || [];

    // 1. 若為 LINE 平台「Verify 驗證」探針（events 為空），直接秒回 200
    if (!events || events.length === 0) {
      console.log(`[LINE Webhook] Verify 探針驗證成功`);
      return NextResponse.json({ success: true, message: "Webhook verified successfully" }, { status: 200 });
    }

    console.log(`[LINE Webhook] 收到 ${events.length} 筆事件，開始轉發至 GAS...`);
    events.forEach((ev: any, idx: number) => {
      console.log(`[LINE Webhook] 事件 #${idx + 1}: type=${ev.type}, text=${ev.message?.text}, userId=${ev.source?.userId}`);
    });

    // 2. 非阻塞非同步轉發真實事件至 GAS 後端
    const url = new URL(GAS_API_URL!);
    url.searchParams.set("route", "notification/line-webhook");

    fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: rawBody,
      redirect: "follow",
      cache: "no-store",
    }).then(async (res) => {
      const text = await res.text();
      console.log(`[LINE Webhook] GAS 轉發完成 (HTTP ${res.status}):`, text.slice(0, 300));
    }).catch((err) => {
      console.error("[LINE Webhook] GAS 轉發錯誤:", err);
    });

    // 3. 立即向 LINE 回傳 HTTP 200 OK
    return NextResponse.json({ success: true, message: "Events queued" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook error";
    console.error("[LINE Webhook] Proxy Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "LINE Webhook Endpoint Ready", timestamp: new Date().toISOString() }, { status: 200 });
}
