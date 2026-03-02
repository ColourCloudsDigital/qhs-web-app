import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // Short-circuit NextAuth API routes to avoid middleware interfering with auth endpoints
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/register', 
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/about',
    '/contact',
    '/hotels',
    '/legal',
    '/pricing',
    '/menu',
    '/qr',
    '/booking-success',
    '/payment',
    '/unauthorized',
  ];
  
  // Check if the current path is public
  const isPublicPath = publicPaths.some(publicPath => 
    pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );

  // Allow access to public paths
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // If visiting root, redirect to login (auth will handle role-based redirect)
  if (pathname === '/') {
    return NextResponse.next();
  }

  // For protected routes, let the page handle authentication
  // This prevents middleware errors and allows server components to handle auth
  return NextResponse.next();
}

// Limit middleware to specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (image assets)
     * - icon.png (PWA icon)
     * - manifest.json (PWA manifest)
     * - uploads (user uploaded content)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|icon.png|manifest.json|uploads).*)',
  ],
};