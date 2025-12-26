import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { type UserRole, type Permission, rolePermissions } from '@/types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vayo-aarogya-super-secret-key-change-in-production'
)

const ACCESS_TOKEN_COOKIE = 'vayo_access_token'

// Route protection configuration
interface RouteConfig {
  path: string
  roles?: UserRole[]
  permissions?: Permission[]
  public?: boolean
}

const routeConfigs: RouteConfig[] = [
  // Public routes
  { path: '/', public: true },
  { path: '/auth', public: true },
  { path: '/api/auth/login', public: true },
  { path: '/api/auth/register', public: true },
  { path: '/api/auth/refresh', public: true },

  // Dashboard - all authenticated users
  { path: '/dashboard', roles: ['super_admin', 'professional', 'volunteer', 'family', 'elderly'] },

  // Admin only routes
  { path: '/dashboard/settings', roles: ['super_admin'] },
  { path: '/dashboard/users', roles: ['super_admin', 'professional'] },
  // /api/users - allow all authenticated users, API handles granular permissions
  // (volunteers can create/update elderly, family can create elderly)
  { path: '/api/users', roles: ['super_admin', 'professional', 'volunteer', 'family'] },

  // Assessment routes
  { path: '/dashboard/assessments', permissions: ['assessments:read'] },
  { path: '/api/assessments', permissions: ['assessments:read'] },

  // Elderly management
  { path: '/dashboard/elderly', permissions: ['elderly:read'] },
  { path: '/api/elderly', permissions: ['elderly:read'] },

  // Reports
  { path: '/dashboard/reports', permissions: ['reports:read'] },
  { path: '/api/reports', permissions: ['reports:read'] },
]

function matchRoute(pathname: string, routePath: string): boolean {
  // Exact match
  if (pathname === routePath) return true

  // Check if pathname starts with routePath (for nested routes)
  if (pathname.startsWith(routePath + '/')) return true

  return false
}

function getRouteConfig(pathname: string): RouteConfig | undefined {
  // Find the most specific matching route (longest path)
  let bestMatch: RouteConfig | undefined
  let bestMatchLength = 0

  for (const config of routeConfigs) {
    if (matchRoute(pathname, config.path) && config.path.length > bestMatchLength) {
      bestMatch = config
      bestMatchLength = config.path.length
    }
  }

  return bestMatch
}

function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

function hasRequiredPermission(userRole: UserRole, requiredPermissions: Permission[]): boolean {
  const userPermissions = rolePermissions[userRole] || []
  return requiredPermissions.some(permission => userPermissions.includes(permission))
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // file extensions
  ) {
    return NextResponse.next()
  }

  // Get route configuration
  const routeConfig = getRouteConfig(pathname)

  // If no specific config found, check if it's a protected path
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/auth'))

  // Public routes - allow through
  if (routeConfig?.public) {
    return NextResponse.next()
  }

  // If not a protected path and no specific config, allow through
  if (!isProtectedPath && !routeConfig) {
    return NextResponse.next()
  }

  // Get access token from cookie
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value

  // No token - redirect to login or return 401 for API
  if (!accessToken) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  try {
    const { payload } = await jwtVerify(accessToken, JWT_SECRET)
    const userRole = payload.role as UserRole

    // Check role-based access
    if (routeConfig?.roles && !hasRequiredRole(userRole, routeConfig.roles)) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Check permission-based access
    if (routeConfig?.permissions && !hasRequiredPermission(userRole, routeConfig.permissions)) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Add user info to headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.userId as string)
    response.headers.set('x-user-email', payload.email as string)
    response.headers.set('x-user-role', userRole)

    return response
  } catch {
    // Token expired or invalid
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Clear invalid cookie and redirect to login
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete(ACCESS_TOKEN_COOKIE)
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
