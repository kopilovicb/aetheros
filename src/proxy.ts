import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = ['/auth/login', '/auth/register', '/offline.html']
  const isPublic = publicPaths.some(path => pathname.startsWith(path))

  if (isPublic) {
    return NextResponse.next()
  }

  // Check all cookies for any Supabase auth token
  const cookies = request.cookies.getAll()
  const hasAuthCookie = cookies.some(cookie =>
    cookie.name.includes('auth-token') ||
    cookie.name.includes('sb-') ||
    cookie.name === 'supabase-auth-token'
  )

  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json|sw.js|workbox.*).*)'],
}
