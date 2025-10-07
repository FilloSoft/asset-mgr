import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/health',
  ];
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => {
    if (route === pathname) return true;
    // Handle dynamic routes and static assets
    if (pathname.startsWith('/_next/') || pathname.startsWith('/api/auth/')) return true;
    return false;
  });
  
  // If it's a public route, continue without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Check for authentication
  const session = await getSessionFromRequest(request);
  
  if (!session) {
    // If the request is for an API route, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If authenticated, continue to the requested route
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};