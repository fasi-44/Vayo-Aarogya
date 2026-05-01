import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  successResponse,
  errorResponse,
  Errors,
  requireRole,
} from '@/lib/api-utils'
import {
  setActiveElderCookie,
  clearActiveElderCookie,
  getActiveElderId,
} from '@/lib/auth'

// GET /api/family/active-elder
// Returns the family member's currently selected elder (or null).
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, ['family'])
    const activeElderId = await getActiveElderId()

    if (!activeElderId) {
      return successResponse({ activeElder: null })
    }

    const elder = await db.findUserById(activeElderId)

    // Stale cookie (elder unlinked / deleted / mismatched) → clear and return null.
    if (
      !elder ||
      elder.role !== 'elderly' ||
      elder.assignedFamily !== user.userId
    ) {
      await clearActiveElderCookie()
      return successResponse({ activeElder: null })
    }

    return successResponse({ activeElder: db.toSafeUser(elder) })
  } catch (error) {
    console.error('Get active elder error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}

// POST /api/family/active-elder
// Body: { elderId: string | null }. null clears the impersonation context.
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, ['family'])
    const body = await request.json().catch(() => ({}))
    const { elderId } = body as { elderId: string | null }

    if (elderId === null || elderId === undefined) {
      await clearActiveElderCookie()
      return successResponse({ activeElder: null }, 'Active elder cleared')
    }

    if (typeof elderId !== 'string' || !elderId.trim()) {
      return errorResponse(Errors.badRequest('elderId must be a non-empty string or null'))
    }

    const elder = await db.findUserById(elderId)
    if (!elder || elder.role !== 'elderly') {
      return errorResponse(Errors.notFound('Elder not found'))
    }
    if (elder.assignedFamily !== user.userId) {
      return errorResponse(Errors.forbidden('That elder is not linked to your account'))
    }

    await setActiveElderCookie(elder.id)
    return successResponse(
      { activeElder: db.toSafeUser(elder) },
      `Now viewing as ${elder.name}`
    )
  } catch (error) {
    console.error('Set active elder error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}
