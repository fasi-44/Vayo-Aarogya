import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  successResponse,
  errorResponse,
  Errors,
  requireAuth,
  getClientIP,
  getUserAgent,
} from '@/lib/api-utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/followups/[id] - Get a specific follow-up
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requireAuth(request)

    const followUp = await db.getFollowUpById(id)
    if (!followUp) {
      return errorResponse(Errors.notFound('Follow-up not found'))
    }

    // Check access permissions
    const isElderly = followUp.elderlyId === user.userId
    const isAssignee = followUp.assigneeId === user.userId
    const canViewAll = ['super_admin', 'professional'].includes(user.role)
    const isVolunteerAssigned = user.role === 'volunteer' && isAssignee

    if (!isElderly && !canViewAll && !isVolunteerAssigned) {
      return errorResponse(Errors.forbidden('You do not have access to this follow-up'))
    }

    return successResponse(followUp)
  } catch (error) {
    console.error('Get follow-up error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}

// PUT /api/followups/[id] - Update a follow-up
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requireAuth(request)

    // Only admin, professional, and volunteer can update follow-ups
    if (!['super_admin', 'professional', 'volunteer'].includes(user.role)) {
      return errorResponse(Errors.forbidden('You do not have permission to update follow-ups'))
    }

    const followUp = await db.getFollowUpById(id)
    if (!followUp) {
      return errorResponse(Errors.notFound('Follow-up not found'))
    }

    // Volunteers can only update their own assigned follow-ups
    if (user.role === 'volunteer' && followUp.assigneeId !== user.userId) {
      return errorResponse(Errors.forbidden('You can only update follow-ups assigned to you'))
    }

    const body = await request.json()
    const { type, title, description, scheduledDate, status, completedDate, notes, assessmentId } = body
    // Handle empty string as null for optional foreign keys
    const assigneeId = body.assigneeId && body.assigneeId.trim() !== '' ? body.assigneeId : null

    // Validate type if provided
    const validTypes = ['routine', 'assessment', 'intervention', 'medication', 'other']
    if (type && !validTypes.includes(type)) {
      return errorResponse(Errors.badRequest('Invalid follow-up type'))
    }

    // Validate status if provided
    const validStatuses = ['scheduled', 'completed', 'missed', 'rescheduled', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return errorResponse(Errors.badRequest('Invalid follow-up status'))
    }

    // If status is being set to completed, auto-set completedDate
    let finalCompletedDate = completedDate ? new Date(completedDate) : undefined
    if (status === 'completed' && !finalCompletedDate) {
      finalCompletedDate = new Date()
    }

    const updatedFollowUp = await db.updateFollowUp(id, {
      assigneeId,
      type,
      title,
      description,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      status,
      completedDate: finalCompletedDate,
      notes,
    })

    // Log the action
    await db.createAuditLog({
      userId: user.userId,
      action: 'update',
      entity: 'FollowUp',
      entityId: id,
      details: { status, scheduledDate },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return successResponse(updatedFollowUp, 'Follow-up updated successfully')
  } catch (error) {
    console.error('Update follow-up error:', error)
    if (error instanceof Error) {
      if (error.message.includes('Authentication')) {
        return errorResponse(Errors.unauthorized())
      }
    }
    return errorResponse(Errors.internal())
  }
}

// DELETE /api/followups/[id] - Delete a follow-up
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requireAuth(request)

    // Only admin and professional can delete
    if (!['super_admin', 'professional'].includes(user.role)) {
      return errorResponse(Errors.forbidden('Only administrators and professionals can delete follow-ups'))
    }

    const followUp = await db.getFollowUpById(id)
    if (!followUp) {
      return errorResponse(Errors.notFound('Follow-up not found'))
    }

    await db.deleteFollowUp(id)

    // Log the action
    await db.createAuditLog({
      userId: user.userId,
      action: 'delete',
      entity: 'FollowUp',
      entityId: id,
      details: { elderlyId: followUp.elderlyId, type: followUp.type },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return successResponse(null, 'Follow-up deleted successfully')
  } catch (error) {
    console.error('Delete follow-up error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}

// PATCH /api/followups/[id] - Mark follow-up as complete
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requireAuth(request)

    // Only admin, professional, and volunteer can complete follow-ups
    if (!['super_admin', 'professional', 'volunteer'].includes(user.role)) {
      return errorResponse(Errors.forbidden('You do not have permission to complete follow-ups'))
    }

    const followUp = await db.getFollowUpById(id)
    if (!followUp) {
      return errorResponse(Errors.notFound('Follow-up not found'))
    }

    // Volunteers can only complete their assigned follow-ups
    if (user.role === 'volunteer' && followUp.assigneeId !== user.userId) {
      return errorResponse(Errors.forbidden('You can only complete follow-ups assigned to you'))
    }

    const body = await request.json()
    const { notes } = body

    const completedFollowUp = await db.completeFollowUp(id, notes)

    // Log the action
    await db.createAuditLog({
      userId: user.userId,
      action: 'complete',
      entity: 'FollowUp',
      entityId: id,
      details: { previousStatus: followUp.status },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return successResponse(completedFollowUp, 'Follow-up marked as complete')
  } catch (error) {
    console.error('Complete follow-up error:', error)
    if (error instanceof Error) {
      if (error.message.includes('Authentication')) {
        return errorResponse(Errors.unauthorized())
      }
    }
    return errorResponse(Errors.internal())
  }
}
