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
import type { RiskLevel, AssessmentStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/assessments/[id] - Get a specific assessment
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requireAuth(request)

    const assessment = await db.getAssessmentById(id)
    if (!assessment) {
      return errorResponse(Errors.notFound('Assessment not found'))
    }

    // Check access permissions
    const isSubject = assessment.subjectId === user.userId
    const isAssessor = assessment.assessorId === user.userId
    const canViewAll = ['super_admin', 'professional'].includes(user.role)

    if (!isSubject && !isAssessor && !canViewAll) {
      return errorResponse(Errors.forbidden('You do not have access to this assessment'))
    }

    return successResponse(assessment)
  } catch (error) {
    console.error('Get assessment error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}

// PUT /api/assessments/[id] - Update an assessment (including drafts)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requirePermission(request, 'assessments:update')

    const assessment = await db.getAssessmentById(id)
    if (!assessment) {
      return errorResponse(Errors.notFound('Assessment not found'))
    }

    // Only assessor or admin can update
    const isAssessor = assessment.assessorId === user.userId
    const isAdmin = user.role === 'super_admin'

    if (!isAssessor && !isAdmin) {
      return errorResponse(Errors.forbidden('Only the assessor or admin can update this assessment'))
    }

    const body = await request.json()
    const { overallRisk, notes, domainScores, domains, status, currentStep } = body

    // Update assessment
    const updatedAssessment = await db.updateAssessment(id, {
      overallRisk: overallRisk as RiskLevel,
      status: status as AssessmentStatus,
      currentStep,
      notes,
      domainScores,
    })

    // Update domains if provided
    if (domains && Array.isArray(domains) && domains.length > 0) {
      await db.upsertAssessmentDomains(id, domains)
    }

    // Get complete updated assessment
    const completeAssessment = await db.getAssessmentById(id)

    // Determine action type for audit log
    const wasCompleted = assessment.status === 'draft' && status === 'completed'
    const actionType = wasCompleted ? 'complete_draft' : (status === 'draft' ? 'update_draft' : 'update')

    // Log the action
    await db.createAuditLog({
      userId: user.userId,
      action: actionType,
      entity: 'Assessment',
      entityId: id,
      details: { overallRisk, notes, status },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    const message = wasCompleted
      ? 'Assessment completed successfully'
      : (status === 'draft' ? 'Draft saved successfully' : 'Assessment updated successfully')

    return successResponse(completeAssessment, message)
  } catch (error) {
    console.error('Update assessment error:', error)
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

// DELETE /api/assessments/[id] - Delete an assessment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requirePermission(request, 'assessments:delete')

    const assessment = await db.getAssessmentById(id)
    if (!assessment) {
      return errorResponse(Errors.notFound('Assessment not found'))
    }

    // Only admin can delete assessments
    if (user.role !== 'super_admin') {
      return errorResponse(Errors.forbidden('Only administrators can delete assessments'))
    }

    await db.deleteAssessment(id)

    // Log the action
    await db.createAuditLog({
      userId: user.userId,
      action: 'delete',
      entity: 'Assessment',
      entityId: id,
      details: { subjectId: assessment.subjectId },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return successResponse(null, 'Assessment deleted successfully')
  } catch (error) {
    console.error('Delete assessment error:', error)
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
