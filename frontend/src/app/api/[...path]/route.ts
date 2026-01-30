import { NextRequest, NextResponse } from 'next/server';

const GAS_API_URL = process.env.GAS_API_URL;

if (!GAS_API_URL) {
  throw new Error('GAS_API_URL is not defined');
}

/**
 * BFF Proxy Handler
 * Forwards requests from /api/... to Google Apps Script
 * Injects generic client info (IP, User Agent) for logging
 */
async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/'); // e.g., "auth/login"

  try {
    const method = req.method;
    const url = new URL(GAS_API_URL!);
    
    // 1. Prepare Query Params (append path as route)
    // Preserve existing params from GAS_API_URL if any, and request params
    req.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    url.searchParams.set('route', path);

    // 2. Extract Client Info & Token
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const ip = xForwardedFor ? xForwardedFor.split(',')[0] : '127.0.0.1'; 
    const token = req.cookies.get('auth_token')?.value;

    // 3. Prepare Payload (Inject IP/UA/Token)
    let body = undefined;
    if (method === 'POST') {
      const json = await req.json();
      body = JSON.stringify({
        ...json,
        user_ip: ip,
        user_agent: userAgent,
        token: json.token || token // Use existing if provided, else inject cookie token
      });
    } else if (method === 'GET') {
      // For GET, we must append to URL params
      url.searchParams.append('user_ip', ip);
      url.searchParams.append('user_agent', userAgent);
      if (token && !url.searchParams.has('token')) {
        url.searchParams.append('token', token);
      }
    }

    // 4. Forward Request using native fetch
    // GAS returns 302 redirects commonly, fetch follows them by default.
    const response = await fetch(url.toString(), {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
      redirect: 'follow' 
    });

    if (!response.ok) {
        return NextResponse.json(
            { success: false, message: `Upstream error: ${response.status}` },
            { status: response.status }
        );
    }

    // 5. Return Data
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Proxy Error:', error.message);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Backend proxy error', 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}

export { handler as GET, handler as POST };

