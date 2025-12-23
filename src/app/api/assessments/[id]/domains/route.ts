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
import type { RiskLevel } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/assessments/[id]/domains - Get all domains for an assessment
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requireAuth(request)

    // Verify assessment exists and user has access
    const assessment = await db.getAssessmentById(id)
    if (!assessment) {
      return errorResponse(Errors.notFound('Assessment not found'))
    }

    const isSubject = assessment.subjectId === user.userId
    const isAssessor = assessment.assessorId === user.userId
    const canViewAll = ['super_admin', 'professional'].includes(user.role)

    if (!isSubject && !isAssessor && !canViewAll) {
      return errorResponse(Errors.forbidden('You do not have access to this assessment'))
    }

    const domains = await db.getAssessmentDomains(id)
    return successResponse(domains)
  } catch (error) {
    console.error('Get assessment domains error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return errorResponse(Errors.unauthorized())
    }
    return errorResponse(Errors.internal())
  }
}

// POST /api/assessments/[id]/domains - Add/Update domains for an assessment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = requirePermission(request, 'assessments:update')

    // Verify assessment exists
    const assessment = await db.getAssessmentById(id)
    if (!assessment) {
      return errorResponse(Errors.notFound('Assessment not found'))
    }

    // Only assessor or admin can update domains
    const isAssessor = assessment.assessorId === user.userId
    const isAdmin = user.role === 'super_admin'

    if (!isAssessor && !isAdmin) {
      return errorResponse(Errors.forbidden('Only the assessor or admin can update assessment domains'))
    }

    const body = await request.json()
    const { domains } = body

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return errorResponse(Errors.badRequest('Domains array is required'))
    }

    // Validate each domain
    for (const domain of domains) {
      if (!domain.domain) {
        return errorResponse(Errors.badRequest('Each domain must have a domain name'))
      }
    }

    // Upsert domains
    const updatedDomains = await db.upsertAssessmentDomains(id, domains.map(d => ({
      domain: d.domain,
      riskLevel: d.riskLevel as RiskLevel,
      score: d.score,
      answers: d.answers,
      notes: d.notes,
    })))

    // Log the action
    await db.createAuditLog({
      userId: user.userId,
      action: 'update',
      entity: 'AssessmentDomain',
      entityId: id,
      details: { domainCount: domains.length },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return successResponse(updatedDomains, 'Assessment domains updated successfully')
  } catch (error) {
    console.error('Update assessment domains error:', error)
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
