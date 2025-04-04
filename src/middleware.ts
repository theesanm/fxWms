import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/images/:path*'
  ]
}

export function middleware(request: NextRequest) {
  // Log the request URL for debugging
  console.log('Middleware processing URL:', request.nextUrl.pathname);

  // Allow images to be served from the public directory
  if (request.nextUrl.pathname.startsWith('/images/')) {
    console.log('Allowing image request to proceed');
    return NextResponse.next()
  }

  return NextResponse.next()
}



