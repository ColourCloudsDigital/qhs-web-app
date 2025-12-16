import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  // Short-circuit NextAuth API routes to avoid middleware interfering with auth endpoints
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  // If visiting root, immediately open the login URL (or role dashboard if authenticated)
  if (pathname === '/') {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // Not authenticated -> send to login right away
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', '/');
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated -> redirect to role-specific dashboard
    let redirectUrl = '/login';
    const userRole = token?.role as string;
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

  // Redirect requests from the old (marketing) path to the new marketing path
  // Skip this redirect for static files like manifest.json and icon.png
  if ((pathname.startsWith('/(marketing)') || pathname.includes('/_next/static/chunks/app/(marketing)')) 
       && !pathname.includes('manifest.json') && !pathname.includes('icon.png')) {
    // Special case for chunk loading
    if (pathname.includes('/_next/static/chunks/app/(marketing)')) {
      const newPath = pathname.replace('(marketing)', 'marketing');
      url.pathname = newPath;
      return NextResponse.redirect(url);
    }
    
    // Regular page navigation
    const newPath = pathname.replace('/(marketing)', '/marketing');
    url.pathname = newPath;
    return NextResponse.redirect(url);
  }

  // Get the pathname
  const path = pathname;
  
  // Check for impersonation cookie
  const impersonationToken = request.cookies.get('impersonation_token')?.value;
  let isImpersonating = false;
  let impersonatedRole: string | null = null;
  
  // If impersonation token exists, extract data
  if (impersonationToken) {
    try {
      // Verify the impersonation token
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'impersonate-secret-key');
      const { payload } = await jwtVerify(impersonationToken, secret);
      
      isImpersonating = true;
      impersonatedRole = payload.userRole as string;
      
    } catch (error) {
      console.error('Invalid impersonation token:', error);
      
      // Remove the invalid impersonation token
      const response = NextResponse.next();
      response.cookies.delete('impersonation_token');
      return response;
    }
  }
  
  // Check for end impersonation request
  if (path === '/api/admin/users/end-impersonation') {
    const response = NextResponse.redirect(new URL('/admin/dashboard', request.url));
    response.cookies.delete('impersonation_token');
    return response;
  }
  
  // Original middleware logic
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  let userRole = token?.role as string;
  
  // Override the role if impersonating
  if (isImpersonating && impersonatedRole && token?.role === 'SUPER_ADMIN') {
    userRole = impersonatedRole;
  }
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/register', 
    '/forgot-password',
    '/',
    '/about',
    '/contact',
    '/hotels',
    '/marketing',
    '/pricing',
    '/menu',
    '/qr',
  ];
  
  // Check if the current path is public
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );

  // Allow access to public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  // Handle role-based routing with impersonation in mind
  if (path.startsWith('/admin') && userRole !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (path.startsWith('/vendor') && userRole !== 'VENDOR') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (path.startsWith('/customer') && userRole !== 'CUSTOMER') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (path.startsWith('/staff') && userRole !== 'STAFF') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  // Redirect root dashboard to role-specific dashboard
  if (path === '/dashboard') {
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

  // Add impersonation info to response for client-side access
  const response = NextResponse.next();
  
  if (isImpersonating && token?.role === 'SUPER_ADMIN') {
    
    // Set a client-readable cookie with impersonation status
    response.cookies.set({
      name: 'is_impersonating',
      value: 'true',
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8 // 8 hours
    });
    
    response.cookies.set({
      name: 'impersonated_role',
      value: impersonatedRole || '',
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8 // 8 hours
    });
    
    // Important: Add headers to the response that can be read by server components
    response.headers.set('x-is-impersonating', 'true');
    response.headers.set('x-impersonated-role', impersonatedRole || '');
    response.headers.set('x-original-role', token.role);
  } else {
    // Clear impersonation cookies if not impersonating
    response.cookies.delete('is_impersonating');
    response.cookies.delete('impersonated_role');
  }

  return response;
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