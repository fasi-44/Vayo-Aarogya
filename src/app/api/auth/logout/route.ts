import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import {
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  Errors,
  getAuthUser,
  getClientIP,
  getUserAgent,
} from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value
    const user = getAuthUser(request)

    // Revoke refresh token if present
    if (refreshToken) {
      await db.revokeRefreshToken(refreshToken)
    }

    // Log logout
    if (user.userId) {
      await db.createAuditLog({
        userId: user.userId,
        action: 'logout',
        entity: 'User',
        entityId: user.userId,
        details: {},
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
      })
    }

    // Clear cookies
    await clearAuthCookies()

    return successResponse(null, 'Logout successful')
  } catch (error) {
    console.error('Logout error:', error)
    // Still clear cookies even if there's an error
    await clearAuthCookies()
    return errorResponse(Errors.internal('An error occurred during logout'))
  }
}
