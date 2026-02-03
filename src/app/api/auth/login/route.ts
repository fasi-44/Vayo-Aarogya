import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  checkRateLimit,
  validateEmail,
} from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  Errors,
  getClientIP,
  getUserAgent,
} from '@/lib/api-utils'
import { type LoginResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, rememberMe = false } = body

    // Validate input
    if (!email || !password) {
      return errorResponse(Errors.badRequest('Email and password are required'))
    }

    if (!validateEmail(email)) {
      return errorResponse(Errors.badRequest('Invalid email format'))
    }

    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitKey = `login:${clientIP}:${email.toLowerCase()}`
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000) // 5 attempts per 15 min

    if (!rateLimit.allowed) {
      // Log failed attempt
      await db.createAuditLog({
        action: 'login_rate_limited',
        entity: 'User',
        details: { email, ip: clientIP },
        ipAddress: clientIP,
        userAgent: getUserAgent(request),
      })

      return errorResponse(
        Errors.tooManyRequests(
          `Too many login attempts. Please try again in ${Math.ceil(rateLimit.resetIn / 60000)} minutes.`
        )
      )
    }

    // Find user
    const user = await db.findUserByEmail(email)
    if (!user) {
      // Log failed attempt
      await db.createAuditLog({
        action: 'login_failed',
        entity: 'User',
        details: { email, reason: 'user_not_found' },
        ipAddress: clientIP,
        userAgent: getUserAgent(request),
      })

      return errorResponse(Errors.unauthorized('Invalid email or password'))
    }

    // Check approval status
    if (user.approvalStatus === 'pending') {
      await db.createAuditLog({
        userId: user.id,
        action: 'login_failed',
        entity: 'User',
        entityId: user.id,
        details: { reason: 'pending_approval' },
        ipAddress: clientIP,
        userAgent: getUserAgent(request),
      })

      return errorResponse(Errors.forbidden('Your account is pending approval. An admin will review your request and you will receive a call shortly. Please try again later.'))
    }

    if (user.approvalStatus === 'rejected') {
      await db.createAuditLog({
        userId: user.id,
        action: 'login_failed',
        entity: 'User',
        entityId: user.id,
        details: { reason: 'approval_rejected' },
        ipAddress: clientIP,
        userAgent: getUserAgent(request),
      })

      return errorResponse(Errors.forbidden('Your registration request has been rejected. Please contact the admin for more information.'))
    }

    // Check if user is active
    if (!user.isActive) {
      // Log failed attempt
      await db.createAuditLog({
        userId: user.id,
        action: 'login_failed',
        entity: 'User',
        entityId: user.id,
        details: { reason: 'account_deactivated' },
        ipAddress: clientIP,
        userAgent: getUserAgent(request),
      })

      return errorResponse(Errors.forbidden('Your account has been deactivated. Please contact support.'))
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      // Log failed attempt
      await db.createAuditLog({
        userId: user.id,
        action: 'login_failed',
        entity: 'User',
        entityId: user.id,
        details: { reason: 'invalid_password' },
        ipAddress: clientIP,
        userAgent: getUserAgent(request),
      })

      return errorResponse(Errors.unauthorized('Invalid email or password'))
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = await generateAccessToken(tokenPayload)
    const refreshToken = await generateRefreshToken(tokenPayload, rememberMe)

    // Store refresh token (7 days or 30 days if rememberMe)
    const refreshTokenExpiry = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000)
    await db.storeRefreshToken(refreshToken, user.id, refreshTokenExpiry)

    // Update last login
    await db.updateUser(user.id, { lastLogin: new Date().toISOString() })

    // Set cookies
    await setAuthCookies(accessToken, refreshToken, rememberMe)

    // Log successful login
    await db.createAuditLog({
      userId: user.id,
      action: 'login',
      entity: 'User',
      entityId: user.id,
      details: { rememberMe },
      ipAddress: clientIP,
      userAgent: getUserAgent(request),
    })

    // Return safe user data
    const safeUser = db.toSafeUser(user)

    const response: LoginResponse = {
      user: safeUser,
      accessToken,
      refreshToken,
    }

    return successResponse(response, 'Login successful')
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse(Errors.internal('An error occurred during login'))
  }
}
