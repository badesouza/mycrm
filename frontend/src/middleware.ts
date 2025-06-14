import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get token from localStorage (this won't work in middleware, we need to handle auth differently)
  const { pathname } = request.nextUrl

  // If trying to access login page while authenticated, redirect to home
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // For all other routes, let the client-side handle authentication
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 