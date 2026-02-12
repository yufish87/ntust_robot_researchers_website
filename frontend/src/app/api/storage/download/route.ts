import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // 1. Fetch file data from GAS (which returns JSON with base64)
    const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;
    if (!GAS_API_URL) throw new Error("GAS_API_URL not defined");

    const gasUrl = new URL(GAS_API_URL);
    gasUrl.searchParams.set("route", "course/file/download");
    gasUrl.searchParams.set("token", token);
    
    // Pass User-Agent/IP for logging (optional, though download is usually generic)
    const userAgent = request.headers.get("user-agent") || "unknown";
    gasUrl.searchParams.set("user_agent", userAgent);

    const res = await fetch(gasUrl.toString(), {
      method: "GET",
      // GAS `doGet` handles authentication/logging if needed, but here we rely on the temp token
    });

    if (!res.ok) {
        return NextResponse.json({ error: "Upstream error" }, { status: res.status });
    }

    const json = await res.json();

    if (!json.success) {
      return NextResponse.json({ error: json.message || "Download failed" }, { status: 400 });
    }

    const fileData = json.data; // { name, mimeType, data (base64) }

    // 2. Convert Base64 to Buffer
    const buffer = Buffer.from(fileData.data, "base64");

    // 3. Return as File Download
    // Enhance filename encoding for non-ASCII characters (RFC 5987)
    const encodedFilename = encodeURIComponent(fileData.name);
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": fileData.mimeType,
        "Content-Disposition": `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": buffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("Download Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
