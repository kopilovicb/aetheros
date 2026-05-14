import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = ['/auth/login', '/auth/register', '/offline.html']
  const isPublic = publicPaths.some(path => pathname.startsWith(path))

  if (isPublic) {
    return NextResponse.next()
  }

  const token = request.cookies.get('sb-access-token')?.value ||
    request.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].split('//')[1]}-auth-token`)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json|sw.js|workbox.*).*)'],
}
