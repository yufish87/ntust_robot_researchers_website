import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/session";

const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;

if (!GAS_API_URL) {
  throw new Error("GAS_API_URL is not defined");
}

/**
 * 具有自動重試機制的 GAS 請求代理
 * 針對 Google Apps Script 冷啟動短暫 404、500/502/503 或網路中斷進行最多 2 次自動重試
 */
export async function fetchGasWithRetry(
  url: string,
  init: RequestInit,
  routeDesc: string = "unknown",
  maxRetries: number = 2,
): Promise<Response> {
  const delays = [800, 1600]; // 毫秒重試間隔
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 設置 35 秒 timeout 防止冷啟動等待期間連線掛死
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 若回傳 404（GAS 冷啟動或暫存 echo 延遲）或 500/502/503/504，視為可重試的暫態錯誤
      const isRetryable =
        response.status === 404 ||
        response.status === 500 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504;

      if (!isRetryable) {
        return response;
      }

      lastResponse = response;
      if (attempt < maxRetries) {
        const waitMs = delays[attempt] || 1500;
        console.warn(
          `[GAS Proxy Retry] Route "${routeDesc}" attempt ${attempt + 1}/${maxRetries + 1} got HTTP ${response.status}. Retrying in ${waitMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    } catch (err: unknown) {
      lastError = err;
      if (attempt < maxRetries) {
        const waitMs = delays[attempt] || 1500;
        console.warn(
          `[GAS Proxy Retry] Route "${routeDesc}" attempt ${attempt + 1}/${maxRetries + 1} network exception: ${err instanceof Error ? err.message : String(err)}. Retrying in ${waitMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error(`GAS fetch failed after ${maxRetries + 1} attempts`);
}

/**
 * Proxy request to Google Apps Script
 * @param req NextRequest
 * @param gasRoute The specific GAS route to call (e.g., 'course/list')
 */
export async function proxyToGas(
  req: NextRequest,
  gasRoute: string,
  options?: { revalidate?: number; tags?: string[] },
) {
  try {
    const method = req.method;
    const url = new URL(GAS_API_URL!);

    // 1. Prepare Query Params
    req.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    url.searchParams.set("route", gasRoute);

    // 2. Extract Client Info & Token
    const userAgent = req.headers.get("user-agent") || "unknown";
    const xForwardedFor = req.headers.get("x-forwarded-for");
    const ip = xForwardedFor ? xForwardedFor.split(",")[0] : "127.0.0.1";
    const token = getSessionToken(req);

    // 3. Prepare Payload
    let body = undefined;

    if (method === "POST" || method === "PUT" || method === "DELETE") {
      let json: any = {};
      try {
        if (req.body) {
          json = await req.json();
        }
      } catch {
        // Body might be empty
      }

      body = JSON.stringify({
        ...json,
        user_ip: ip,
        user_agent: userAgent,
        token: json.token || token,
      });
    } else if (method === "GET") {
      if (!options?.revalidate) {
        url.searchParams.append("user_ip", ip);
        url.searchParams.append("user_agent", userAgent);
      }
      if (token && !url.searchParams.has("token")) {
        url.searchParams.append("token", token);
      }
    }

    // 4. Forward
    const fetchMethod = method === "GET" ? "GET" : "POST";

    const fetchInit: RequestInit = {
      method: fetchMethod,
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
      redirect: "follow",
    };

    if (fetchMethod === "GET" && options?.revalidate) {
      (fetchInit as any).next = {
        revalidate: options.revalidate,
        tags: options.tags,
      };
    }

    const response = await fetchGasWithRetry(url.toString(), fetchInit, gasRoute);

    if (!response.ok) {
      const isColdStart = response.status === 404 || response.status >= 500;
      const message = isColdStart
        ? "社團後端伺服器正在喚醒中或暫時無回應，請於 3 秒後重新嘗試。"
        : `Upstream error: ${response.status}`;

      return NextResponse.json(
        { success: false, message, upstreamStatus: response.status },
        { status: response.status },
      );
    }

    const data = await response.json();
    const nextRes = NextResponse.json(data);

    if (options?.revalidate) {
      nextRes.headers.set(
        "Cache-Control",
        `public, s-maxage=${options.revalidate}, stale-while-revalidate=${options.revalidate * 2}`,
      );
    }

    return nextRes;
  } catch (error: any) {
    console.error(`Proxy Error (${gasRoute}):`, error.message);
    return NextResponse.json(
      {
        success: false,
        message: "社團伺服器連線異常，請稍後再試。",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
