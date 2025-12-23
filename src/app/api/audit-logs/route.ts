import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  successResponse,
  errorResponse,
  Errors,
  requireRole,
  getPaginationParams,
} from '@/lib/api-utils'

// GET /api/audit-logs - List audit logs (admin only)
export async function GET(request: NextRequest) {
  try {
    // Only super_admin can view audit logs
    requireRole(request, ['super_admin'])

    const { searchParams } = new URL(request.url)
    const { page, limit } = getPaginationParams(request)

    const userId = searchParams.get('userId') || undefined
    const action = searchParams.get('action') || undefined
    const entity = searchParams.get('entity') || undefined
    const entityId = searchParams.get('entityId') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const { logs, total } = await db.getAuditLogs({
      userId,
      action,
      entity,
      entityId,
      startDate,
      endDate,
      page,
      limit,
    })

    return successResponse({
      logs,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('Get audit logs error:', error)
    if (error instanceof Error) {
      if (error.message.includes('Authentication')) {
        return errorResponse(Errors.unauthorized())
      }
      if (error.message.includes('Access denied') || error.message.includes('Forbidden')) {
        return errorResponse(Errors.forbidden('Only administrators can view audit logs'))
      }
    }
    return errorResponse(Errors.internal())
  }
}
