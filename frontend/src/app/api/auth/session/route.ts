import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSessionToken } from "@/lib/session";

const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;

if (!GAS_API_URL) {
  throw new Error("GAS_API_URL is not defined");
}

interface SessionUser {
  studentId: string;
  name: string;
  role: string;
  department: string;
  grade?: string;
}

function sanitizeUser(raw: unknown): SessionUser | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const user = raw as Record<string, unknown>;
  if (!user.studentId || !user.name || !user.role || !user.department) {
    return null;
  }

  return {
    studentId: String(user.studentId),
    name: String(user.name),
    role: String(user.role),
    department: String(user.department),
    grade: user.grade ? String(user.grade) : undefined,
  };
}

export async function GET(req: NextRequest) {
  const token = getSessionToken(req);

  if (!token) {
    return NextResponse.json({
      success: true,
      data: {
        authenticated: false,
        user: null,
      },
    });
  }

  try {
    const url = new URL(GAS_API_URL!);
    url.searchParams.set("route", "auth/verify");
    url.searchParams.set("token", token);

    const userAgent = req.headers.get("user-agent") || "unknown";
    const xForwardedFor = req.headers.get("x-forwarded-for");
    const ip = xForwardedFor ? xForwardedFor.split(",")[0] : "127.0.0.1";
    url.searchParams.set("user_ip", ip);
    url.searchParams.set("user_agent", userAgent);

    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      redirect: "follow",
    });

    const upstreamText = await upstream.text();
    let data: any = null;

    try {
      data = JSON.parse(upstreamText);
    } catch {
      const res = NextResponse.json({
        success: true,
        data: {
          authenticated: false,
          user: null,
        },
      });
      clearSessionCookie(res);
      return res;
    }

    if (!upstream.ok || !data?.success) {
      const res = NextResponse.json({
        success: true,
        data: {
          authenticated: false,
          user: null,
        },
      });
      clearSessionCookie(res);
      return res;
    }

    const user = sanitizeUser(data.data);

    if (!user) {
      const res = NextResponse.json({
        success: true,
        data: {
          authenticated: false,
          user: null,
        },
      });
      clearSessionCookie(res);
      return res;
    }

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        user,
      },
    });
  } catch {
    const res = NextResponse.json({
      success: true,
      data: {
        authenticated: false,
        user: null,
      },
    });
    clearSessionCookie(res);
    return res;
  }
}
