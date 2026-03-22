import { auth } from '@/auth'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { NextResponse, type NextRequest } from 'next/server'

const intlMiddleware = createIntlMiddleware(routing)

// Paths that should be handled by next-intl (public pages)
const PUBLIC_PAGES = ['/', '/pricing', '/about', '/report']

function isPublicPage(pathname: string): boolean {
  // Strip locale prefix if present
  const strippedPath = pathname.replace(/^\/(fr|es|it|de)(\/|$)/, '/$2') || '/'
  const normalizedPath = strippedPath === '' ? '/' : strippedPath
  return PUBLIC_PAGES.some(p =>
    normalizedPath === p || normalizedPath === p + '/'
  )
}

function isLocalePrefix(pathname: string): boolean {
  return /^\/(fr|es|it|de)(\/|$)/.test(pathname)
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // 1. Allow auth routes, public API (webhooks), and static assets
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/webhooks/')
  ) {
    return NextResponse.next()
  }

  // 2. Public pages + locale-prefixed public pages → run next-intl middleware
  if (isPublicPage(pathname) || isLocalePrefix(pathname)) {
    return intlMiddleware(req as unknown as NextRequest)
  }

  // 3. Landscape page (public, no locale)
  if (pathname === '/landscape') {
    return NextResponse.next()
  }

  // 4. Protect dashboard and API routes — reject/redirect unauthenticated users
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    if (!req.auth?.user) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/auth/login', req.nextUrl.origin)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)',
  ],
}
