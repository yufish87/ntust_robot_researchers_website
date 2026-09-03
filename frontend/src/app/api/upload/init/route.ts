import { NextRequest, NextResponse } from "next/server";

// Force dynamic needed because we are using fetch/POST
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, mimeType, fileSize, type, semester, courseTitle, folderId } = body;

    // Call GAS to get Session URI
    const gasUrl = process.env.NEXT_PUBLIC_GAS_API_URL;
    if (!gasUrl) {
      throw new Error("GAS API URL not configured");
    }

    // 取得用戶端 Origin 用於 Google Drive CORS 授權（使用 NextRequest 內建的 nextUrl.origin，安全且穩定）
    const clientOrigin = req.nextUrl.origin;

    // 關鍵修復：在 URL query string 與 payload 兩處皆帶入 route=upload/init，杜絕 302 重導或 proxy 丟失 body 導致的 MISSING_ROUTE
    const targetUrl = new URL(gasUrl);
    targetUrl.searchParams.set("route", "upload/init");

    // Wrap params for GAS Router
    const payload = {
      route: "upload/init",
      params: {
        fileName,
        mimeType,
        fileSize,
        type,
        semester,
        courseTitle,
        folderId,
        origin: clientOrigin,
      },
    };

    // 呼叫 GAS 取得 Session URI，遇到任何暫時性失敗或繁忙時自動退避重試最多 3 次
    let data: any = null;
    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(targetUrl.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          redirect: "follow",
          cache: "no-store",
        });

        if (!res.ok) {
          lastError = `GAS responded with status ${res.status}`;
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
        }

        data = await res.json();
        if (!data || !data.success) {
          lastError = data?.message || "Failed to init upload";
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
        } else {
          // Success!
          break;
        }
      } catch (err: any) {
        lastError = err.message || "Network error";
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      }
    }

    if (!data || !data.success) {
      throw new Error(data?.message || lastError || "Failed to init upload after retries");
    }

    return NextResponse.json(data.data);

  } catch (error: any) {
    console.error("Upload Init Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
