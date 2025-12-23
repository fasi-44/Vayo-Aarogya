import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import {
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  Errors,
  getClientIP,
  getUserAgent,
} from '@/lib/api-utils'

interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or body
    const cookieStore = await cookies()
    let refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

    if (!refreshToken) {
      const body = await request.json().catch(() => ({}))
      refreshToken = body.refreshToken
    }

    if (!refreshToken) {
      return errorResponse(Errors.unauthorized('Refresh token is required'))
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken)
    if (!payload || payload.type !== 'refresh') {
      return errorResponse(Errors.unauthorized('Invalid or expired refresh token'))
    }

    // Check if refresh token is in database
    const storedUserId = await db.getRefreshTokenUserId(refreshToken)
    if (!storedUserId || storedUserId !== payload.userId) {
      return errorResponse(Errors.unauthorized('Refresh token has been revoked'))
    }

    // Get user
    const user = await db.findUserById(payload.userId)
    if (!user || !user.isActive) {
      return errorResponse(Errors.unauthorized('User not found or deactivated'))
    }

    // Revoke old refresh token
    await db.revokeRefreshToken(refreshToken)

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const newAccessToken = await generateAccessToken(tokenPayload)
    const newRefreshToken = await generateRefreshToken(tokenPayload)

    // Store new refresh token (7 days)
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await db.storeRefreshToken(newRefreshToken, user.id, refreshTokenExpiry)

    // Set new cookies
    cookieStore.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 60 minutes
    })

    cookieStore.set(REFRESH_TOKEN_COOKIE, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    // Log token refresh
    await db.createAuditLog({
      userId: user.id,
      action: 'token_refresh',
      entity: 'User',
      entityId: user.id,
      details: {},
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    const response: RefreshResponse = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }

    return successResponse(response, 'Tokens refreshed successfully')
  } catch (error) {
    console.error('Token refresh error:', error)
    return errorResponse(Errors.internal('An error occurred while refreshing tokens'))
  }
}
