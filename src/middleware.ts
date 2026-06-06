import { NextRequest, NextResponse } from 'next/server';

const AUTH_PAGES = ['/login', '/signup'];
// All pages requiring authentication
const PROTECTED_PAGES = ['/api-docs', '/dashboard', '/onboarding'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Redirect authenticated users away from auth pages
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users away from protected pages (SSR-level guard)
  const isProtected = PROTECTED_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/api-docs',
    '/api-docs/:path*',
    '/login',
    '/signup',
  ],
};
