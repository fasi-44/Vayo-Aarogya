import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  successResponse,
  errorResponse,
  Errors,
  requireAuth,
  requirePermission,
  getClientIP,
  getUserAgent,
} from '@/lib/api-utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/interventions/[id] - Get a specific intervention
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requireAuth(request)

    const intervention = await db.getInterventionById(id)
    if (!intervention) {
      return errorResponse(Errors.notFound('Intervention not found'))
    }

    // Check access permissions
    const isTargetUser = intervention.userId === user.userId
    const canViewAll = ['super_admin', 'professional', 'volunteer'].includes(user.role)

    if (!isTargetUser && !canViewAll) {
      return errorResponse(Errors.forbidden('You do not have access to this intervention'))
    }

    return successResponse(intervention)
  } catch (error) {
    console.error('Get intervention error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}

// PUT /api/interventions/[id] - Update an intervention
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requirePermission(request, 'interventions:update')

    const intervention = await db.getInterventionById(id)
    if (!intervention) {
      return errorResponse(Errors.notFound('Intervention not found'))
    }

    const body = await request.json()
    const { title, description, domain, priority, status, dueDate, completedAt, notes } = body

    // If status is being set to completed, auto-set completedAt
    let finalCompletedAt = completedAt ? new Date(completedAt) : undefined
    if (status === 'completed' && !finalCompletedAt) {
      finalCompletedAt = new Date()
    }

    const updatedIntervention = await db.updateIntervention(id, {
      title,
      description,
      domain,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      completedAt: finalCompletedAt,
      notes,
    })

    // Log the action
    await db.createAuditLog({
      userId: user.userId,
      action: 'update',
      entity: 'Intervention',
      entityId: id,
      details: { status, priority },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return successResponse(updatedIntervention, 'Intervention updated successfully')
  } catch (error) {
    console.error('Update intervention error:', error)
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

// DELETE /api/interventions/[id] - Delete an intervention
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requireAuth(request)

    // Only admin and professional can delete
    if (!['super_admin', 'professional'].includes(user.role)) {
      return errorResponse(Errors.forbidden('Only administrators and professionals can delete interventions'))
    }

    const intervention = await db.getInterventionById(id)
    if (!intervention) {
      return errorResponse(Errors.notFound('Intervention not found'))
    }

    await db.deleteIntervention(id)

    // Log the action
    await db.createAuditLog({
      userId: user.userId,
      action: 'delete',
      entity: 'Intervention',
      entityId: id,
      details: { targetUserId: intervention.userId, domain: intervention.domain },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return successResponse(null, 'Intervention deleted successfully')
  } catch (error) {
    console.error('Delete intervention error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}

// PATCH /api/interventions/[id] - Mark intervention as complete
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requirePermission(request, 'interventions:update')

    const intervention = await db.getInterventionById(id)
    if (!intervention) {
      return errorResponse(Errors.notFound('Intervention not found'))
    }

    const body = await request.json()
    const { notes } = body

    const completedIntervention = await db.completeIntervention(id, notes)

    // Log the action
    await db.createAuditLog({
      userId: user.userId,
      action: 'complete',
      entity: 'Intervention',
      entityId: id,
      details: { previousStatus: intervention.status },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return successResponse(completedIntervention, 'Intervention marked as complete')
  } catch (error) {
    console.error('Complete intervention error:', error)
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
