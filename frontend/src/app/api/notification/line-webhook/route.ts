import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const gasApiUrl = process.env.NEXT_PUBLIC_GAS_API_URL;
    if (!gasApiUrl) {
      console.error("[LINE Webhook] 缺少環境變數 NEXT_PUBLIC_GAS_API_URL");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const arrayBuffer = await req.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);
    const rawBody = rawBuffer.toString("utf-8");

    // 簽章驗證 (若環境有設定 LINE_CHANNEL_SECRET，強制執行 HMAC-SHA256 驗證)
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (channelSecret) {
      const signature = req.headers.get("x-line-signature");
      if (!signature) {
        console.warn("[LINE Webhook] 缺少 X-Line-Signature 簽章，拒絕請求");
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }

      const calculatedSignature = crypto
        .createHmac("sha256", channelSecret)
        .update(rawBuffer)
        .digest("base64");

      const sigBuffer = Buffer.from(signature, "utf8");
      const calcBuffer = Buffer.from(calculatedSignature, "utf8");

      // 使用常數時間比對（timingSafeEqual）防止時序攻擊（Timing Attack）
      if (
        sigBuffer.length !== calcBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, calcBuffer)
      ) {
        console.warn("[LINE Webhook] X-Line-Signature 簽章驗證失敗");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      // 容錯空 body
    }

    const events = body.events || [];

    // 1. 若為 LINE 平台「Verify 驗證」探針（events 為空），直接回傳 200
    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, message: "Webhook verified successfully" }, { status: 200 });
    }

    // 僅記錄事件筆數與非敏感類型，不記錄對話內容或用戶識別碼
    console.log(`[LINE Webhook] 收到 ${events.length} 筆事件，開始非同步轉發至 GAS...`);

    // 2. 非阻塞非同步轉發真實事件至 GAS 後端
    const url = new URL(gasApiUrl);
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
      if (!res.ok) {
        console.warn(`[LINE Webhook] GAS 轉發非 200 回應 (HTTP ${res.status})`);
      }
    }).catch((err) => {
      console.error("[LINE Webhook] GAS 轉發連線錯誤:", err);
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
