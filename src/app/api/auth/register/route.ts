import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  hashPassword,
  validatePassword,
  validateEmail,
  checkRateLimit,
} from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  Errors,
  getClientIP,
  getUserAgent,
} from '@/lib/api-utils'
import { type UserRole } from '@/types'

// Role prefix mapping for Vayo ID
const ROLE_PREFIX_MAP: Record<string, string> = {
  elderly: 'VAEL',
  family: 'VAFM',
  volunteer: 'VAVL',
  super_admin: 'VAAD',
  professional: 'VAHP',
}

// Helper to generate next Vayo ID based on role
async function generateVayoId(role: string): Promise<string> {
  const prefix = ROLE_PREFIX_MAP[role] || 'VAXX'

  const result = await db.getHighestVayoIdByPrefix(prefix)
  let nextNumber = 1

  if (result) {
    const match = result.match(new RegExp(`${prefix}(\\d+)`))
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone, role = 'family' } = body

    // Validate required fields
    if (!email || !password || !name) {
      return errorResponse(Errors.badRequest('Email, password, and name are required'))
    }

    // Validate email format
    if (!validateEmail(email)) {
      return errorResponse(Errors.badRequest('Invalid email format'))
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return errorResponse(Errors.badRequest(passwordValidation.errors.join('. ')))
    }

    // Validate role - only allow self-registration for certain roles
    const allowedRoles: UserRole[] = ['family', 'elderly', 'volunteer']
    if (!allowedRoles.includes(role as UserRole)) {
      return errorResponse(
        Errors.badRequest('Invalid role. Only family, elderly, and volunteer registrations are allowed.')
      )
    }

    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitKey = `register:${clientIP}`
    const rateLimit = checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000) // 3 registrations per hour

    if (!rateLimit.allowed) {
      return errorResponse(
        Errors.tooManyRequests(
          `Too many registration attempts. Please try again in ${Math.ceil(rateLimit.resetIn / 60000)} minutes.`
        )
      )
    }

    // Check if email already exists
    const existingUser = await db.findUserByEmail(email)
    if (existingUser) {
      return errorResponse(Errors.conflict('An account with this email already exists'))
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Auto-generate Vayo ID for non-elderly roles only
    // Elderly get their Vayo ID (patient number) when admin approves and selects a category
    const vayoId = role === 'elderly' ? undefined : await generateVayoId(role)

    // Create user with pending approval (admin must approve before login)
    const user = await db.createUser({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      phone: phone?.trim(),
      role: role as UserRole,
      isActive: false,
      emailVerified: false,
      approvalStatus: 'pending',
      vayoId,
    })

    // Log registration
    await db.createAuditLog({
      userId: user.id,
      action: 'register',
      entity: 'User',
      entityId: user.id,
      details: { role },
      ipAddress: clientIP,
      userAgent: getUserAgent(request),
    })

    // Return safe user data (no tokens - user must login separately)
    const safeUser = db.toSafeUser(user)

    return successResponse(
      { user: safeUser },
      'Your registration request has been submitted successfully. An admin will review your request and you will receive a call shortly for further information. Once approved, you will be able to login.',
      201
    )
  } catch (error) {
    console.error('Registration error:', error)
    return errorResponse(Errors.internal('An error occurred during registration'))
  }
}
