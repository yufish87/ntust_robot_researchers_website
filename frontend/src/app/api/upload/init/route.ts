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

    // 取得用戶端 Origin 用於 Google Drive CORS 授權
    const rawOrigin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:3000";
    let clientOrigin = "";
    try {
      clientOrigin = new URL(rawOrigin).origin;
    } catch {
      clientOrigin = rawOrigin;
    }

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
      }
    };

    // 呼叫 GAS 取得 Session URI，遇到短暫繁忙（SERVER_BUSY）時自動退避重試最多 3 次
    let data: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(gasUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      data = await res.json();
      if (!data.success && data.code === "SERVER_BUSY" && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      break;
    }

    if (!data || !data.success) {
      throw new Error(data?.message || "Failed to init upload");
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
