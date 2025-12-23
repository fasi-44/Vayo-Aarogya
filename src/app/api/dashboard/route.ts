import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  successResponse,
  errorResponse,
  Errors,
  requireAuth,
} from '@/lib/api-utils'

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    // Only admin, professional, and volunteer can see full dashboard
    if (!['super_admin', 'professional', 'volunteer'].includes(user.role)) {
      return errorResponse(Errors.forbidden('Access denied'))
    }

    const stats = await db.getDashboardStats()

    // Get recent assessments
    const { assessments: recentAssessments } = await db.getAllAssessments({
      page: 1,
      limit: 5,
    })

    // Get urgent interventions
    const { interventions: urgentInterventions } = await db.getAllInterventions({
      priority: 'urgent',
      status: 'pending',
      page: 1,
      limit: 5,
    })

    // Get pending interventions
    const { interventions: pendingInterventions } = await db.getAllInterventions({
      status: 'pending',
      page: 1,
      limit: 10,
    })

    return successResponse({
      stats,
      recentAssessments,
      urgentInterventions,
      pendingInterventions,
    })
  } catch (error) {
    console.error('Get dashboard error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}
