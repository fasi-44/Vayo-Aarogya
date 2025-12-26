import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse, requireAuth, hasPermission } from '@/lib/api-utils'

// GET /api/locations - Get locations with optional filters (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const parentId = searchParams.get('parentId')

    const locations = await db.getAllLocations({
      type,
      parentId: parentId === 'null' ? null : parentId || undefined,
    })

    return successResponse(locations)
  } catch (error) {
    console.error('Get locations error:', error)
    return errorResponse('Failed to get locations', 500)
  }
}

// POST /api/locations - Create a new location (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)

    if (!hasPermission(user.role, 'settings:update')) {
      return errorResponse('Forbidden', 403)
    }

    const body = await request.json()
    const { type, name, parentId } = body

    if (!type || !name) {
      return errorResponse('Type and name are required', 400)
    }

    const validTypes = ['state', 'district', 'taluk', 'village']
    if (!validTypes.includes(type)) {
      return errorResponse('Invalid location type', 400)
    }

    const location = await db.createLocation({
      type,
      name,
      parentId: parentId || undefined,
    })

    // Audit log
    await db.createAuditLog({
      userId: user.userId,
      action: 'create',
      entity: 'Location',
      entityId: location.id,
      details: { type, name, parentId },
    })

    return successResponse(location, undefined, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Unauthorized', 401)
    }
    console.error('Create location error:', error)
    return errorResponse('Failed to create location', 500)
  }
}
