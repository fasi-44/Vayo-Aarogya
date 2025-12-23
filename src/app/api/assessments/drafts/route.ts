import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  successResponse,
  errorResponse,
  Errors,
  requireAuth,
} from '@/lib/api-utils'

// GET /api/assessments/drafts - Get all draft assessments for the current user
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    // Get all drafts for this assessor
    const drafts = await db.getDraftAssessments(user.userId)

    return successResponse({
      drafts,
      total: drafts.length,
    })
  } catch (error) {
    console.error('Get draft assessments error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}
