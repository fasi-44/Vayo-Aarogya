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
import type { RiskLevel, AssessmentStatus } from '@prisma/client'

// GET /api/assessments - List all assessments
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    const { searchParams } = new URL(request.url)
    const { page, limit } = getPaginationParams(request)

    const subjectId = searchParams.get('subjectId') || undefined
    const assessorId = searchParams.get('assessorId') || undefined
    const overallRisk = searchParams.get('overallRisk') as RiskLevel | undefined
    const status = searchParams.get('status') as AssessmentStatus | undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    // Role-based filtering
    let filterSubjectId = subjectId
    let filterAssessorId = assessorId

    // Volunteers can only see assessments they conducted or for their assigned elderly
    if (user.role === 'volunteer') {
      if (!filterAssessorId) {
        filterAssessorId = user.userId
      }
    }
    // Family/elderly can only see their own assessments
    if (user.role === 'family' || user.role === 'elderly') {
      filterSubjectId = user.userId
    }

    const { assessments, total } = await db.getAllAssessments({
      subjectId: filterSubjectId,
      assessorId: filterAssessorId,
      overallRisk,
      status,
      startDate,
      endDate,
      page,
      limit,
    })

    return successResponse({
      assessments,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('Get assessments error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}

// POST /api/assessments - Create a new assessment (or save as draft)
export async function POST(request: NextRequest) {
  try {
    const user = requirePermission(request, 'assessments:create')

    const body = await request.json()
    const { subjectId, overallRisk, notes, domainScores, domains, status, currentStep } = body

    // Validate required fields
    if (!subjectId) {
      return errorResponse(Errors.badRequest('Subject ID is required'))
    }

    // Verify subject exists and is elderly
    const subject = await db.findUserById(subjectId)
    if (!subject) {
      return errorResponse(Errors.notFound('Subject not found'))
    }
    if (subject.role !== 'elderly') {
      return errorResponse(Errors.badRequest('Subject must be an elderly user'))
    }

    // Check if there's an existing draft for this subject by this assessor
    const existingDraft = await db.getDraftAssessment(subjectId, user.userId)

    let assessment
    if (existingDraft && status === 'draft') {
      // Update existing draft
      assessment = await db.updateAssessment(existingDraft.id, {
        overallRisk: overallRisk || 'healthy',
        status: 'draft',
        currentStep,
        notes,
        domainScores,
      })

      // Update domain results if provided
      if (domains && Array.isArray(domains) && domains.length > 0) {
        await db.upsertAssessmentDomains(existingDraft.id, domains)
      }

      // Get complete assessment with domains
      const completeAssessment = await db.getAssessmentById(existingDraft.id)

      return successResponse(completeAssessment, 'Draft updated successfully', 200)
    }

    // Create new assessment
    assessment = await db.createAssessment({
      subjectId,
      assessorId: user.userId,
      overallRisk: overallRisk || 'healthy',
      status: status || 'completed',
      currentStep,
      notes,
      domainScores,
    })

    // Create domain results if provided
    if (domains && Array.isArray(domains) && domains.length > 0) {
      await db.upsertAssessmentDomains(assessment.id, domains)
    }

    // Get complete assessment with domains
    const completeAssessment = await db.getAssessmentById(assessment.id)

    // Log the action
    await db.createAuditLog({
      userId: user.userId,
      action: status === 'draft' ? 'create_draft' : 'create',
      entity: 'Assessment',
      entityId: assessment.id,
      details: { subjectId, overallRisk, status },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    const message = status === 'draft' ? 'Draft saved successfully' : 'Assessment created successfully'
    return successResponse(completeAssessment, message, 201)
  } catch (error) {
    console.error('Create assessment error:', error)
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
