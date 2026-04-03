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

    // Elderly can only see their own follow-ups
    if (user.role === 'elderly') {
      filterElderlyId = user.userId
    }
    // Family can see follow-ups of their linked elders
    if (user.role === 'family') {
      if (elderlyId) {
        const familyElders = await db.getElderlyByFamily(user.userId)
        const isLinkedElder = familyElders.some(e => e.id === elderlyId)
        filterElderlyId = isLinkedElder ? elderlyId : user.userId
      } else {
        filterElderlyId = user.userId
      }
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

    const body = await request.json()
    const { elderlyId, type, title, description, scheduledDate, assessmentId, notes } = body
    const assigneeId = body.assigneeId && body.assigneeId.trim() !== '' ? body.assigneeId : null

    // Determine if this is a request (family/elder) or a direct schedule (admin/professional/volunteer)
    const isRequest = ['family', 'elderly'].includes(user.role)
    const canDirectSchedule = ['super_admin', 'professional', 'volunteer'].includes(user.role)

    if (!isRequest && !canDirectSchedule) {
      return errorResponse(Errors.forbidden('You do not have permission to create follow-ups'))
    }

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

    // For elderly: can only request for self
    if (user.role === 'elderly' && elderlyId !== user.userId) {
      return errorResponse(Errors.forbidden('You can only request follow-ups for yourself'))
    }

    // For family: can only request for linked elders
    if (user.role === 'family') {
      const familyElders = await db.getElderlyByFamily(user.userId)
      if (!familyElders.some(e => e.id === elderlyId)) {
        return errorResponse(Errors.forbidden('You can only request follow-ups for your linked elders'))
      }
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

    // Create follow-up — family/elder creates as "requested", others as "scheduled"
    const followUp = await db.createFollowUp({
      elderlyId,
      assigneeId,
      type: type || 'routine',
      title,
      description,
      scheduledDate: new Date(scheduledDate),
      status: isRequest ? 'requested' : 'scheduled',
      assessmentId,
      notes,
    })

    await db.createAuditLog({
      userId: user.userId,
      action: isRequest ? 'request' : 'create',
      entity: 'FollowUp',
      entityId: followUp.id,
      details: { elderlyId, type, scheduledDate, isRequest },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return successResponse(followUp, isRequest ? 'Follow-up requested successfully' : 'Follow-up scheduled successfully', 201)
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
