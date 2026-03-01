import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    const gasUrl = process.env.NEXT_PUBLIC_GAS_API_URL;
    if (!gasUrl) {
      throw new Error("GAS API URL not configured");
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || "";

    const payload = {
      route: "upload/delete",
      token,
      fileId,
    };

    const res = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to delete file");
    }

    return NextResponse.json(data.data);
  } catch (error: any) {
    console.error("Upload Delete Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
