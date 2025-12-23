import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  successResponse,
  errorResponse,
  Errors,
  requireAuth,
} from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const authUser = requireAuth(request)

    const user = await db.findUserById(authUser.userId)
    if (!user) {
      return errorResponse(Errors.notFound('User not found'))
    }

    if (!user.isActive) {
      return errorResponse(Errors.forbidden('Account is deactivated'))
    }

    const safeUser = db.toSafeUser(user)
    return successResponse(safeUser)
  } catch (error) {
    console.error('Get current user error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}
