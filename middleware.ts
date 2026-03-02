import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // Short-circuit NextAuth API routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // Get the token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const userRole = token?.role as string;
  
  // If visiting root, redirect based on auth status
  if (pathname === '/') {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', '/');
      return NextResponse.redirect(loginUrl);
    }

    // Redirect to role-specific dashboard
    let redirectUrl = '/login';
    switch (userRole) {
      case 'SUPER_ADMIN':
        redirectUrl = '/admin/dashboard';
        break;
      case 'VENDOR':
        redirectUrl = '/vendor/dashboard';
        break;
      case 'CUSTOMER':
        redirectUrl = '/customer/dashboard';
        break;
      case 'STAFF':
        redirectUrl = '/staff/dashboard';
        break;
    }
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Public paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/register', 
    '/forgot-password',
    '/about',
    '/contact',
    '/hotels',
    '/marketing',
    '/pricing',
    '/menu',
    '/qr',
    '/legal',
  ];
  
  // Check if the current path is public
  const isPublicPath = publicPaths.some(publicPath => 
    pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );

  // Allow access to public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle role-based routing
  if (pathname.startsWith('/admin') && userRole !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/vendor') && userRole !== 'VENDOR') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/customer') && userRole !== 'CUSTOMER') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/staff') && userRole !== 'STAFF') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  // Redirect root dashboard to role-specific dashboard
  if (pathname === '/dashboard') {
    let redirectUrl = '/login';
    switch (userRole) {
      case 'SUPER_ADMIN':
        redirectUrl = '/admin/dashboard';
        break;
      case 'VENDOR':
        redirectUrl = '/vendor/dashboard';
        break;
      case 'CUSTOMER':
        redirectUrl = '/customer/dashboard';
        break;
      case 'STAFF':
        redirectUrl = '/staff/dashboard';
        break;
    }
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

// Limit middleware to specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/public (Public API routes)
     * - api/auth (NextAuth routes)
     * - api/hotels (Hotel API routes)
     * - api/rooms (Room API routes)
     * - api/bookings (Booking API routes) 
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (image assets)
     * - icon.png (PWA icon)
     * - manifest.json (PWA manifest)
     * - uploads (user uploaded content)
     * - marketing (marketing routes)
     */
    '/((?!api/public|api/auth|api/hotels|api/rooms|api/bookings|_next/static|_next/image|favicon.ico|assets|icon.png|manifest.json|uploads|marketing).*)',
    '/api/admin/:path*',
    '/api/vendor/:path*',
    '/api/customer/:path*',
    '/api/staff/:path*'
  ],
};