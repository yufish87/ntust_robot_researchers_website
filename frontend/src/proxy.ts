import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Protected Routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    if (!token) {
      // Redirect to Login if no token
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Auth Routes (Redirect to Dashboard if already logged in)
  if (pathname === '/auth/login') {
    if (token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/auth/login'
  ],
};
