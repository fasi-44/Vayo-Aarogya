import { NextRequest, NextResponse } from 'next/server'
import { type ApiResponse, type UserRole, rolePermissions, type Permission } from '@/types'

// Standard API Error class
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Common HTTP errors
export const Errors = {
  badRequest: (message = 'Bad request') => new ApiError(400, message, 'BAD_REQUEST'),
  unauthorized: (message = 'Unauthorized') => new ApiError(401, message, 'UNAUTHORIZED'),
  forbidden: (message = 'Forbidden') => new ApiError(403, message, 'FORBIDDEN'),
  notFound: (message = 'Not found') => new ApiError(404, message, 'NOT_FOUND'),
  conflict: (message = 'Conflict') => new ApiError(409, message, 'CONFLICT'),
  tooManyRequests: (message = 'Too many requests') => new ApiError(429, message, 'TOO_MANY_REQUESTS'),
  internal: (message = 'Internal server error') => new ApiError(500, message, 'INTERNAL_ERROR'),
}

// Success response helper
export function successResponse<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  )
}

// Error response helper
export function errorResponse(
  error: string | ApiError,
  status = 500
): NextResponse<ApiResponse> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    )
  }
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  )
}

// Get authenticated user from request headers (set by middleware)
export function getAuthUser(request: NextRequest): {
  userId: string | null
  email: string | null
  role: UserRole | null
} {
  return {
    userId: request.headers.get('x-user-id'),
    email: request.headers.get('x-user-email'),
    role: request.headers.get('x-user-role') as UserRole | null,
  }
}

// Check if user has specific permission
export function hasPermission(role: UserRole | null, permission: Permission): boolean {
  if (!role) return false
  const permissions = rolePermissions[role] || []
  return permissions.includes(permission)
}

// Check if user has any of the specified roles
export function hasRole(userRole: UserRole | null, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}

// Require authentication middleware helper
export function requireAuth(request: NextRequest): {
  userId: string
  email: string
  role: UserRole
} {
  const user = getAuthUser(request)
  if (!user.userId || !user.email || !user.role) {
    throw Errors.unauthorized('Authentication required')
  }
  return {
    userId: user.userId,
    email: user.email,
    role: user.role,
  }
}

// Require specific permission
export function requirePermission(request: NextRequest, permission: Permission): {
  userId: string
  email: string
  role: UserRole
} {
  const user = requireAuth(request)
  if (!hasPermission(user.role, permission)) {
    throw Errors.forbidden('Insufficient permissions')
  }
  return user
}

// Require specific roles
export function requireRole(request: NextRequest, allowedRoles: UserRole[]): {
  userId: string
  email: string
  role: UserRole
} {
  const user = requireAuth(request)
  if (!hasRole(user.role, allowedRoles)) {
    throw Errors.forbidden('Access denied for your role')
  }
  return user
}

// Wrap async handler with error handling
export function withErrorHandler<T>(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof ApiError) {
        return errorResponse(error) as NextResponse<ApiResponse<T>>
      }

      if (error instanceof Error) {
        // Handle Prisma errors
        if (error.message.includes('Unique constraint')) {
          return errorResponse(Errors.conflict('Record already exists')) as NextResponse<ApiResponse<T>>
        }
        if (error.message.includes('Record to update not found') ||
            error.message.includes('Record to delete does not exist')) {
          return errorResponse(Errors.notFound('Record not found')) as NextResponse<ApiResponse<T>>
        }
      }

      return errorResponse(Errors.internal()) as NextResponse<ApiResponse<T>>
    }
  }
}

// Parse pagination params
export function getPaginationParams(request: NextRequest): {
  page: number
  limit: number
  skip: number
} {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

// Get client IP from request
export function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') ||
         request.headers.get('x-real-ip') ||
         'unknown'
}

// Get user agent from request
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}
