import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  successResponse,
  errorResponse,
  Errors,
  requirePermission,
  requireAuth,
  getPaginationParams,
  getClientIP,
  getUserAgent,
} from '@/lib/api-utils'

// GET /api/interventions - List all interventions
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    const { searchParams } = new URL(request.url)
    const { page, limit } = getPaginationParams(request)

    const userId = searchParams.get('userId') || undefined
    const assessmentId = searchParams.get('assessmentId') || undefined
    const domain = searchParams.get('domain') || undefined
    const priority = searchParams.get('priority') || undefined
    const status = searchParams.get('status') || undefined

    // Role-based filtering
    let filterUserId = userId

    // Family/elderly can only see their own interventions
    if (user.role === 'family' || user.role === 'elderly') {
      filterUserId = user.userId
    }

    const { interventions, total } = await db.getAllInterventions({
      userId: filterUserId,
      assessmentId,
      domain,
      priority,
      status,
      page,
      limit,
    })

    return successResponse({
      interventions,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('Get interventions error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}

// POST /api/interventions - Create a new intervention
export async function POST(request: NextRequest) {
  try {
    const user = requirePermission(request, 'interventions:create')

    const body = await request.json()
    const { userId, assessmentId, title, description, domain, priority, status, dueDate, notes } = body

    // Validate required fields
    if (!userId || !title || !domain) {
      return errorResponse(Errors.badRequest('User ID, title, and domain are required'))
    }

    // Verify user exists and is elderly
    const targetUser = await db.findUserById(userId)
    if (!targetUser) {
      return errorResponse(Errors.notFound('User not found'))
    }
    if (targetUser.role !== 'elderly') {
      return errorResponse(Errors.badRequest('Interventions can only be created for elderly users'))
    }

    // Verify assessment if provided
    if (assessmentId) {
      const assessment = await db.getAssessmentById(assessmentId)
      if (!assessment) {
        return errorResponse(Errors.notFound('Assessment not found'))
      }
      if (assessment.subjectId !== userId) {
        return errorResponse(Errors.badRequest('Assessment does not belong to this user'))
      }
    }

    // Create intervention
    const intervention = await db.createIntervention({
      userId,
      assessmentId,
      title,
      description,
      domain,
      priority: priority || 'medium',
      status: status || 'pending',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
    })

    // Log the action
    await db.createAuditLog({
      userId: user.userId,
      action: 'create',
      entity: 'Intervention',
      entityId: intervention.id,
      details: { targetUserId: userId, domain, priority },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return successResponse(intervention, 'Intervention created successfully', 201)
  } catch (error) {
    console.error('Create intervention error:', error)
    if (error instanceof Error) {
      if (error.message.includes('Authentication')) {
        return errorResponse(Errors.unauthorized())
      }
      if (error.message.includes('permission')) {
        return errorResponse(Errors.forbidden())
      }
    }
    return errorResponse(Errors.internal())
  }
}
