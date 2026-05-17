import { NextRequest, NextResponse } from 'next/server';

const AUTH_PAGES = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth state primarily lives in the browser store. Middleware can only read
  // cookies, so protected routes are guarded in the client dashboard layout.
  const authCookie = request.cookies.get('auth-token')?.value;
  const authStore = request.cookies.get('auth-store')?.value;

  let isAuthenticated = Boolean(authCookie);

  if (!isAuthenticated && authStore) {
    try {
      const parsed = JSON.parse(decodeURIComponent(authStore));
      isAuthenticated = Boolean(parsed?.state?.token);
    } catch {
      // Malformed cookie: keep the user unauthenticated for auth-page redirects.
    }
  }

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/login',
    '/signup',
  ],
};
