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
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    // Get all drafts for this assessor
    let drafts = await db.getDraftAssessments(user.userId)

    // Filter by subjectId if provided
    if (subjectId) {
      drafts = drafts.filter(d => d.subjectId === subjectId)
    }

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
