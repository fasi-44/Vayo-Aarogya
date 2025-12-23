import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  successResponse,
  errorResponse,
  Errors,
  requireAuth,
  getPaginationParams,
  getClientIP,
  getUserAgent,
} from '@/lib/api-utils'

// GET /api/followups - List all follow-ups
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    const { searchParams } = new URL(request.url)
    const { page, limit } = getPaginationParams(request)

    const elderlyId = searchParams.get('elderlyId') || undefined
    const assigneeId = searchParams.get('assigneeId') || undefined
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    // Role-based filtering
    let filterElderlyId = elderlyId
    let filterAssigneeId = assigneeId

    // Family/elderly can only see their own follow-ups
    if (user.role === 'family' || user.role === 'elderly') {
      filterElderlyId = user.userId
    }

    // Volunteers can see follow-ups assigned to them or their assigned elderly
    if (user.role === 'volunteer') {
      if (!filterAssigneeId && !filterElderlyId) {
        filterAssigneeId = user.userId
      }
    }

    const { followUps, total } = await db.getAllFollowUps({
      elderlyId: filterElderlyId,
      assigneeId: filterAssigneeId,
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    })

    return successResponse({
      followUps,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('Get follow-ups error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}

// POST /api/followups - Create a new follow-up
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)

    // Only admin, professional, and volunteer can create follow-ups
    if (!['super_admin', 'professional', 'volunteer'].includes(user.role)) {
      return errorResponse(Errors.forbidden('You do not have permission to create follow-ups'))
    }

    const body = await request.json()
    const { elderlyId, assigneeId, type, title, description, scheduledDate, assessmentId, notes } = body

    // Validate required fields
    if (!elderlyId || !title || !scheduledDate) {
      return errorResponse(Errors.badRequest('Elderly ID, title, and scheduled date are required'))
    }

    // Validate type
    const validTypes = ['routine', 'assessment', 'intervention', 'medication', 'other']
    if (type && !validTypes.includes(type)) {
      return errorResponse(Errors.badRequest('Invalid follow-up type'))
    }

    // Verify elderly exists and is actually elderly
    const elderly = await db.findUserById(elderlyId)
    if (!elderly) {
      return errorResponse(Errors.notFound('Elderly not found'))
    }
    if (elderly.role !== 'elderly') {
      return errorResponse(Errors.badRequest('Follow-ups can only be created for elderly users'))
    }

    // Verify assignee exists if provided
    if (assigneeId) {
      const assignee = await db.findUserById(assigneeId)
      if (!assignee) {
        return errorResponse(Errors.notFound('Assignee not found'))
      }
      if (!['volunteer', 'professional', 'super_admin'].includes(assignee.role)) {
        return errorResponse(Errors.badRequest('Assignee must be a volunteer or professional'))
      }
    }

    // Create follow-up
    const followUp = await db.createFollowUp({
      elderlyId,
      assigneeId,
      type: type || 'routine',
      title,
      description,
      scheduledDate: new Date(scheduledDate),
      assessmentId,
      notes,
    })

    // Log the action
    await db.createAuditLog({
      userId: user.userId,
      action: 'create',
      entity: 'FollowUp',
      entityId: followUp.id,
      details: { elderlyId, type, scheduledDate },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return successResponse(followUp, 'Follow-up scheduled successfully', 201)
  } catch (error) {
    console.error('Create follow-up error:', error)
    if (error instanceof Error) {
      if (error.message.includes('Authentication')) {
        return errorResponse(Errors.unauthorized())
      }
    }
    return errorResponse(Errors.internal())
  }
}
